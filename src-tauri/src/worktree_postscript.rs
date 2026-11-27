use crate::commands::St;
use crate::error::{AppError, AppResult};
use crate::{git, state::AppState, store};
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use std::path::Path;
use std::process::Stdio;
use std::sync::Arc;
use tokio::io::{AsyncRead, AsyncReadExt};
use tokio::process::Command;

#[derive(Debug, Default, Serialize)]
pub struct PostscriptRun {
    status: String,
    stdout: String,
    stderr: String,
    error: Option<String>,
}

fn get_command(db: &Connection, project_id: &str) -> AppResult<Option<String>> {
    Ok(db
        .query_row(
            "SELECT command FROM project_postscripts WHERE project_id = ?1",
            [project_id],
            |row| row.get(0),
        )
        .optional()?)
}

fn set_command(db: &Connection, project_id: &str, command: &str) -> AppResult<()> {
    if command.trim().is_empty() {
        db.execute(
            "DELETE FROM project_postscripts WHERE project_id = ?1",
            [project_id],
        )?;
    } else {
        db.execute(
            "INSERT INTO project_postscripts (project_id, command) VALUES (?1, ?2)
             ON CONFLICT(project_id) DO UPDATE SET command = excluded.command",
            params![project_id, command],
        )?;
    }
    Ok(())
}

async fn check_git_project(st: &AppState, project_id: &str) -> AppResult<()> {
    let project = store::project_get(&st.db.lock(), project_id)?;
    if !git::is_repo(Path::new(&project.path)).await {
        return Err(AppError::new(
            "not_a_repo",
            "Worktree Postscript requires a Git project.",
        ));
    }
    Ok(())
}

#[tauri::command]
pub async fn project_postscript_get(st: St<'_>, project_id: String) -> AppResult<Option<String>> {
    check_git_project(&st, &project_id).await?;
    get_command(&st.db.lock(), &project_id)
}

#[tauri::command]
pub async fn project_postscript_set(
    st: St<'_>,
    project_id: String,
    command: String,
) -> AppResult<()> {
    check_git_project(&st, &project_id).await?;
    set_command(&st.db.lock(), &project_id, &command)
}

fn get_run(db: &Connection, workspace_id: &str) -> AppResult<Option<PostscriptRun>> {
    Ok(db
        .query_row(
            "SELECT status, stdout, stderr, error FROM workspace_postscripts WHERE workspace_id = ?1",
            [workspace_id],
            |row| Ok(PostscriptRun {
                status: row.get(0)?,
                stdout: row.get(1)?,
                stderr: row.get(2)?,
                error: row.get(3)?,
            }),
        )
        .optional()?)
}

#[tauri::command]
pub fn workspace_postscript_get(
    st: St<'_>,
    workspace_id: String,
) -> AppResult<Option<PostscriptRun>> {
    get_run(&st.db.lock(), &workspace_id)
}

pub fn is_running(db: &Connection, workspace_id: &str) -> AppResult<bool> {
    Ok(db.query_row(
        "SELECT EXISTS(SELECT 1 FROM workspace_postscripts WHERE workspace_id = ?1 AND status = 'running')",
        [workspace_id],
        |row| row.get(0),
    )?)
}

pub fn interrupt_unfinished(db: &Connection) -> AppResult<()> {
    db.execute(
        "UPDATE workspace_postscripts SET status = 'interrupted' WHERE status = 'running'",
        [],
    )?;
    Ok(())
}

fn reserve(db: &Connection, workspace: &store::Workspace) -> AppResult<Option<String>> {
    if workspace.dir_kind != "worktree" {
        return Ok(None);
    }
    let workspace = store::workspace_get(db, &workspace.id)?;
    if workspace.deleted_at.is_some()
        || workspace.archived_at.is_some()
        || workspace.worktree_removed
    {
        return Ok(None);
    }
    let Some(command) = get_command(db, &workspace.project_id)? else {
        return Ok(None);
    };
    let inserted = db.execute(
        "INSERT INTO workspace_postscripts (workspace_id, status) VALUES (?1, 'running')
         ON CONFLICT(workspace_id) DO NOTHING",
        [&workspace.id],
    )?;
    Ok((inserted == 1).then_some(command))
}

