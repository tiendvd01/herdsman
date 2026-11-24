//! git worktree qua CLI `git` (research R1): giữ hook, config, credential của người dùng.
use crate::error::{AppError, AppResult};
use std::path::{Path, PathBuf};
use tokio::process::Command;

async fn git(dir: &Path, args: &[&str]) -> AppResult<String> {
    git_output(dir, args, false).await
}

async fn git_output(dir: &Path, args: &[&str], allow_differences: bool) -> AppResult<String> {
    let out = Command::new("git").arg("-C").arg(dir).args(args).output().await?;
    if !(out.status.success() || allow_differences && out.status.code() == Some(1)) {
        return Err(AppError::new("git", String::from_utf8_lossy(&out.stderr).trim().to_string()));
    }
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

pub async fn is_repo(dir: &Path) -> bool {
    git(dir, &["rev-parse", "--git-dir"]).await.is_ok()
}

pub async fn branches(dir: &Path) -> AppResult<Vec<String>> {
    let out = git(dir, &["for-each-ref", "--format=%(refname:short)", "refs/heads"]).await?;
    Ok(out.lines().map(|l| l.trim().to_string()).filter(|l| !l.is_empty()).collect())
}

pub async fn current_branch(dir: &Path) -> Option<String> {
    git(dir, &["rev-parse", "--abbrev-ref", "HEAD"]).await.ok().map(|s| s.trim().to_string())
}

pub fn slug(s: &str) -> String {
    let mut out = String::new();
    for ch in s.to_lowercase().chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch);
        } else if !out.ends_with('-') && !out.is_empty() {
            out.push('-');
        }
    }
    let out = out.trim_matches('-').to_string();
    out.chars().take(40).collect()
}

/// Thư mục đặt worktree: `<project>/../.herdsman-worktrees/<project-name>/<slug>`; không ghi được thì `fallback`.
pub fn worktree_path(project: &Path, slug: &str, fallback_root: &Path) -> PathBuf {
    let name = project.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_else(|| "project".into());
    if let Some(parent) = project.parent() {
        let root = parent.join(".herdsman-worktrees").join(&name);
        if std::fs::create_dir_all(&root).is_ok() {
            return root.join(slug);
        }
    }
    fallback_root.join(&name).join(slug)
}

pub async fn worktree_add(project: &Path, path: &Path, branch: &str, base: &str) -> AppResult<()> {
    let list = branches(project).await?;
    if !list.iter().any(|b| b == base) {
        return Err(AppError::new("base_not_found", format!("Base branch '{base}' does not exist")));
    }
    if list.iter().any(|b| b == branch) {
        return Err(AppError::new("branch_exists", format!("Branch '{branch}' already exists")));
    }
    if path.exists() {
        return Err(AppError::new("worktree_failed", format!("Folder {} already exists", path.display())));
    }
    git(project, &["worktree", "add", "-b", branch, &path.to_string_lossy(), base])
        .await
        .map_err(|e| AppError::new("worktree_failed", e.message))?;
    Ok(())
}

/// Các file thay đổi chưa commit (rỗng = sạch). Thư mục không còn → coi như sạch.
pub async fn dirty_files(dir: &Path) -> AppResult<Vec<String>> {
    if !dir.exists() {
        return Ok(vec![]);
    }
    let out = git(dir, &["status", "--porcelain"]).await?;
    Ok(out.lines().map(|l| l.get(3..).unwrap_or(l).to_string()).filter(|l| !l.is_empty()).collect())
}

pub async fn worktree_remove(project: &Path, path: &Path, force: bool) -> AppResult<()> {
    if !path.exists() {
        let _ = git(project, &["worktree", "prune"]).await;
        return Ok(());
    }
    let p = path.to_string_lossy().to_string();
    let mut args = vec!["worktree", "remove"];
    if force {
        args.push("--force");
    }
    args.push(&p);
    git(project, &args).await.map(|_| ())
}

