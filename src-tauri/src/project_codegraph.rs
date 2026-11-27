use crate::{
    commands::St,
    error::{AppError, AppResult},
    hc::{which_in_login_shell, Hc, Terminal},
    state::AppState,
    store,
};
use serde::{Deserialize, Serialize};
use std::{
    env,
    ffi::OsString,
    path::{Path, PathBuf},
    process::Output,
    time::Duration,
};
use tauri::State;
use tokio::{fs, io::AsyncWriteExt, process::Command, sync::Mutex, time::timeout};

const RUN_LABEL: (&str, &str) = ("herdsman.task", "codegraph");
const CHECKOUT_LABEL: &str = "herdsman.checkout";
const EXCLUDE: &str = "/.codegraph/";

#[derive(Default)]
pub(crate) struct Codegraph(Mutex<()>);

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub(crate) enum Action {
    Init,
    Refresh,
    Exclude,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct IndexStats {
    file_count: Option<u64>,
    node_count: Option<u64>,
    last_indexed: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct IndexStatus {
    tool_available: bool,
    indexed: bool,
    ignored: bool,
    tracked: bool,
    running: bool,
    runtime_error: Option<String>,
    run_error: Option<String>,
    stats: Option<IndexStats>,
}

async fn checkout(st: &AppState, project_id: &str) -> AppResult<PathBuf> {
    let project = store::project_get(&st.db.lock(), project_id)?;
    let root = fs::canonicalize(&project.path).await?;
    if root.to_str().is_none() {
        return Err(AppError::new(
            "codegraph_project",
            "CodeGraph requires a UTF-8 project path.",
        ));
    }
    let home = env::var_os("HOME").and_then(|path| std::fs::canonicalize(path).ok());
    if root.parent().is_none() || home.as_deref() == Some(root.as_path()) {
        return Err(AppError::new(
            "codegraph_project",
            "Select a Git project outside the home or filesystem root.",
        ));
    }
    let top = git_text(&root, &["rev-parse", "--show-toplevel"]).await?;
    if fs::canonicalize(top).await? != root {
        return Err(AppError::new(
            "codegraph_project",
            "CodeGraph Index requires the root of a Git checkout.",
        ));
    }
    Ok(root)
}

async fn git(root: &Path, args: &[&str]) -> AppResult<Output> {
    Ok(Command::new("git")
        .current_dir(root)
        .args(args)
        .output()
        .await?)
}

async fn git_text(root: &Path, args: &[&str]) -> AppResult<String> {
    let output = git(root, args).await?;
    if !output.status.success() {
        return Err(AppError::new(
            "git",
            String::from_utf8_lossy(&output.stderr).trim(),
        ));
    }
    Ok(String::from_utf8_lossy(&output.stdout)
        .trim_end_matches(['\r', '\n'])
        .to_owned())
}

async fn ignored(root: &Path) -> AppResult<bool> {
    let output = git(root, &["check-ignore", "-q", "--", ".codegraph/"]).await?;
    match output.status.code() {
        Some(0) => Ok(true),
        Some(1) => Ok(false),
        _ => Err(AppError::new(
            "git",
            String::from_utf8_lossy(&output.stderr).trim(),
        )),
    }
}

async fn tracked(root: &Path) -> AppResult<bool> {
    Ok(!git_text(root, &["ls-files", "--", ".codegraph"])
        .await?
        .is_empty())
}

async fn index_exists(root: &Path) -> AppResult<bool> {
    match fs::symlink_metadata(root.join(".codegraph")).await {
        Ok(metadata) if metadata.is_dir() => Ok(true),
        Ok(_) => Err(AppError::new(
            "codegraph_path",
            ".codegraph exists and is not a local directory.",
        )),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(false),
        Err(error) => Err(error.into()),
    }
}

async fn ensure_excluded(root: &Path) -> AppResult<()> {
    if ignored(root).await? {
        return Ok(());
    }
    let path = PathBuf::from(
        git_text(
            root,
            &[
                "rev-parse",
                "--path-format=absolute",
                "--git-path",
                "info/exclude",
            ],
        )
        .await?,
    );
    let old = match fs::read(&path).await {
        Ok(old) => old,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Vec::new(),
        Err(e) => return Err(e.into()),
    };
    let equivalent = old.split(|byte| *byte == b'\n').any(|line| {
        matches!(
            String::from_utf8_lossy(line).trim_end(),
            ".codegraph" | ".codegraph/" | "/.codegraph" | EXCLUDE
        )
    });
    if !equivalent {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).await?;
        }
        let prefix = if old.is_empty() || old.ends_with(b"\n") {
            ""
        } else {
            "\n"
        };
        let mut file = fs::OpenOptions::new()
            .append(true)
            .create(true)
            .open(&path)
            .await?;
        file.write_all(format!("{prefix}{EXCLUDE}\n").as_bytes())
            .await?;
        file.flush().await?;
    }
    if !ignored(root).await? {
        return Err(AppError::new(
            "codegraph_ignore",
            "Git still does not ignore .codegraph/. Check the repository's ignore rules.",
        ));
    }
    Ok(())
}

