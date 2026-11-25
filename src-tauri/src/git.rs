//! git worktree qua CLI `git` (research R1): giữ hook, config, credential của người dùng.
use crate::error::{AppError, AppResult};
use std::collections::HashMap;
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

const HISTORY_LIMIT: usize = 200;

#[derive(serde::Serialize)]
struct BranchLabel {
    name: String,
    remote: bool,
}

#[derive(serde::Serialize)]
pub struct Commit {
    id: String,
    short_id: String,
    subject: String,
    parents: Vec<String>,
    branches: Vec<BranchLabel>,
}

#[derive(serde::Serialize)]
pub struct History {
    commits: Vec<Commit>,
    truncated: bool,
}

pub async fn history(dir: &Path) -> AppResult<Option<History>> {
    let repo = Command::new("git")
        .arg("-C").arg(dir)
        .args(["rev-parse", "--git-dir"])
        .env("LC_ALL", "C")
        .output().await?;
    if !repo.status.success() {
        let message = String::from_utf8_lossy(&repo.stderr);
        if message.starts_with("fatal: not a git repository") {
            return Ok(None);
        }
        return Err(AppError::new("git", message.trim()));
    }

    let head = Command::new("git")
        .arg("-C").arg(dir)
        .args(["rev-parse", "--quiet", "--verify", "HEAD"])
        .output().await?;
    if head.status.code() == Some(1) && head.stderr.is_empty() {
        return Ok(Some(History { commits: vec![], truncated: false }));
    }
    if !head.status.success() {
        return Err(AppError::new("git", String::from_utf8_lossy(&head.stderr).trim()));
    }
    let head = String::from_utf8_lossy(&head.stdout);
    let upstream = git(dir, &["rev-parse", "--verify", "@{upstream}^{commit}"]).await.ok();
    let count = format!("--max-count={}", HISTORY_LIMIT + 1);
    let mut args = vec![
        "log", "--topo-order", "--no-show-signature", "--no-notes",
        "--no-decorate", "--no-color", "-z", "--format=%H%x00%h%x00%P%x00%s",
        &count, head.trim(),
    ];
    if let Some(upstream) = upstream.as_deref() {
        args.push(upstream.trim());
    }
    args.push("--");
    let refs = git(dir, &[
        "for-each-ref", "--sort=refname", "--format=%(objectname)%09%(refname)%09%(symref)",
        "refs/heads", "refs/remotes",
    ]).await?;
    let mut branches = HashMap::<&str, Vec<BranchLabel>>::new();
    for line in refs.lines() {
        let Some((id, reference)) = line.split_once('\t') else { continue };
        let Some((reference, symbolic_target)) = reference.split_once('\t') else { continue };
        if !symbolic_target.is_empty() {
            continue;
        }
        let (name, remote) = if let Some(name) = reference.strip_prefix("refs/heads/") {
            (name, false)
        } else if let Some(name) = reference.strip_prefix("refs/remotes/") {
            (name, true)
        } else {
            continue;
        };
        branches.entry(id).or_default().push(BranchLabel { name: name.to_owned(), remote });
    }
    let log = git(dir, &args).await?;
    let mut fields = log.split_terminator('\0');
    let mut commits = Vec::new();
    while let Some(id) = fields.next() {
        let (Some(short_id), Some(parents), Some(subject)) =
            (fields.next(), fields.next(), fields.next())
        else {
            return Err(AppError::new("git", "Could not read commit history."));
        };
        commits.push(Commit {
            id: id.to_owned(),
            short_id: short_id.to_owned(),
            subject: subject.to_owned(),
            parents: parents.split_whitespace().map(str::to_owned).collect(),
            branches: branches.remove(id).unwrap_or_default(),
        });
    }
    let truncated = commits.len() > HISTORY_LIMIT;
    commits.truncate(HISTORY_LIMIT);
    Ok(Some(History { commits, truncated }))
}

pub async fn branches(dir: &Path) -> AppResult<Vec<String>> {
    Ok(branches_with_checkouts(dir).await?.0)
}