pub fn start(st: Arc<AppState>, workspace: &store::Workspace) -> AppResult<()> {
    let Some(command) = reserve(&st.db.lock(), workspace)? else {
        return Ok(());
    };
    let id = workspace.id.clone();
    let directory = workspace.work_dir.clone();
    tauri::async_runtime::spawn(async move {
        let run = execute(Path::new(&directory), &command).await;
        if let Err(error) = st.db.lock().execute(
            "UPDATE workspace_postscripts SET status = ?2, stdout = ?3, stderr = ?4, error = ?5
             WHERE workspace_id = ?1 AND status = 'running'",
            params![id, run.status, run.stdout, run.stderr, run.error],
        ) {
            eprintln!("Could not save worktree postscript result: {error}");
        }
    });
    Ok(())
}

async fn capture(mut reader: impl AsyncRead + Unpin, output: &mut Vec<u8>) {
    const LIMIT: usize = 64 * 1024;
    let mut buffer = [0; 4096];
    while let Ok(count @ 1..) = reader.read(&mut buffer).await {
        let remaining = LIMIT.saturating_sub(output.len());
        output.extend_from_slice(&buffer[..count.min(remaining)]);
        if count > remaining && output.len() == LIMIT {
            output.extend_from_slice(b"\n[Output truncated]");
        }
    }
}

