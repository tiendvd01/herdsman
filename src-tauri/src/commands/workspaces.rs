use super::{sessions::check_engine, St};
use crate::agent;
use crate::error::{AppError, AppResult};
use crate::git;
use crate::state::AppState;
use crate::store::{self, Project, Session, Workspace};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::path::Path;

pub async fn import_startup_worktrees(st: &AppState) -> AppResult<()> {
    let projects = store::project_list(&st.db.lock())?;
    for project in projects.into_iter().filter(|project| !project.missing) {
        let repo = Path::new(&project.path);
        if !git::is_repo(repo).await {
            continue;
        }
        let result = match git::linked_worktrees(repo).await {
            Ok(worktrees) if !worktrees.is_empty() => store::import_worktrees(&mut st.db.lock(), &project.id, worktrees),
            Ok(_) => Ok(()),
            Err(error) => Err(error),
        };
        if let Err(error) = result {
            eprintln!("Could not import worktrees for {}: {error}", project.path);
        }
    }
    Ok(())
}

#[tauri::command]
pub fn project_list(st: St<'_>) -> AppResult<Vec<Project>> {
    store::project_list(&st.db.lock())
}

#[tauri::command]
pub fn project_add(st: St<'_>, path: String) -> AppResult<Project> {
    let p = Path::new(&path);
    if !p.is_dir() {
        return Err(AppError::new("not_a_directory", "The path is not a folder"));
    }
    let real = std::fs::canonicalize(p)?;
    let name = real.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_else(|| real.to_string_lossy().to_string());
    store::project_add(&st.db.lock(), &name, &real.to_string_lossy())
}

#[tauri::command]
pub fn project_rename(st: St<'_>, id: String, name: String) -> AppResult<Project> {
    let name = name.trim();
    if name.is_empty() {
        return Err(AppError::new("empty_name", "Name cannot be empty"));
    }
    store::project_rename(&st.db.lock(), &id, name)
}

#[tauri::command]
pub async fn project_delete(st: St<'_>, id: String, confirm: bool) -> AppResult<()> {
    if !confirm {
        return Err(AppError::new("confirm_required", "Confirmation required"));
    }
    let _lifecycle = crate::workspace_terminal::LIFECYCLE.lock().await;
    kill_live_terminals(&st, "herdsman.project", &id).await?;
    store::project_delete(&st.db.lock(), &id)
}

async fn kill_live_terminals(st: &AppState, label: &str, id: &str) -> AppResult<()> {
    if let Some(hc) = &st.hc {
        let terminals = hc.list(&[("herdsman.app", "1"), (label, id)], false).await?;
        for terminal in terminals {
            if let Err(error) = hc.kill(&terminal.address).await {
                if hc.get(&terminal.address).await?.state == "live" {
                    return Err(error);
                }
            }
        }
    }
    Ok(())
}

// ───────────────────────────── Workspace (F11) ─────────────────────────────

#[tauri::command]
pub fn workspace_list(st: St<'_>, project_id: Option<String>, include_archived: Option<bool>) -> AppResult<Vec<Workspace>> {
    store::workspace_list(&st.db.lock(), project_id.as_deref(), include_archived.unwrap_or(false))
}

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum DirChoice {
    Project,
    Worktree { base_branch: Option<String>, branch: Option<String> },
    ExistingWorktree { branch: String },
}