pub async fn branches_with_checkouts(dir: &Path) -> AppResult<(Vec<String>, Vec<String>)> {
    let out = git(dir, &[
        "for-each-ref", "--format=%(refname:lstrip=2)%09%(if)%(worktreepath)%(then)1%(else)0%(end)", "refs/heads",
    ]).await?;
    let mut branches = Vec::new();
    let mut checked_out = Vec::new();
    for (branch, occupied) in out.lines().filter_map(|line| line.split_once('\t')) {
        branches.push(branch.to_owned());
        if occupied == "1" {
            checked_out.push(branch.to_owned());
        }
    }
    Ok((branches, checked_out))
}

pub async fn current_branch(dir: &Path) -> Option<String> {
    let reference = git(dir, &["symbolic-ref", "--quiet", "HEAD"]).await.ok()?;
    reference.trim_end().strip_prefix("refs/heads/").map(str::to_owned)
}

pub async fn default_branch(dir: &Path, branches: &[String]) -> Option<String> {
    let remote_head = git(dir, &["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"]).await.ok();
    let origin_default = remote_head.as_deref().and_then(|name| name.trim_end().strip_prefix("refs/remotes/origin/"));
    for candidate in [origin_default, Some("main"), Some("master")].into_iter().flatten() {
        if branches.iter().any(|branch| branch == candidate) {
            return Some(candidate.to_owned());
        }
    }
    current_branch(dir).await
        .filter(|current| branches.contains(current))
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
    let base_ref = format!("refs/heads/{base}");
    git(project, &["worktree", "add", "-b", branch, &path.to_string_lossy(), &base_ref])
        .await
        .map_err(|e| AppError::new("worktree_failed", e.message))?;
    Ok(())
}

pub async fn worktree_add_existing(project: &Path, path: &Path, branch: &str) -> AppResult<()> {
    // Git checks branch occupancy before registering the checkout.
    static CHECKOUT: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());
    let _checkout = CHECKOUT.lock().await;
    let (branches, checked_out) = branches_with_checkouts(project).await?;
    let unavailable = || AppError::new("branch_unavailable", format!("Branch '{branch}' is no longer available"));
    if !branches.iter().any(|name| name == branch) {
        return Err(unavailable());
    }
    if checked_out.iter().any(|name| name == branch) {
        return Err(AppError::new("branch_checked_out", format!("Branch '{branch}' is already checked out")));
    }
    if path.exists() {
        return Err(AppError::new("worktree_failed", format!("Folder {} already exists", path.display())));
    }
    git(project, &["worktree", "add", "--no-guess-remote", "--", &path.to_string_lossy(), branch])
        .await
        .map_err(|e| AppError::new("worktree_failed", e.message))?;

    // If the branch vanished during creation, Git can resolve the name as another ref.
    let head = git(path, &["symbolic-ref", "--quiet", "HEAD"]).await.ok();
    if head.as_deref().map(str::trim_end) != Some(format!("refs/heads/{branch}").as_str()) {
        worktree_remove(project, path, false).await?;
        return Err(unavailable());
    }
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

#[derive(serde::Serialize)]
pub struct Change {
    status: String,
    path: String,
    original: Option<String>,
}

async fn commit_diff_output(dir: &Path, commit: &str, options: &[&str], paths: &[String]) -> AppResult<String> {
    if !matches!(commit.len(), 40 | 64) || !commit.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err(AppError::new("git", "Invalid commit ID."));
    }
    let mut args = vec![
        "diff-tree", "--root", "--diff-merges=first-parent", "-r", "--no-commit-id",
        "--no-relative", "--no-ext-diff", "--no-textconv", "--no-color", "--find-renames",
    ];
    args.extend_from_slice(options);
    args.extend([commit, "--"]);
    args.extend(paths.iter().map(String::as_str));
    git(dir, &args).await
}

pub async fn commit_changes(dir: &Path, commit: &str) -> AppResult<Vec<Change>> {
    let output = commit_diff_output(dir, commit, &["--name-status", "-z"], &[]).await?;
    let mut fields = output.split_terminator('\0');
    let mut changes = Vec::new();
    let missing_path = || AppError::new("git", "Could not read commit changes.");
    while let Some(status) = fields.next() {
        let first_path = fields.next().ok_or_else(missing_path)?;
        let (status, path, original) = match status.as_bytes().first() {
            Some(b'R' | b'C') => (&status[..1], fields.next().ok_or_else(missing_path)?, Some(first_path.to_owned())),
            _ => (status, first_path, None),
        };
        changes.push(Change { status: status.to_owned(), path: path.to_owned(), original });
    }
    Ok(changes)
}