async fn find_tool() -> Option<PathBuf> {
    let candidates = env::var_os("PATH")
        .into_iter()
        .flat_map(|path| env::split_paths(&path).collect::<Vec<_>>())
        .map(|path| path.join("codegraph"))
        .chain(env::var_os("HOME").map(|path| PathBuf::from(path).join(".local/bin/codegraph")));
    if let Some(path) = candidates.filter(|path| path.is_absolute()).find(|path| {
        use std::os::unix::fs::PermissionsExt;
        path.metadata()
            .is_ok_and(|metadata| metadata.is_file() && metadata.permissions().mode() & 0o111 != 0)
    }) {
        return Some(path);
    }
    tokio::task::spawn_blocking(|| which_in_login_shell("codegraph"))
        .await
        .ok()
        .flatten()
}

// npm installations may need the node executable beside the CLI shim even from a desktop launch.
fn tool_path(tool: &Path) -> OsString {
    let current = env::var_os("PATH").unwrap_or_else(|| "/usr/bin:/bin".into());
    env::join_paths(
        tool.parent()
            .into_iter()
            .map(Path::to_path_buf)
            .chain(env::split_paths(&current)),
    )
    .unwrap_or(current)
}

async fn stats(root: &Path, tool: &Path) -> Option<IndexStats> {
    let output = timeout(
        Duration::from_secs(5),
        Command::new(tool)
            .current_dir(root)
            .env("PATH", tool_path(tool))
            .args(["status", "--json"])
            .kill_on_drop(true)
            .output(),
    )
    .await
    .ok()?
    .ok()?;
    if !output.status.success() {
        return None;
    }
    serde_json::from_slice(&output.stdout).ok()
}

fn checkout_label(root: &Path) -> &str {
    root.to_str().expect("project paths originate as UTF-8")
}

async fn latest_run(hc: &Hc, root: &Path) -> AppResult<Option<Terminal>> {
    Ok(hc
        .list(&[RUN_LABEL, (CHECKOUT_LABEL, checkout_label(root))], true)
        .await?
        .into_iter()
        .max_by_key(|run| (run.state == "live", run.created_ms)))
}

#[tauri::command]
pub(crate) async fn project_codegraph_status(
    st: St<'_>,
    project_id: String,
) -> AppResult<IndexStatus> {
    let root = checkout(&st, &project_id).await?;
    let tool = find_tool().await;
    let indexed = index_exists(&root).await?;
    let runtime = match st.hc() {
        Ok(hc) => latest_run(hc, &root).await.map(|run| (hc, run)),
        Err(error) => Err(error),
    };
    let mut status = IndexStatus {
        tool_available: tool.is_some(),
        indexed,
        ignored: ignored(&root).await?,
        tracked: tracked(&root).await?,
        running: false,
        runtime_error: None,
        run_error: None,
        stats: None,
    };
    match runtime {
        Ok((hc, Some(run))) => {
            status.running = run.state == "live";
            if !status.running && run.exit_code != Some(0) {
                let output = hc.read(&run.address, 4).await.unwrap_or_default();
                let detail = output.trim();
                let detail: String = detail.chars().take(500).collect();
                let reason = run
                    .exit_code
                    .map_or("CodeGraph did not complete.".to_owned(), |code| {
                        format!("CodeGraph exited with code {code}.")
                    });
                status.run_error = Some(if detail.is_empty() {
                    reason
                } else {
                    format!("{reason} {detail}")
                });
            }
        }
        Ok((_, None)) => {}
        Err(error) => status.runtime_error = Some(error.message),
    }
    if status.indexed && !status.running {
        if let Some(tool) = tool {
            status.stats = stats(&root, &tool).await;
        }
    }
    Ok(status)
}