async fn execute(directory: &Path, command: &str) -> PostscriptRun {
    let child = Command::new("/bin/sh")
        .args(["-c", command])
        .current_dir(directory)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn();
    let mut child = match child {
        Ok(child) => child,
        Err(error) => {
            return PostscriptRun {
                status: "failed".into(),
                error: Some(format!("Could not start postscript: {error}")),
                ..PostscriptRun::default()
            }
        }
    };

    let mut stdout = Vec::new();
    let mut stderr = Vec::new();
    let stdout_pipe = child.stdout.take().expect("piped stdout");
    let stderr_pipe = child.stderr.take().expect("piped stderr");
    let drains = async {
        tokio::join!(
            capture(stdout_pipe, &mut stdout),
            capture(stderr_pipe, &mut stderr)
        );
    };
    let result = {
        tokio::pin!(drains);
        tokio::select! {
            result = child.wait() => {
                // Descendants can hold the pipes open after the script exits.
                let _ = tokio::time::timeout(std::time::Duration::from_millis(250), &mut drains).await;
                result
            }
            () = &mut drains => child.wait().await,
        }
    };
    let error = match result {
        Ok(status) if status.success() => None,
        Ok(status) => Some(format!("Postscript exited with {status}.")),
        Err(error) => Some(format!("Could not wait for postscript: {error}")),
    };
    PostscriptRun {
        status: if error.is_none() {
            "succeeded"
        } else {
            "failed"
        }
        .into(),
        stdout: String::from_utf8_lossy(&stdout).into_owned(),
        stderr: String::from_utf8_lossy(&stderr).into_owned(),
        error,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn runs_once_in_each_worktree_and_preserves_results() {
        let root = tempfile::tempdir().unwrap();
        let repo = root.path().join("repo");
        std::fs::create_dir(&repo).unwrap();
        let git = |args: &[&str]| {
            let output = std::process::Command::new("git")
                .current_dir(&repo)
                .args(args)
                .output()
                .unwrap();
            assert!(output.status.success(), "{:?}: {:?}", args, output);
        };
        git(&["init", "-b", "main"]);
        git(&[
            "-c",
            "user.name=Test",
            "-c",
            "user.email=test@example.com",
            "commit",
            "--allow-empty",
            "-m",
            "Initial",
        ]);
        git(&["branch", "existing"]);
        let fresh = root.path().join("fresh");
        let existing = root.path().join("existing");
        git::worktree_add(&repo, &fresh, "fresh", "main")
            .await
            .unwrap();
        git::worktree_add_existing(&repo, &existing, "existing")
            .await
            .unwrap();

        let path = root.path().join("test.db");
        let db = store::open(&path).unwrap();
        let st = Arc::new(AppState::new(
            Box::new(|_, _| {}),
            db,
            root.path().into(),
            None,
            None,
            root.path().join("sidecar"),
        ));
        let project = store::project_add(&st.db.lock(), "project", repo.to_str().unwrap()).unwrap();
        let workspace = |id, kind, path: &Path, branch| {
            store::workspace_insert(
                &st.db.lock(),
                id,
                &project.id,
                None,
                kind,
                path.to_str().unwrap(),
                branch,
                None,
            )
            .unwrap()
        };
        let project_ws = workspace("project", "project", &repo, None);
        let fresh_ws = workspace("fresh", "worktree", &fresh, Some("fresh"));
        let existing_ws = workspace("existing", "worktree", &existing, Some("existing"));
        assert!(reserve(&st.db.lock(), &fresh_ws).unwrap().is_none());
        let command = "printf 'ready\\n' >> marker";
        set_command(&st.db.lock(), &project.id, command).unwrap();
        start(st.clone(), &project_ws).unwrap();
        for ws in [&fresh_ws, &existing_ws] {
            start(st.clone(), ws).unwrap();
            start(st.clone(), ws).unwrap();
        }
        tokio::time::timeout(std::time::Duration::from_secs(5), async {
            loop {
                let finished = [&fresh_ws, &existing_ws].iter().all(|ws| {
                    get_run(&st.db.lock(), &ws.id).unwrap().unwrap().status == "succeeded"
                });
                if finished {
                    break;
                }
                tokio::time::sleep(std::time::Duration::from_millis(10)).await;
            }
        })
        .await
        .unwrap();

        assert!(!repo.join("marker").exists());
        for dir in [fresh, existing] {
            assert_eq!(
                std::fs::read_to_string(dir.join("marker")).unwrap(),
                "ready\n"
            );
        }
        let pending = workspace("pending", "worktree", &repo, Some("pending"));
        reserve(&st.db.lock(), &pending).unwrap().unwrap();
        assert!(is_running(&st.db.lock(), &pending.id).unwrap());
        let directory = root.path().to_path_buf();
        let interrupted = tokio::spawn(async move {
            execute(&directory, "printf started > started; exec sleep 30").await
        });
        tokio::time::timeout(std::time::Duration::from_secs(5), async {
            while !root.path().join("started").exists() {
                tokio::time::sleep(std::time::Duration::from_millis(10)).await;
            }
        })
        .await
        .unwrap();
        interrupted.abort();
        assert!(interrupted.await.unwrap_err().is_cancelled());
        drop(st);
        let db = store::open(&path).unwrap();
        interrupt_unfinished(&db).unwrap();
        assert_eq!(
            get_run(&db, &pending.id).unwrap().unwrap().status,
            "interrupted"
        );
        assert_eq!(
            get_run(&db, &fresh_ws.id).unwrap().unwrap().status,
            "succeeded"
        );
        assert!(reserve(&db, &pending).unwrap().is_none());
        assert_eq!(
            get_command(&db, &project.id).unwrap().as_deref(),
            Some(command)
        );
        set_command(&db, &project.id, " \n ").unwrap();
        assert!(get_command(&db, &project.id).unwrap().is_none());
    }

    #[tokio::test]
    async fn reports_script_and_launch_failures() {
        let dir = tempfile::tempdir().unwrap();
        let run = execute(dir.path(), "echo ready; echo problem >&2; exit 7").await;
        assert_eq!(run.status, "failed");
        assert_eq!(run.stdout, "ready\n");
        assert_eq!(run.stderr, "problem\n");
        assert!(run.error.unwrap().contains("7"));
        let run = execute(&dir.path().join("missing"), "exit 0").await;
        assert_eq!(run.status, "failed");
        assert!(run.error.unwrap().contains("Could not start"));
    }
}
