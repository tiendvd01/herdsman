//! Tauri commands (contracts/tauri-commands.md).
use crate::agent;
use crate::error::{AppError, AppResult};
use crate::git;
use crate::hc::Terminal;
use crate::state::AppState;
use crate::store::{self, Project, SearchHit, Session, Workspace};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::path::Path;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::State;

type St<'a> = State<'a, Arc<AppState>>;

const ENGINES: &[&str] = &["claude", "echo"];
const MODES: &[&str] = &["ask", "accept_edits", "auto", "bypass"];
const DEFAULT_MODE: &str = "auto";

// ───────────────────────────── Chung ─────────────────────────────

#[derive(Serialize)]
pub struct AppInfo {
    hc_connected: bool,
    hc_version: Option<String>,
    hc_path: Option<String>,
    node_path: Option<String>,
    data_dir: String,
}

#[tauri::command]
pub fn app_info(st: St<'_>) -> AppInfo {
    AppInfo {
        hc_connected: st.hc_connected.load(Ordering::SeqCst),
        hc_version: st.hc_version.lock().clone(),
        hc_path: st.hc.as_ref().map(|h| h.bin.to_string_lossy().into()),
        node_path: st.node.as_ref().map(|p| p.to_string_lossy().into()),
        data_dir: st.data_dir.to_string_lossy().into(),
    }
}

/// Installed font family names, sorted, without hidden `.`-prefixed system families (spec 010).
#[tauri::command]
pub async fn font_families() -> Vec<String> {
    tokio::task::spawn_blocking(list_font_families).await.unwrap_or_default()
}

#[cfg(target_os = "macos")]
fn list_font_families() -> Vec<String> {
    let names = core_text::font_manager::copy_available_font_family_names();
    let mut out: Vec<String> = names.iter().map(|n| n.to_string()).filter(|n| !n.starts_with('.')).collect();
    out.sort_by_key(|n| n.to_lowercase());
    out.dedup();
    out
}

#[cfg(not(target_os = "macos"))]
fn list_font_families() -> Vec<String> {
    Vec::new()
}

/// A custom theme file as read from disk (spec 016); the frontend validates the contents.
#[derive(Serialize, Debug, PartialEq)]
pub struct ThemeFile {
    file: String,
    text: Option<String>,
    error: Option<String>,
}

const MAX_THEME_BYTES: u64 = 256 * 1024;

/// Reads `<dir>/*.json` raw, sorted by name; creates `dir` when missing. Files over 256 KB come back with an error instead of text.
fn read_theme_files(dir: &Path) -> Vec<ThemeFile> {
    let _ = std::fs::create_dir_all(dir);
    let Ok(rd) = std::fs::read_dir(dir) else { return vec![] };
    let mut out: Vec<ThemeFile> = rd
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file() && e.path().extension().map(|x| x.eq_ignore_ascii_case("json")).unwrap_or(false))
        .map(|e| {
            let file = e.file_name().to_string_lossy().into_owned();
            let too_big = e.metadata().map(|m| m.len() > MAX_THEME_BYTES).unwrap_or(false);
            if too_big {
                return ThemeFile { file, text: None, error: Some("file is larger than 256 KB".into()) };
            }
            match std::fs::read_to_string(e.path()) {
                Ok(text) => ThemeFile { file, text: Some(text), error: None },
                Err(err) => ThemeFile { file, text: None, error: Some(format!("could not read the file: {err}")) },
            }
        })
        .collect();
    out.sort_by(|a, b| a.file.cmp(&b.file));
    out
}

/// Custom themes in `<data_dir>/themes/` (spec 016).
#[tauri::command]
pub async fn theme_files(st: St<'_>) -> Result<Vec<ThemeFile>, ()> {
    let dir = st.data_dir.join("themes");
    Ok(tokio::task::spawn_blocking(move || read_theme_files(&dir)).await.unwrap_or_default())
}