#[tauri::command]
pub(crate) async fn project_codegraph_run(
    st: St<'_>,
    state: State<'_, Codegraph>,
    project_id: String,
    action: Action,
) -> AppResult<()> {
    let _guard = state.0.lock().await;
    let root = checkout(&st, &project_id).await?;
    let indexed = index_exists(&root).await?;
    if matches!(action, Action::Exclude) {
        if !indexed || tracked(&root).await? {
            return Err(AppError::new(
                "codegraph_ignore",
                "Only an untracked, existing index can be added to local Git exclude.",
            ));
        }
        return ensure_excluded(&root).await;
    }
    let hc = st.hc()?;
    let latest = latest_run(hc, &root).await?;
    if latest.as_ref().is_some_and(|run| run.state == "live") {
        return Ok(());
    }
    let tool = find_tool()
        .await
        .ok_or_else(|| AppError::new("codegraph_missing", "CodeGraph CLI was not found."))?;
    let mut argv = vec![
        "/usr/bin/env".into(),
        format!("PATH={}", tool_path(&tool).to_string_lossy()),
        tool.to_string_lossy().into_owned(),
    ];
    match action {
        Action::Init => {
            if tracked(&root).await? {
                return Err(AppError::new(
                    "codegraph_tracked",
                    "This repository tracks files in .codegraph/.",
                ));
            }
            if indexed
                && stats(&root, &tool)
                    .await
                    .is_some_and(|stats| stats.last_indexed.is_some())
            {
                return Err(AppError::new(
                    "codegraph_indexed",
                    "This project already has an index. Refresh it instead.",
                ));
            }
            ensure_excluded(&root).await?;
            argv.extend(["init".into(), "--yes".into()]);
        }
        Action::Refresh if indexed => argv.push("sync".into()),
        Action::Refresh => {
            return Err(AppError::new(
                "codegraph_missing_index",
                "Initialize the project index first.",
            ))
        }
        Action::Exclude => unreachable!(),
    }
    hc.run(
        &argv,
        checkout_label(&root),
        &[
            (RUN_LABEL.0, RUN_LABEL.1.into()),
            (CHECKOUT_LABEL, checkout_label(&root).into()),
        ],
    )
    .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::os::unix::fs::PermissionsExt;

    #[tokio::test]
    async fn excludes_indexes_locally_in_a_shared_worktree_without_touching_tracked_files() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("repo");
        let worktree = temp.path().join("linked worktree");
        fs::create_dir(&root).await.unwrap();
        git_text(&root, &["init", "-q"]).await.unwrap();
        fs::write(root.join(".gitignore"), "example/\n")
            .await
            .unwrap();
        git_text(&root, &["add", ".gitignore"]).await.unwrap();
        git_text(
            &root,
            &[
                "-c",
                "user.name=Test",
                "-c",
                "user.email=test@example.com",
                "commit",
                "-qm",
                "initial",
            ],
        )
        .await
        .unwrap();
        git_text(
            &root,
            &["worktree", "add", "--detach", worktree.to_str().unwrap()],
        )
        .await
        .unwrap();

        let exclude = root.join(".git/info/exclude");
        fs::remove_file(&exclude).await.unwrap();
        ensure_excluded(&worktree).await.unwrap();
        assert_eq!(
            fs::read_to_string(&exclude).await.unwrap(),
            "/.codegraph/\n"
        );

        fs::write(&exclude, "# Existing rule\nprivate.txt")
            .await
            .unwrap();
        ensure_excluded(&root).await.unwrap();
        ensure_excluded(&worktree).await.unwrap();
        assert_eq!(
            fs::read_to_string(&exclude).await.unwrap(),
            "# Existing rule\nprivate.txt\n/.codegraph/\n"
        );
        for checkout in [&root, &worktree] {
            fs::create_dir(checkout.join(".codegraph")).await.unwrap();
            fs::write(checkout.join(".codegraph/example"), "index")
                .await
                .unwrap();
            assert!(git_text(checkout, &["status", "--porcelain"])
                .await
                .unwrap()
                .is_empty());
            assert_eq!(
                fs::read_to_string(checkout.join(".gitignore"))
                    .await
                    .unwrap(),
                "example/\n"
            );
        }
        for rule in [".codegraph", ".codegraph/", "/.codegraph", "/.codegraph/"] {
            fs::write(&exclude, rule).await.unwrap();
            ensure_excluded(&worktree).await.unwrap();
            assert_eq!(fs::read_to_string(&exclude).await.unwrap(), rule);
        }

        git_text(&root, &["add", "-f", ".codegraph/example"])
            .await
            .unwrap();
        assert!(tracked(&root).await.unwrap());
        assert!(!tracked(&worktree).await.unwrap());
    }

    #[tokio::test]
    async fn terminal_status_recovers_a_live_run_using_the_checkout_label() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("project with spaces");
        let executable = temp.path().join("hc");
        fs::write(&executable, r#"#!/bin/sh
[ "$1" = events ] && [ "$3" = --label ] &&
[ "$4" = herdsman.task=codegraph ] &&
[ "${6##*/}" = 'project with spaces' ] || exit 1
printf '%s\n' '{"terminals":[{"address":"t1","state":"finished","exit_code":0,"created_ms":10},{"address":"t2","state":"live","created_ms":20}]}'
"#).await.unwrap();
        fs::set_permissions(&executable, std::fs::Permissions::from_mode(0o700))
            .await
            .unwrap();
        let hc = Hc { bin: executable };
        let run = latest_run(&hc, &root).await.unwrap().unwrap();
        assert_eq!(run.address, "t2");
        assert_eq!(run.state, "live");
    }
}