#[derive(Serialize)]
pub struct CreatedWorkspace {
    pub(super) workspace: Workspace,
    pub(super) session: Session,
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn workspace_create(
    st: St<'_>,
    project_id: String,
    name: Option<String>,
    dir: DirChoice,
    engine: Option<String>,
    permission_mode: Option<String>,
) -> AppResult<CreatedWorkspace> {
    let engine = engine.unwrap_or_else(|| "claude".into());
    check_engine(&engine)?;
    let mode = permission_mode.as_deref();
    if let Some(mode) = mode {
        if engine == "codex" && !matches!(mode, "ask" | "auto" | "accept_edits" | "custom")
            || engine != "codex" && mode == "custom"
        {
            return Err(AppError::new("bad_mode", mode));
        }
    }
    let project = store::project_get(&st.db.lock(), &project_id)?;
    if project.missing {
        return Err(AppError::new("project_missing", "The project folder no longer exists"));
    }
    let name = name.map(|n| n.trim().to_string()).filter(|n| !n.is_empty());
    let ws_id = store::new_id();

    let repo = Path::new(&project.path);
    if !matches!(&dir, DirChoice::Project) && !git::is_repo(repo).await {
        return Err(AppError::new("not_a_repo", "The project is not a git repo; cannot create a worktree"));
    }
    let (dir_kind, work_dir, branch, base) = match dir {
        DirChoice::Project => ("project", project.path.clone(), None, None),
        DirChoice::Worktree { base_branch, branch } => {
            let base_branch = match base_branch {
                Some(base) => base,
                None => git::default_branch(repo, &git::branches(repo).await?).await
                    .ok_or_else(|| AppError::new("base_not_found", "No default branch is available"))?,
            };
            let branch = branch
                .map(|b| b.trim().to_string())
                .filter(|b| !b.is_empty())
                .unwrap_or_else(|| {
                    let base_name = name.as_deref().map(git::slug).filter(|s| !s.is_empty());
                    format!("herdsman/{}", base_name.unwrap_or_else(|| ws_id[ws_id.len() - 6..].to_string()))
                });
            let slug = git::slug(&branch);
            let path = git::worktree_path(repo, &slug, &st.data_dir.join("worktrees"));
            git::worktree_add(repo, &path, &branch, &base_branch).await?;
            ("worktree", path.to_string_lossy().to_string(), Some(branch), Some(base_branch))
        }
        DirChoice::ExistingWorktree { branch } => {
            let folder = format!("{}-{ws_id}", git::slug(&branch));
            let path = git::worktree_path(repo, &folder, &st.data_dir.join("worktrees"));
            git::worktree_add_existing(repo, &path, &branch).await?;
            ("worktree", path.to_string_lossy().to_string(), Some(branch), None)
        }
    };

    let created = {
        let db = st.db.lock();
        let ws = store::workspace_insert(&db, &ws_id, &project_id, name.as_deref(), dir_kind, &work_dir, branch.as_deref(), base.as_deref());
        match ws {
            Ok(ws) => store::new_conversation_insert(&db, &ws.id, &engine, mode, None).map(|s| (ws, s)),
            Err(e) => Err(e),
        }
    };
    let rollback = |st: &AppState| {
        let _ = store::discard_failed_workspace(&st.db.lock(), &ws_id);
    };
    let (ws, session) = match created {
        Ok(x) => x,
        Err(e) => {
            rollback(&st);
            if dir_kind == "worktree" {
                let _ = git::worktree_remove(Path::new(&project.path), Path::new(&work_dir), true).await;
            }
            return Err(e);
        }
    };
    if let Err(e) = agent::spawn_new_sidecar(&st, &session, &ws).await {
        rollback(&st);
        let _ = std::fs::remove_dir_all(crate::project_skills::plugin_path(&st.session_dir(&session.id)));
        if dir_kind == "worktree" {
            let _ = git::worktree_remove(Path::new(&project.path), Path::new(&work_dir), true).await;
        }
        return Err(e);
    }
    let session = store::session_get(&st.db.lock(), &session.id)?;
    if dir_kind == "worktree" {
        let _lifecycle = crate::workspace_terminal::LIFECYCLE.lock().await;
        if let Err(error) = crate::worktree_postscript::start(st.inner().clone(), &ws) {
            eprintln!("Could not reserve worktree postscript: {error}");
        }
    }
    Ok(CreatedWorkspace { workspace: ws, session })
}

#[tauri::command]
pub fn workspace_rename(st: St<'_>, id: String, name: String) -> AppResult<Workspace> {
    store::workspace_rename(&st.db.lock(), &id, name.trim())
}

#[derive(Serialize)]
pub struct DirtyInfo {
    dirty: bool,
    files: Vec<String>,
}

#[tauri::command]
pub async fn workspace_dirty_check(st: St<'_>, id: String) -> AppResult<DirtyInfo> {
    let ws = store::workspace_get(&st.db.lock(), &id)?;
    if ws.dir_kind != "worktree" || ws.worktree_removed {
        return Ok(DirtyInfo { dirty: false, files: vec![] });
    }
    let files = git::dirty_files(Path::new(&ws.work_dir)).await?;
    Ok(DirtyInfo { dirty: !files.is_empty(), files })
}

async fn remove_worktree(st: &AppState, ws: &Workspace, confirm_dirty: bool) -> AppResult<()> {
    if crate::worktree_postscript::is_running(&st.db.lock(), &ws.id)? {
        return Err(AppError::new("postscript_running", "Wait for Worktree Postscript to finish before removing the checkout."));
    }
    let files = git::dirty_files(Path::new(&ws.work_dir)).await.unwrap_or_default();
    if !files.is_empty() && !confirm_dirty {
        return Err(AppError::new("dirty_confirm_required", format!("The worktree has {} uncommitted file(s)", files.len())));
    }
    let project = store::project_get(&st.db.lock(), &ws.project_id)?;
    git::worktree_remove(Path::new(&project.path), Path::new(&ws.work_dir), true).await
}

async fn stop_workspace_sessions(st: &AppState, ws_id: &str) {
    let sessions = store::session_list(&st.db.lock(), ws_id).unwrap_or_default();
    for s in sessions {
        agent::close_view(st, &s.id);
        if let (Some(t), Some(hc)) = (&s.hc_terminal, &st.hc) {
            if s.status != "done" {
                let _ = agent::command(st, &s.id, json!({"cmd": "shutdown"})).await;
                tokio::time::sleep(std::time::Duration::from_millis(300)).await;
                let _ = hc.kill(t).await;
            }
        }
    }
}

/// FR-008a/c: archive; có tuỳ chọn xoá worktree (cảnh báo nếu còn thay đổi chưa commit).
#[tauri::command]
pub async fn workspace_archive(st: St<'_>, id: String, remove_worktree_dir: bool, confirm_dirty: Option<bool>) -> AppResult<Workspace> {
    let _lifecycle = crate::workspace_terminal::LIFECYCLE.lock().await;
    let ws = store::workspace_get(&st.db.lock(), &id)?;
    if ws.deleted_at.is_some() {
        return Ok(ws);
    }
    let mut removed = None;
    if remove_worktree_dir && ws.dir_kind == "worktree" && !ws.worktree_removed {
        remove_worktree(&st, &ws, confirm_dirty.unwrap_or(false)).await?;
        removed = Some(true);
    }
    crate::workspace_terminal::stop_for_workspace(&st, &ws).await?;
    stop_workspace_sessions(&st, &id).await;
    let ws = store::workspace_set_archived(&st.db.lock(), &id, true, removed)?;
    st.emit("workspace:changed", json!({"project_id": ws.project_id}));
    Ok(ws)
}

#[tauri::command]
pub fn workspace_unarchive(st: St<'_>, id: String) -> AppResult<Workspace> {
    let db = st.db.lock();
    let ws = store::workspace_get(&db, &id)?;
    if ws.dir_kind == "worktree" && ws.worktree_removed {
        return Err(AppError::new("worktree_removed", "The worktree was deleted; cannot unarchive"));
    }
    store::workspace_set_archived(&db, &id, false, None)
}

/// Remove the workspace from the sidebar while keeping its sessions searchable.
#[tauri::command]
pub async fn workspace_delete(st: St<'_>, id: String, remove_worktree_dir: bool, confirm_dirty: Option<bool>) -> AppResult<()> {
    let _lifecycle = crate::workspace_terminal::LIFECYCLE.lock().await;
    let ws = store::workspace_get(&st.db.lock(), &id)?;
    if ws.deleted_at.is_some() {
        return Ok(());
    }
    let removed = remove_worktree_dir && ws.dir_kind == "worktree" && !ws.worktree_removed;
    if removed {
        remove_worktree(&st, &ws, confirm_dirty.unwrap_or(false)).await?;
    }
    crate::workspace_terminal::stop_for_workspace(&st, &ws).await?;
    stop_workspace_sessions(&st, &id).await;
    kill_live_terminals(&st, "herdsman.workspace", &id).await?;
    let sessions = store::session_list(&st.db.lock(), &id)?;
    for s in &sessions {
        if let (Some(t), Some(hc)) = (&s.hc_terminal, &st.hc) {
            let _ = hc.rm(t).await;
        }
    }
    let state = st.inner().clone();
    tokio::task::spawn_blocking(move || {
        for session in sessions {
            agent::backfill_session_index(&state, &session);
        }
    }).await.map_err(|e| AppError::new("index_failed", e.to_string()))?;
    {
        let mut db = st.db.lock();
        let tx = db.transaction()?;
        store::workspace_keep_history(&tx, &id, removed)?;
        tx.execute("UPDATE sessions SET status = 'done', hc_terminal = NULL WHERE workspace_id = ?1", [&id])?;
        tx.commit()?;
    }
    st.emit("workspace:changed", json!({"project_id": ws.project_id}));
    Ok(())
}

#[derive(Serialize)]
pub struct BranchInfo {
    is_repo: bool,
    branches: Vec<String>,
    checked_out: Vec<String>,
    default_branch: Option<String>,
    current: Option<String>,
}

#[tauri::command]
pub async fn git_branches(st: St<'_>, project_id: String) -> AppResult<BranchInfo> {
    let p = store::project_get(&st.db.lock(), &project_id)?;
    let dir = Path::new(&p.path);
    if !git::is_repo(dir).await {
        return Ok(BranchInfo { is_repo: false, branches: vec![], checked_out: vec![], default_branch: None, current: None });
    }
    let (branches, checked_out) = git::branches_with_checkouts(dir).await?;
    let default_branch = git::default_branch(dir, &branches).await;
    Ok(BranchInfo { is_repo: true, branches, checked_out, default_branch, current: git::current_branch(dir).await })
}
