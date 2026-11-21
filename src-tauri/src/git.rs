//! git worktree qua CLI `git` (research R1): giữ hook, config, credential của người dùng.
use crate::error::{AppError, AppResult};
use std::path::{Path, PathBuf};
use tokio::process::Command;

async fn git(dir: &Path, args: &[&str]) -> AppResult<String> {
    let out = Command::new("git").arg("-C").arg(dir).args(args).output().await?;
    if !out.status.success() {
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

/// File đã thay đổi so với HEAD trong thư mục làm việc (panel Files).
pub async fn changed_files(dir: &Path) -> AppResult<Vec<(String, String)>> {
    let out = git(dir, &["status", "--porcelain"]).await?;
    Ok(out
        .lines()
        .filter(|l| l.len() > 3)
        .map(|l| (l[..2].trim().to_string(), l[3..].to_string()))
        .collect())
}

pub async fn file_diff(dir: &Path, file: &str) -> AppResult<String> {
    let d = git(dir, &["diff", "HEAD", "--", file]).await.unwrap_or_default();
    if d.is_empty() {
        // file mới chưa track
        let p = dir.join(file);
        if p.is_file() {
            let content = std::fs::read_to_string(&p).unwrap_or_default();
            return Ok(content.lines().map(|l| format!("+{l}")).collect::<Vec<_>>().join("\n"));
        }
    }
    Ok(d)
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

    #[test]
    fn slug_works() {
        assert_eq!(slug("Fix #123: Login bị lỗi!"), "fix-123-login-b-l-i");
        assert_eq!(slug("  "), "");
    }
}