pub async fn commit_file_diff(dir: &Path, commit: &str, path: &str, original: Option<&str>) -> AppResult<String> {
    let paths: Vec<_> = [Some(path), original].into_iter().flatten()
        .map(|path| format!(":(top,literal){path}"))
        .collect();
    commit_diff_output(dir, commit, &["--patch"], &paths).await
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
    async fn history_reads_worktree_head_and_preserves_merge_parents() {
        let repo = init_repo().await;
        let root = repo.path();
        let empty = tempfile::tempdir().unwrap();
        assert!(history(empty.path()).await.unwrap().is_none());
        git(empty.path(), &["init"]).await.unwrap();
        assert!(history(empty.path()).await.unwrap().unwrap().commits.is_empty());

        git(root, &["switch", "-c", "topic"]).await.unwrap();
        git(root, &["commit", "--allow-empty", "--allow-empty-message", "-m", ""]).await.unwrap();
        let topic = git(root, &["rev-parse", "HEAD"]).await.unwrap();
        git(root, &["switch", "main"]).await.unwrap();
        git(root, &["merge", "--no-ff", "-m", "Merge topic", "topic"]).await.unwrap();

        let history_main = history(root).await.unwrap().unwrap();
        assert_eq!(history_main.commits.len(), 3);
        let merge = &history_main.commits[0];
        assert_eq!(merge.subject, "Merge topic");
        assert_eq!(merge.parents.len(), 2);
        assert_eq!(merge.parents[1], topic.trim());
        assert!(merge.parents.iter().all(|id| history_main.commits[1..].iter().any(|commit| &commit.id == id)));

        git(root, &["remote", "add", "origin", "."]).await.unwrap();
        git(root, &["switch", "topic"]).await.unwrap();
        git(root, &["commit", "--allow-empty", "-m", "Remote work"]).await.unwrap();
        git(root, &["update-ref", "refs/remotes/origin/main", "HEAD"]).await.unwrap();
        git(root, &["symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/main"]).await.unwrap();
        git(root, &["switch", "main"]).await.unwrap();
        git(root, &["branch", "--set-upstream-to=origin/main"]).await.unwrap();

        let tracked = history(root).await.unwrap().unwrap();
        let remote_tip = tracked.commits.iter().find(|commit| commit.subject == "Remote work").unwrap();
        assert!(remote_tip.branches.iter().any(|branch| branch.name == "origin/main" && branch.remote));
        assert!(!remote_tip.branches.iter().any(|branch| branch.name == "origin/HEAD"));
        let local_tip = tracked.commits.iter().find(|commit| commit.id == merge.id).unwrap();
        assert!(local_tip.branches.iter().any(|branch| branch.name == "main" && !branch.remote));

        let worktrees = tempfile::tempdir().unwrap();
        let detached = worktrees.path().join("detached");
        git(root, &["worktree", "add", "--detach", detached.to_str().unwrap(), topic.trim()]).await.unwrap();
        let history_detached = history(&detached).await.unwrap().unwrap();
        assert_eq!(history_detached.commits.len(), 2);
        assert_eq!(history_detached.commits[0].id, topic.trim());
        assert_eq!(history_detached.commits[0].subject, "");
        assert!(!history_detached.truncated);
    }

    #[tokio::test]
    async fn commit_changes_and_patches_use_the_root_or_first_parent() {
        let repo = init_repo().await;
        let root = repo.path();
        let initial = git(root, &["rev-parse", "HEAD"]).await.unwrap();
        let initial = initial.trim();
        let added = commit_changes(root, initial).await.unwrap();
        assert_eq!((&*added[0].status, &*added[0].path), ("A", "README.md"));
        assert!(commit_file_diff(root, initial, "README.md", None).await.unwrap().contains("+hello"));

        git(root, &["switch", "-c", "topic"]).await.unwrap();
        let renamed = "read me\t[1].md";
        git(root, &["mv", "README.md", renamed]).await.unwrap();
        std::fs::write(root.join("binary"), [0, 255, 11]).unwrap();
        git(root, &["add", "binary"]).await.unwrap();
        git(root, &["commit", "-m", "Rename and add binary"]).await.unwrap();
        git(root, &["switch", "main"]).await.unwrap();
        std::fs::write(root.join("main-only"), "first parent\n").unwrap();
        git(root, &["add", "main-only"]).await.unwrap();
        git(root, &["commit", "-m", "Main only"]).await.unwrap();
        git(root, &["merge", "--no-ff", "-m", "Merge topic", "topic"]).await.unwrap();
        let merge = git(root, &["rev-parse", "HEAD"]).await.unwrap();
        let merge = merge.trim();
        let changes = commit_changes(root, merge).await.unwrap();
        assert_eq!(changes.len(), 2);
        let rename = changes.iter().find(|change| change.path == renamed).unwrap();
        assert_eq!((&*rename.status, rename.original.as_deref()), ("R", Some("README.md")));
        std::fs::write(root.join(renamed), "Uncommitted\n").unwrap();
        let patch = commit_file_diff(root, merge, renamed, rename.original.as_deref()).await.unwrap();
        assert!(patch.contains("rename from README.md"));
        assert!(!patch.contains("Uncommitted"));
        assert!(commit_file_diff(root, merge, "binary", None).await.unwrap().contains("Binary files"));
        assert!(commit_changes(root, "--all").await.is_err());
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
    async fn default_branch_prefers_origin_head_then_main_over_current_checkout() {
        let repo = init_repo().await;
        let root = repo.path();
        git(root, &["branch", "trunk"]).await.unwrap();
        git(root, &["switch", "-c", "topic"]).await.unwrap();
        std::fs::write(root.join("README.md"), "topic only").unwrap();
        git(root, &["commit", "-am", "topic work"]).await.unwrap();
        let branches = branches(root).await.unwrap();
        assert_eq!(default_branch(root, &branches).await.as_deref(), Some("main"));

        git(root, &["update-ref", "refs/remotes/origin/trunk", "refs/heads/trunk"]).await.unwrap();
        git(root, &["symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/trunk"]).await.unwrap();
        let base = default_branch(root, &branches).await.unwrap();
        assert_eq!(base, "trunk");
        git(root, &["tag", "trunk", "topic"]).await.unwrap();
        let folder = tempfile::tempdir().unwrap();
        let worktree = folder.path().join("new");
        worktree_add(root, &worktree, "new", &base).await.unwrap();
        assert_eq!(std::fs::read_to_string(worktree.join("README.md")).unwrap(), "hello\n");
        assert_eq!(current_branch(root).await.as_deref(), Some("topic"));
    }

    #[tokio::test]
    async fn worktree_existing_branch_keeps_branch_and_rejects_unavailable_refs() {
        let repo = init_repo().await;
        let root = repo.path();
        let worktrees = tempfile::tempdir().unwrap();
        let path = worktrees.path().join("existing");
        git(root, &["switch", "-c", "feature/login"]).await.unwrap();
        std::fs::write(root.join("README.md"), "existing branch content").unwrap();
        git(root, &["commit", "-am", "feature work"]).await.unwrap();
        git(root, &["switch", "main"]).await.unwrap();
        git(root, &["tag", "tag-only"]).await.unwrap();
        git(root, &["tag", "feature/login"]).await.unwrap();
        let (branches, checked_out) = branches_with_checkouts(root).await.unwrap();
        assert_eq!(branches, ["feature/login", "main"]);
        assert_eq!(checked_out, ["main"]);

        worktree_add_existing(root, &path, "feature/login").await.unwrap();
        assert_eq!(current_branch(&path).await.as_deref(), Some("feature/login"));
        assert_eq!(std::fs::read_to_string(path.join("README.md")).unwrap(), "existing branch content");
        assert_eq!(current_branch(root).await.as_deref(), Some("main"));
        assert_eq!(std::fs::read_to_string(root.join("README.md")).unwrap(), "hello\n");
        assert_eq!(branches_with_checkouts(root).await.unwrap().1, ["feature/login", "main"]);
        let other = worktrees.path().join("other");
        for branch in ["main", "feature/login", "tag-only", "missing"] {
            assert!(worktree_add_existing(root, &other, branch).await.is_err());
            assert!(!other.exists());
        }
        worktree_remove(root, &path, false).await.unwrap();
        assert_eq!(branches_with_checkouts(root).await.unwrap().1, ["main"]);
        let (first, second) = tokio::join!(
            worktree_add_existing(root, &path, "feature/login"),
            worktree_add_existing(root, &other, "feature/login"),
        );
        assert_ne!(first.is_ok(), second.is_ok());
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