#[tauri::command]
pub fn settings_get(st: St<'_>, key: String) -> AppResult<Option<String>> {
    store::setting_get(&st.db.lock(), &key)
}

#[tauri::command]
pub fn settings_set(st: St<'_>, key: String, value: String) -> AppResult<()> {
    store::setting_set(&st.db.lock(), &key, &value)
}

// ───────────────────────────── Project (F1) ─────────────────────────────

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

#[derive(Serialize)]
pub struct RunningRef {
    terminal: String,
    kind: String,
    session_id: Option<String>,
    title: String,
}

async fn running_in_project(st: &AppState, project_id: &str) -> AppResult<Vec<(Terminal, RunningRef)>> {
    let hc = st.hc()?;
    let terms = hc.list(&[("herdsman.app", "1"), ("herdsman.project", project_id)], false).await?;
    let db = st.db.lock();
    Ok(terms
        .into_iter()
        .map(|t| {
            let kind = t.label("herdsman.kind").unwrap_or("?").to_string();
            let sid = t.label("herdsman.session").map(|s| s.to_string());
            let title = match &sid {
                Some(s) => store::session_get(&db, s).ok().and_then(|s| s.title).unwrap_or_else(|| "Session".into()),
                None => t.argv.last().cloned().unwrap_or_default(),
            };
            let r = RunningRef { terminal: t.address.clone(), kind, session_id: sid, title };
            (t, r)
        })
        .collect())
}

#[tauri::command]
pub async fn project_delete_preview(st: St<'_>, id: String) -> AppResult<Vec<RunningRef>> {
    Ok(running_in_project(&st, &id).await?.into_iter().map(|(_, r)| r).collect())
}

/// FR-002a: dừng mọi session/task đang chạy của project rồi mới bỏ project khỏi app.
#[tauri::command]
pub async fn project_delete(st: St<'_>, id: String, confirm: bool) -> AppResult<()> {
    if !confirm {
        return Err(AppError::new("confirm_required", "Confirmation required"));
    }
    if st.hc.is_some() {
        let hc = st.hc()?;
        let all = hc.list(&[("herdsman.app", "1"), ("herdsman.project", &id)], true).await?;
        for t in &all {
            if t.state == "live" {
                let _ = hc.kill(&t.address).await;
            }
        }
        for t in &all {
            for _ in 0..25 {
                match hc.get(&t.address).await {
                    Ok(x) if x.state == "live" => tokio::time::sleep(std::time::Duration::from_millis(200)).await,
                    _ => break,
                }
            }
            let _ = hc.rm(&t.address).await;
        }
    }
    let sessions: Vec<String> = {
        let db = st.db.lock();
        store::workspace_list(&db, Some(&id), true)?
            .iter()
            .flat_map(|w| store::session_list(&db, &w.id).unwrap_or_default())
            .map(|s| s.id)
            .collect()
    };
    for sid in sessions {
        agent::close_view(&st, &sid);
        let _ = std::fs::remove_dir_all(st.session_dir(&sid));
    }
    store::project_delete(&st.db.lock(), &id)
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
    Worktree { base_branch: String, branch: Option<String> },
}

#[derive(Serialize)]
pub struct CreatedWorkspace {
    workspace: Workspace,
    session: Session,
}