struct Change {
    status: String,
    path: String,
    original: Option<String>,
}

async fn changes(dir: &Path) -> AppResult<Vec<Change>> {
    let output = git(dir, &["status", "--porcelain=v1", "-z", "--untracked-files=all"]).await?;
    let mut fields = output.split_terminator('\0');
    let mut changes = Vec::new();
    while let Some(field) = fields.next() {
        let (Some(status), Some(path)) = (field.get(..2), field.get(3..)) else {
            continue;
        };
        // Porcelain v1 with -z reports the destination before the source.
        let original = if status.contains(['R', 'C']) {
            fields.next().map(str::to_owned)
        } else {
            None
        };
        changes.push(Change { status: status.trim().to_owned(), path: path.to_owned(), original });
    }
    Ok(changes)
}

pub async fn changed_files(dir: &Path) -> AppResult<Vec<(String, String)>> {
    Ok(changes(dir).await?.into_iter().map(|change| (change.status, change.path)).collect())
}

pub async fn project_changed_files(dir: &Path) -> AppResult<Vec<(String, String)>> {
    let project = tokio::fs::canonicalize(dir).await?;
    let output = Command::new("git")
        .arg("-C").arg(&project)
        .args(["rev-parse", "--show-toplevel"])
        .env("LC_ALL", "C")
        .output().await?;
    if !output.status.success() {
        let message = String::from_utf8_lossy(&output.stderr);
        if message.starts_with("fatal: not a git repository")
            || message.starts_with("fatal: this operation must be run in a work tree")
        {
            return Ok(vec![]);
        }
        return Err(AppError::new("git", message.trim()));
    }
    let root = String::from_utf8_lossy(&output.stdout);
    let root = tokio::fs::canonicalize(root.strip_suffix('\n').unwrap_or(&root)).await?;
    let prefix = project.strip_prefix(&root)
        .map_err(|error| AppError::new("git", error.to_string()))?;
    Ok(changed_files(&root).await?.into_iter().filter_map(|(status, path)| {
        let relative = Path::new(&path).strip_prefix(prefix).ok()?;
        Some((status, relative.to_string_lossy().replace(std::path::MAIN_SEPARATOR, "/")))
    }).collect())
}