fn check_engine(engine: &str) -> AppResult<()> {
    if engine == "codex" {
        return Err(AppError::new("engine_unavailable", "The Codex engine is not supported in this version"));
    }
    if !ENGINES.contains(&engine) {
        return Err(AppError::new("bad_engine", engine.to_string()));
    }
    Ok(())
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
    let mode = permission_mode.unwrap_or_else(|| DEFAULT_MODE.into());
    let project = store::project_get(&st.db.lock(), &project_id)?;
    if project.missing {
        return Err(AppError::new("project_missing", "The project folder no longer exists"));
    }
    let name = name.map(|n| n.trim().to_string()).filter(|n| !n.is_empty());
    let ws_id = store::new_id();

    let (dir_kind, work_dir, branch, base) = match dir {
        DirChoice::Project => ("project", project.path.clone(), None, None),
        DirChoice::Worktree { base_branch, branch } => {
            let repo = Path::new(&project.path);
            if !git::is_repo(repo).await {
                return Err(AppError::new("not_a_repo", "The project is not a git repo; cannot create a worktree"));
            }
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
    };

    let created = {
        let db = st.db.lock();
        let ws = store::workspace_insert(&db, &ws_id, &project_id, name.as_deref(), dir_kind, &work_dir, branch.as_deref(), base.as_deref());
        match ws {
            Ok(ws) => store::session_insert(&db, &ws.id, &engine, &mode).map(|s| (ws, s)),
            Err(e) => Err(e),
        }
    };
    let rollback = |st: &AppState| {
        let _ = store::workspace_delete(&st.db.lock(), &ws_id);
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
    if let Err(e) = agent::spawn_sidecar(&st, &session, &ws).await {
        rollback(&st);
        if dir_kind == "worktree" {
            let _ = git::worktree_remove(Path::new(&project.path), Path::new(&work_dir), true).await;
        }
        return Err(e);
    }
    let session = store::session_get(&st.db.lock(), &session.id)?;
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
    let ws = store::workspace_get(&st.db.lock(), &id)?;
    let mut removed = None;
    if remove_worktree_dir && ws.dir_kind == "worktree" && !ws.worktree_removed {
        remove_worktree(&st, &ws, confirm_dirty.unwrap_or(false)).await?;
        removed = Some(true);
    }
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

/// FR-008b: xoá workspace khỏi app (không đụng thư mục project, transcript gốc giữ nguyên).
#[tauri::command]
pub async fn workspace_delete(st: St<'_>, id: String, remove_worktree_dir: bool, confirm_dirty: Option<bool>) -> AppResult<()> {
    let ws = store::workspace_get(&st.db.lock(), &id)?;
    if remove_worktree_dir && ws.dir_kind == "worktree" && !ws.worktree_removed {
        remove_worktree(&st, &ws, confirm_dirty.unwrap_or(false)).await?;
    }
    stop_workspace_sessions(&st, &id).await;
    let sessions = store::session_list(&st.db.lock(), &id)?;
    for s in &sessions {
        if let (Some(t), Some(hc)) = (&s.hc_terminal, &st.hc) {
            let _ = hc.rm(t).await;
        }
        let _ = std::fs::remove_dir_all(st.session_dir(&s.id));
    }
    store::workspace_delete(&st.db.lock(), &id)?;
    st.emit("workspace:changed", json!({"project_id": ws.project_id}));
    Ok(())
}

#[derive(Serialize)]
pub struct BranchInfo {
    is_repo: bool,
    branches: Vec<String>,
    current: Option<String>,
}

#[tauri::command]
pub async fn git_branches(st: St<'_>, project_id: String) -> AppResult<BranchInfo> {
    let p = store::project_get(&st.db.lock(), &project_id)?;
    let dir = Path::new(&p.path);
    if !git::is_repo(dir).await {
        return Ok(BranchInfo { is_repo: false, branches: vec![], current: None });
    }
    Ok(BranchInfo { is_repo: true, branches: git::branches(dir).await?, current: git::current_branch(dir).await })
}

// ───────────────────────────── Session (F2, F4, F6, F10) ─────────────────────────────

#[tauri::command]
pub fn session_history(st: St<'_>, workspace_id: String) -> AppResult<Vec<Session>> {
    store::session_list(&st.db.lock(), &workspace_id)
}

#[tauri::command]
pub async fn session_create(st: St<'_>, workspace_id: String, engine: Option<String>, permission_mode: Option<String>) -> AppResult<Session> {
    let engine = engine.unwrap_or_else(|| "claude".into());
    check_engine(&engine)?;
    let mode = permission_mode.unwrap_or_else(|| DEFAULT_MODE.into());
    let (ws, s) = {
        let db = st.db.lock();
        let ws = store::workspace_get(&db, &workspace_id)?;
        let s = store::session_insert(&db, &workspace_id, &engine, &mode)?;
        (ws, s)
    };
    if let Err(e) = agent::spawn_sidecar(&st, &s, &ws).await {
        let _ = st.db.lock().execute("DELETE FROM sessions WHERE id = ?1", [&s.id]);
        return Err(e);
    }
    store::session_get(&st.db.lock(), &s.id)
}

#[tauri::command]
pub async fn session_open(st: St<'_>, id: String) -> AppResult<()> {
    store::session_get(&st.db.lock(), &id)?;
    agent::open_view(st.inner().clone(), id);
    Ok(())
}

#[tauri::command]
pub fn session_close_view(st: St<'_>, id: String) {
    agent::close_view(&st, &id);
}

#[derive(Deserialize)]
pub struct ImageInput {
    media_type: String,
    data_b64: String,
}

fn first_line_title(text: &str) -> String {
    let line = text.lines().map(str::trim).find(|l| !l.is_empty()).unwrap_or("Session");
    let mut out: String = line.chars().take(40).collect();
    if line.chars().count() > 40 {
        out = out.trim_end().to_string() + "…";
    }
    out
}

#[tauri::command]
pub async fn session_prompt(st: St<'_>, id: String, text: String, images: Option<Vec<ImageInput>>) -> AppResult<()> {
    let images: Vec<Value> = images
        .unwrap_or_default()
        .into_iter()
        .map(|i| json!({"media_type": i.media_type, "data_b64": i.data_b64}))
        .collect();
    agent::command(&st, &id, json!({"cmd": "prompt", "text": text, "images": images})).await?;
    // FR-006: workspace chưa có tên → lấy prompt đầu tiên; session cũng lấy làm tiêu đề.
    let db = st.db.lock();
    let s = store::session_get(&db, &id)?;
    store::session_touch(&db, &id)?;
    store::session_set_pinned(&db, &id, true)?;
    if s.title.is_none() {
        store::session_set_field(&db, &id, "title", Some(&first_line_title(&text)))?;
    }
    let ws = store::workspace_get(&db, &s.workspace_id)?;
    if ws.name.is_none() {
        store::workspace_rename(&db, &ws.id, &first_line_title(&text))?;
    }
    st.emit("workspace:changed", json!({"project_id": ws.project_id, "workspace_id": ws.id}));
    Ok(())
}

#[tauri::command]
pub async fn session_interrupt(st: St<'_>, id: String) -> AppResult<()> {
    agent::command(&st, &id, json!({"cmd": "interrupt"})).await.map(|_| ())
}

#[tauri::command]
pub async fn session_permission(st: St<'_>, id: String, request_id: String, decision: String, updated_input: Option<Value>) -> AppResult<()> {
    let mut cmd = json!({"cmd": "permission_response", "id": request_id, "decision": decision});
    if let Some(u) = updated_input {
        cmd["updated_input"] = u;
    }
    agent::command(&st, &id, cmd).await.map(|_| ())
}

/// FR-022a/b: đổi chế độ quyền; `bypass` cần xác nhận rõ.
#[tauri::command]
pub async fn session_set_permission_mode(st: St<'_>, id: String, mode: String, confirm_bypass: Option<bool>) -> AppResult<()> {
    if !MODES.contains(&mode.as_str()) {
        return Err(AppError::new("bad_mode", mode));
    }
    if mode == "bypass" && !confirm_bypass.unwrap_or(false) {
        return Err(AppError::new("confirm_required", "Bypass all approvals mode requires confirmation"));
    }
    agent::command(&st, &id, json!({"cmd": "set_permission_mode", "mode": mode})).await?;
    store::session_set_field(&st.db.lock(), &id, "permission_mode", Some(&mode))?;
    Ok(())
}

/// specs/005: danh sách model engine hỗ trợ. Agent chạy từ bản app cũ không biết `list_models`.
#[tauri::command]
pub async fn session_list_models(st: St<'_>, id: String) -> AppResult<Value> {
    match agent::command(&st, &id, json!({"cmd": "list_models"})).await {
        Ok(v) => Ok(json!({
            "models": v.get("models").cloned().unwrap_or_else(|| json!([])),
            "current": v.get("current").cloned().unwrap_or(Value::Null),
            "default_model": v.get("default_model").cloned().unwrap_or(Value::Null),
        })),
        Err(e) if e.code == "unknown_command" => Err(AppError::new("unsupported", "Restart this session to switch models")),
        Err(e) => Err(e),
    }
}

/// Slash command engine hỗ trợ (built-in + skill + custom command). Agent bản cũ không biết `list_commands`.
#[tauri::command]
pub async fn session_list_commands(st: St<'_>, id: String) -> AppResult<Value> {
    match agent::command(&st, &id, json!({"cmd": "list_commands"})).await {
        Ok(v) => Ok(json!({ "commands": v.get("commands").cloned().unwrap_or_else(|| json!([])) })),
        Err(e) if e.code == "unknown_command" => Err(AppError::new("unsupported", "Restart this session to load its commands")),
        Err(e) => Err(e),
    }
}

/// specs/005 FR-004/FR-007: đổi model; chỉ ghi DB sau khi agent ack.
#[tauri::command]
pub async fn session_set_model(st: St<'_>, id: String, model: String) -> AppResult<()> {
    let model = model.trim().to_string();
    if model.is_empty() {
        return Err(AppError::new("bad_model", "Model must not be empty"));
    }
    agent::command(&st, &id, json!({"cmd": "set_model", "model": model})).await?;
    store::session_set_field(&st.db.lock(), &id, "model", Some(&model))?;
    Ok(())
}

/// Resume: terminal đã kết thúc/mất → chạy lại sidecar, engine nạp lại transcript gốc; seq nối tiếp.
#[tauri::command]
pub async fn session_resume(st: St<'_>, id: String) -> AppResult<Session> {
    let (s, ws) = {
        let db = st.db.lock();
        let s = store::session_get(&db, &id)?;
        let ws = store::workspace_get(&db, &s.workspace_id)?;
        (s, ws)
    };
    if !Path::new(&ws.work_dir).is_dir() {
        return Err(AppError::new("work_dir_missing", "The workspace working directory no longer exists"));
    }
    let hc = st.hc()?;
    if let Some(t) = &s.hc_terminal {
        if let Ok(term) = hc.get(t).await {
            if term.state == "live" {
                return Ok(s);
            }
            let _ = hc.rm(t).await;
        }
    }
    store::session_set_terminal(&st.db.lock(), &id, None)?;
    agent::spawn_sidecar(&st, &s, &ws).await?;
    {
        let db = st.db.lock();
        store::session_set_status(&db, &id, "idle")?;
        store::session_set_pinned(&db, &id, true)?;
    }
    st.emit("status:changed", json!({"session_id": id, "workspace_id": ws.id, "state": "idle"}));
    store::session_get(&st.db.lock(), &id)
}

/// Đóng tab: tắt terminal hc của session (tránh rò terminal); session chưa chat → xoá hẳn khỏi lịch sử.
#[tauri::command]
pub async fn session_close(st: St<'_>, id: String) -> AppResult<()> {
    let s = store::session_get(&st.db.lock(), &id)?;
    agent::close_view(&st, &id);
    if let (Some(t), Some(hc)) = (&s.hc_terminal, &st.hc) {
        if s.status != "done" && s.status != "error" {
            let _ = agent::command(&st, &id, json!({"cmd": "shutdown"})).await;
            tokio::time::sleep(std::time::Duration::from_millis(300)).await;
            let _ = hc.kill(t).await;
        }
        if s.title.is_none() {
            let _ = hc.rm(t).await;
        }
    }
    if s.title.is_none() {
        let _ = std::fs::remove_dir_all(st.session_dir(&id));
        st.db.lock().execute("DELETE FROM sessions WHERE id = ?1", [&id])?;
        if let Ok(ws) = store::workspace_get(&st.db.lock(), &s.workspace_id) {
            st.emit("workspace:changed", json!({"project_id": ws.project_id, "workspace_id": ws.id}));
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn session_kill(st: St<'_>, id: String) -> AppResult<()> {
    let s = store::session_get(&st.db.lock(), &id)?;
    if agent::command(&st, &id, json!({"cmd": "shutdown"})).await.is_err() {
        if let (Some(t), Some(hc)) = (&s.hc_terminal, &st.hc) {
            hc.kill(t).await?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn session_set_pinned(st: St<'_>, id: String, pinned: bool) -> AppResult<()> {
    store::session_set_pinned(&st.db.lock(), &id, pinned)
}

#[tauri::command]
pub fn session_get(st: St<'_>, id: String) -> AppResult<Session> {
    store::session_get(&st.db.lock(), &id)
}

#[derive(serde::Serialize)]
pub struct ClaudeHitView {
    #[serde(flatten)]
    hit: crate::claude_history::ClaudeHit,
    /// Workspace của Herdsman có work_dir trùng cwd của conversation (None → chưa thêm vào app).
    workspace_id: Option<String>,
    workspace_name: Option<String>,
    project_id: Option<String>,
    project_name: Option<String>,
}

fn workspace_for_cwd(db: &rusqlite::Connection, cwd: &str) -> Option<store::Workspace> {
    store::workspace_list(db, None, false).ok()?.into_iter().find(|w| w.work_dir == cwd)
}

/// Tìm trong transcript Claude Code (~/.claude/projects), không phải session hc của app.
#[tauri::command]
pub async fn claude_search(st: St<'_>, query: String) -> AppResult<Vec<ClaudeHitView>> {
    let hits = tokio::task::spawn_blocking(move || crate::claude_history::search(&query, 50))
        .await
        .map_err(|e| AppError::new("search_failed", e.to_string()))?;
    let db = st.db.lock();
    Ok(hits
        .into_iter()
        .map(|hit| {
            let ws = hit.cwd.as_deref().and_then(|c| workspace_for_cwd(&db, c));
            let project = ws.as_ref().and_then(|w| store::project_get(&db, &w.project_id).ok());
            ClaudeHitView {
                workspace_id: ws.as_ref().map(|w| w.id.clone()),
                workspace_name: ws.as_ref().and_then(|w| w.name.clone()),
                project_id: project.as_ref().map(|p| p.id.clone()),
                project_name: project.map(|p| p.name),
                hit,
            }
        })
        .collect())
}

/// Mở một conversation Claude trong Herdsman: dùng lại session đã có, hoặc tạo session mới resume từ transcript.
#[tauri::command]
pub async fn claude_open(st: St<'_>, claude_session_id: String, cwd: String) -> AppResult<Session> {
    let (ws, existing) = {
        let db = st.db.lock();
        let ws = workspace_for_cwd(&db, &cwd)
            .ok_or_else(|| AppError::new("no_workspace", "This conversation's folder is not a workspace in Herdsman"))?;
        let existing = store::session_list(&db, &ws.id)?
            .into_iter()
            .find(|s| s.engine_session_id.as_deref() == Some(claude_session_id.as_str()));
        (ws, existing)
    };
    if let Some(s) = existing {
        return Ok(s);
    }
    let s = {
        let db = st.db.lock();
        let s = store::session_insert(&db, &ws.id, "claude", DEFAULT_MODE)?;
        store::session_set_field(&db, &s.id, "engine_session_id", Some(&claude_session_id))?;
        s
    };
    let dir = st.session_dir(&s.id);
    std::fs::create_dir_all(&dir)?;
    std::fs::write(dir.join("meta.json"), json!({ "engine_session_id": claude_session_id }).to_string())?;
    if let Err(e) = agent::spawn_sidecar(&st, &s, &ws).await {
        let _ = st.db.lock().execute("DELETE FROM sessions WHERE id = ?1", [&s.id]);
        return Err(e);
    }
    store::session_get(&st.db.lock(), &s.id)
}

#[tauri::command]
pub fn search(st: St<'_>, query: String, workspace_id: Option<String>) -> AppResult<Vec<SearchHit>> {
    store::search(&st.db.lock(), &query, workspace_id.as_deref(), 50)
}

// ───────────────────────────── Log, tasks, agents (F7, F8, F9) ─────────────────────────────

#[tauri::command]
pub async fn terminal_read(st: St<'_>, terminal: String, lines: Option<u32>) -> AppResult<String> {
    st.hc()?.read(&terminal, lines.unwrap_or(2000)).await
}

#[derive(Serialize)]
pub struct TaskRef {
    terminal: String,
    command: String,
    state: String,
    exit_code: Option<i32>,
    created_ms: Option<u64>,
}

#[tauri::command]
pub async fn task_run(st: St<'_>, project_id: String, command: String) -> AppResult<TaskRef> {
    let p = store::project_get(&st.db.lock(), &project_id)?;
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".into());
    let labels = [
        ("herdsman.app", "1".to_string()),
        ("herdsman.kind", "task".to_string()),
        ("herdsman.project", project_id.clone()),
        ("herdsman.command", command.chars().take(200).collect::<String>()),
    ];
    let t = st.hc()?.run(&[shell, "-lc".into(), command.clone()], &p.path, &labels).await?;
    Ok(TaskRef { terminal: t.address, command, state: t.state, exit_code: t.exit_code, created_ms: t.created_ms })
}

#[tauri::command]
pub async fn task_list(st: St<'_>, project_id: String) -> AppResult<Vec<TaskRef>> {
    let terms = st.hc()?.list(&[("herdsman.app", "1"), ("herdsman.kind", "task"), ("herdsman.project", &project_id)], true).await?;
    Ok(terms
        .into_iter()
        .map(|t| TaskRef {
            command: t.label("herdsman.command").map(|s| s.to_string()).unwrap_or_else(|| t.argv.last().cloned().unwrap_or_default()),
            terminal: t.address,
            state: t.state,
            exit_code: t.exit_code,
            created_ms: t.created_ms,
        })
        .collect())
}

#[tauri::command]
pub async fn task_kill(st: St<'_>, terminal: String) -> AppResult<()> {
    st.hc()?.kill(&terminal).await
}

#[tauri::command]
pub async fn task_remove(st: St<'_>, terminal: String) -> AppResult<()> {
    st.hc()?.rm(&terminal).await
}

#[derive(Serialize)]
#[derive(Debug)]
pub struct AgentNode {
    pub terminal: String,
    pub title: String,
    pub state: String,
    pub status: Option<String>,
    pub kind: Option<String>,
    pub progress: Option<u8>,
    pub children: Vec<AgentNode>,
}

pub fn build_tree(addr: &str, all: &[Terminal], depth: u8) -> Option<AgentNode> {
    let t = all.iter().find(|t| t.address == addr)?;
    let children = if depth > 6 {
        vec![]
    } else {
        all.iter().filter(|c| c.parent.as_deref() == Some(addr)).filter_map(|c| build_tree(&c.address, all, depth + 1)).collect()
    };
    let title = t
        .name
        .clone()
        .or_else(|| t.title.clone().filter(|s| !s.is_empty()))
        .unwrap_or_else(|| t.argv.iter().map(|a| Path::new(a).file_name().map(|f| f.to_string_lossy().to_string()).unwrap_or_default()).take(3).collect::<Vec<_>>().join(" "));
    Some(AgentNode {
        terminal: t.address.clone(),
        title,
        state: t.state.clone(),
        status: t.status.as_ref().map(|s| s.state.clone()),
        kind: t.status.as_ref().and_then(|s| s.kind.clone()),
        progress: t.status.as_ref().and_then(|s| s.progress),
        children,
    })
}

/// FR-025: cây agent cha → con dựng từ `parent` của terminal hc.
#[tauri::command]
pub async fn agent_tree(st: St<'_>, session_id: String) -> AppResult<Option<AgentNode>> {
    let s = store::session_get(&st.db.lock(), &session_id)?;
    let Some(root) = s.hc_terminal else { return Ok(None) };
    let all = st.hc()?.list(&[], true).await?;
    Ok(build_tree(&root, &all, 0))
}

#[derive(Serialize)]
pub struct ChangedFile {
    status: String,
    path: String,
}

#[tauri::command]
pub async fn files_changed(st: St<'_>, workspace_id: String) -> AppResult<Vec<ChangedFile>> {
    let ws = store::workspace_get(&st.db.lock(), &workspace_id)?;
    let dir = Path::new(&ws.work_dir);
    if !git::is_repo(dir).await {
        return Ok(vec![]);
    }
    Ok(git::changed_files(dir).await?.into_iter().map(|(status, path)| ChangedFile { status, path }).collect())
}

#[tauri::command]
pub async fn file_diff(st: St<'_>, workspace_id: String, path: String) -> AppResult<String> {
    let ws = store::workspace_get(&st.db.lock(), &workspace_id)?;
    git::file_diff(Path::new(&ws.work_dir), &path).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn title_from_prompt() {
        assert_eq!(first_line_title("\n  Sửa lỗi login\nchi tiết"), "Sửa lỗi login");
        let long = "a".repeat(60);
        assert_eq!(first_line_title(&long).chars().count(), 41);
    }
}

#[cfg(test)]
mod theme_file_tests {
    use super::*;

    #[test]
    fn reads_only_json_sorted_and_creates_the_dir() {
        let base = std::env::temp_dir().join(format!("herdsman-themes-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&base);
        let dir = base.join("themes");
        assert!(read_theme_files(&dir).is_empty()); // missing dir → created, empty
        assert!(dir.is_dir());
        std::fs::write(dir.join("b.json"), "{}").unwrap();
        std::fs::write(dir.join("a.JSON"), "{\"background\":\"#fff\"}").unwrap();
        std::fs::write(dir.join("notes.txt"), "x").unwrap();
        let files = read_theme_files(&dir);
        assert_eq!(files.iter().map(|f| f.file.as_str()).collect::<Vec<_>>(), vec!["a.JSON", "b.json"]);
        assert_eq!(files[1].text.as_deref(), Some("{}"));
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn oversized_file_returns_an_error_not_text() {
        let base = std::env::temp_dir().join(format!("herdsman-themes-big-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&base);
        std::fs::create_dir_all(&base).unwrap();
        std::fs::write(base.join("big.json"), vec![b' '; (MAX_THEME_BYTES + 1) as usize]).unwrap();
        let files = read_theme_files(&base);
        assert_eq!(files.len(), 1);
        assert!(files[0].text.is_none());
        assert!(files[0].error.is_some());
        std::fs::remove_dir_all(&base).unwrap();
    }
}

#[cfg(all(test, target_os = "macos"))]
mod font_tests {
    #[test]
    fn lists_installed_families() {
        let f = super::list_font_families();
        eprintln!("font families: {}", f.len());
        assert!(f.iter().any(|n| n == "Menlo"), "Menlo ships with macOS");
        assert!(f.iter().all(|n| !n.starts_with('.')));
    }
}