pub async fn file_diff(dir: &Path, file: &str) -> AppResult<String> {
    let Some(change) = changes(dir).await?.into_iter().find(|change| change.path == file) else {
        return Ok(String::new());
    };
    let root = git(dir, &["rev-parse", "--show-toplevel"]).await?;
    let dir = Path::new(root.strip_suffix('\n').unwrap_or(&root));
    if change.status == "??" {
        let file = format!("./{file}");
        return git_output(dir, &["diff", "--no-index", "--no-ext-diff", "--no-color", "--", "/dev/null", &file], true).await;
    }
    let base = if git(dir, &["rev-parse", "--verify", "HEAD"]).await.is_ok() {
        "HEAD".to_owned()
    } else {
        git(dir, &["hash-object", "-t", "tree", "/dev/null"]).await?.trim().to_owned()
    };
    let mut args = vec!["--literal-pathspecs", "diff", "--no-ext-diff", "--no-color", &base, "--", file];
    if let Some(original) = change.original.as_deref() {
        args.push(original);
    }
    git(dir, &args).await
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn init_repo() -> tempfile::TempDir {
        let dir = tempfile::tempdir().unwrap();
        let p = dir.path();
        for args in [
            vec!["init", "-b", "main"],
            vec!["config", "user.email", "t@example.com"],
            vec!["config", "user.name", "t"],
        ] {
            git(p, &args).await.unwrap();
        }
        std::fs::write(p.join("README.md"), "hello\n").unwrap();
        git(p, &["add", "."]).await.unwrap();
        git(p, &["commit", "-m", "init"]).await.unwrap();
        dir
    }

    #[tokio::test]
    async fn project_status_uses_project_relative_paths_and_checkout() {
        let repo = init_repo().await;
        let root = repo.path();
        for folder in ["app", "app-other"] {
            std::fs::create_dir(root.join(folder)).unwrap();
            std::fs::write(root.join(folder).join("main.ts"), "baseline").unwrap();
        }
        git(root, &["add", "."]).await.unwrap();
        git(root, &["commit", "-m", "add projects"]).await.unwrap();

        let worktrees = tempfile::tempdir().unwrap();
        let worktree = worktrees.path().join("feature");
        worktree_add(root, &worktree, "feature", "main").await.unwrap();
        std::fs::write(worktree.join("app/main.ts"), "worktree change").unwrap();
        std::fs::write(root.join("app-other/main.ts"), "outside project").unwrap();
        let project = root.join("app");
        assert!(project_changed_files(&project).await.unwrap().is_empty());
        assert_eq!(
            project_changed_files(&worktree.join("app")).await.unwrap(),
            vec![("M".into(), "main.ts".into())],
        );
        std::fs::write(project.join("main.ts"), "project change").unwrap();
        assert_eq!(
            project_changed_files(&project).await.unwrap(),
            vec![("M".into(), "main.ts".into())],
        );
        assert!(project_changed_files(worktrees.path()).await.unwrap().is_empty());
    }

    #[tokio::test]
    async fn worktree_lifecycle() {
        let repo = init_repo().await;
        let wt_root = tempfile::tempdir().unwrap();
        let a = wt_root.path().join("a");
        let b = wt_root.path().join("b");
        worktree_add(repo.path(), &a, "feat-a", "main").await.unwrap();
        worktree_add(repo.path(), &b, "feat-b", "main").await.unwrap();
        assert_eq!(worktree_add(repo.path(), &wt_root.path().join("c"), "feat-a", "main").await.unwrap_err().code, "branch_exists");
        assert_eq!(worktree_add(repo.path(), &wt_root.path().join("d"), "x", "nope").await.unwrap_err().code, "base_not_found");

        // hai worktree sửa cùng file không đè lên nhau (SC-005)
        std::fs::write(a.join("README.md"), "A\n").unwrap();
        std::fs::write(b.join("README.md"), "B\n").unwrap();
        assert_eq!(std::fs::read_to_string(repo.path().join("README.md")).unwrap(), "hello\n");
        assert_eq!(dirty_files(&a).await.unwrap(), vec!["README.md".to_string()]);

        assert!(worktree_remove(repo.path(), &a, false).await.is_err(), "dirty mà không force thì git từ chối");
        worktree_remove(repo.path(), &a, true).await.unwrap();
        assert!(!a.exists());
        assert_eq!(current_branch(&b).await.as_deref(), Some("feat-b"));
    }

    #[tokio::test]
    async fn file_changes_use_literal_paths_and_show_empty_after_revert() {
        let repo = init_repo().await;
        let root = repo.path();
        let path = "tên [file].md";
        std::fs::write(root.join(path), "new text\n").unwrap();
        assert!(changed_files(root).await.unwrap().contains(&("??".into(), path.into())));
        assert!(file_diff(root, path).await.unwrap().contains("+new text"));

        std::fs::write(root.join("README.md"), "edited\n").unwrap();
        assert!(file_diff(root, "README.md").await.unwrap().contains("-hello"));
        std::fs::write(root.join("README.md"), "hello\n").unwrap();
        assert!(file_diff(root, "README.md").await.unwrap().is_empty());

        git(root, &["mv", "README.md", "signed off.md"]).await.unwrap();
        assert!(changed_files(root).await.unwrap().contains(&("R".into(), "signed off.md".into())));
        assert!(file_diff(root, "signed off.md").await.unwrap().contains("rename from README.md"));
    }

    #[test]
    fn slug_works() {
        assert_eq!(slug("Fix #123: Login bị lỗi!"), "fix-123-login-b-l-i");
        assert_eq!(slug("  "), "");
    }
}
