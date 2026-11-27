use super::St;
use crate::agent;
use crate::error::{AppError, AppResult};
use crate::state::AppState;
use crate::store::{self, Session};
use serde::Deserialize;
use serde_json::{json, Value};
use std::path::Path;

const ENGINES: &[&str] = &["claude", "codex", "echo"];
const MODES: &[&str] = &["ask", "accept_edits", "auto", "bypass"];

pub(super) fn check_engine(engine: &str) -> AppResult<()> {
    if !ENGINES.contains(&engine) {
        return Err(AppError::new("bad_engine", engine.to_string()));
    }
    Ok(())
}

#[tauri::command]
pub fn session_history(st: St<'_>, workspace_id: String) -> AppResult<Vec<Session>> {
    let sessions = store::session_list(&st.db.lock(), &workspace_id)?;
    Ok(sessions.into_iter().map(|session| with_completion(&st, session)).collect())
}

fn with_completion(st: &AppState, mut session: Session) -> Session {
    if session.status == "idle" {
        session.completion_seq = agent::completed_turn(&st.session_dir(&session.id).join("events.ndjson"))
            .map(|(seq, _)| seq);
    }
    session
}

#[tauri::command]
pub async fn session_create(
    st: St<'_>,
    workspace_id: String,
    engine: Option<String>,
    permission_mode: Option<String>,
    title: Option<String>,
) -> AppResult<Session> {
    let _lifecycle = crate::workspace_terminal::LIFECYCLE.lock().await;
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
    let title = title.as_deref().map(str::trim).filter(|title| !title.is_empty());
    if title.is_some_and(|title| title.contains(['\r', '\n'])) {
        return Err(AppError::new("bad_title", "Session title must fit on one line"));
    }
    let (ws, s) = {
        let db = st.db.lock();
        let ws = store::workspace_get(&db, &workspace_id)?;
        if ws.deleted_at.is_some() {
            return Err(AppError::new("workspace_deleted", "This workspace was deleted"));
        }
        let s = store::new_conversation_insert(&db, &workspace_id, &engine, mode, title)?;
        (ws, s)
    };
    if let Err(e) = agent::spawn_new_sidecar(&st, &s, &ws).await {
        let _ = st.db.lock().execute("DELETE FROM sessions WHERE id = ?1", [&s.id]);
        let _ = std::fs::remove_dir_all(crate::project_skills::plugin_path(&st.session_dir(&s.id)));
        return Err(e);
    }
    store::session_get(&st.db.lock(), &s.id)
}

#[tauri::command]
pub async fn session_open(st: St<'_>, id: String) -> AppResult<()> {
    let (session, archived) = {
        let db = st.db.lock();
        let session = store::session_get(&db, &id)?;
        let archived = store::workspace_get(&db, &session.workspace_id)?.deleted_at.is_some();
        (session, archived)
    };
    if archived {
        agent::open_saved_history(st.inner().clone(), id);
        return Ok(());
    }
    if matches!(session.status.as_str(), "done" | "error") {
        let (_, resumed) = tokio::join!(
            agent::emit_saved_history(&st, &id),
            session_resume(st.clone(), id.clone()),
        );
        if let Err(error) = resumed {
            st.emit("session:events", json!({"session_id": id, "events": [], "closed": true, "error": error}));
            return Ok(());
        }
    }
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

#[tauri::command]
pub async fn session_prompt(st: St<'_>, id: String, text: String, images: Option<Vec<ImageInput>>) -> AppResult<()> {
    let images: Vec<Value> = images
        .unwrap_or_default()
        .into_iter()
        .map(|i| json!({"media_type": i.media_type, "data_b64": i.data_b64}))
        .collect();
    agent::command(&st, &id, json!({"cmd": "prompt", "text": text, "images": images})).await?;
    let db = st.db.lock();
    let s = store::session_get(&db, &id)?;
    store::session_touch(&db, &id)?;
    store::session_set_pinned(&db, &id, true)?;
    let ws = store::workspace_get(&db, &s.workspace_id)?;
    st.emit("workspace:changed", json!({"project_id": ws.project_id, "workspace_id": ws.id}));
    Ok(())
}

#[tauri::command]
pub async fn session_image(st: St<'_>, id: String, attachment_id: String) -> AppResult<String> {
    read_session_image(&st, &id, &attachment_id).await
}

pub async fn read_session_image(st: &AppState, id: &str, attachment_id: &str) -> AppResult<String> {
    if attachment_id.len() != 32 || !attachment_id.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err(AppError::new("invalid_attachment", "Invalid image attachment ID"));
    }
    let session = store::session_get(&st.db.lock(), id)?;
    let file = st.session_dir(&session.id).join("images").join(attachment_id);
    tokio::fs::read_to_string(file)
        .await
        .map_err(|_| AppError::new("image_unavailable", "Image unavailable"))
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
    if !MODES.contains(&mode.as_str())
        && !(mode == "custom" && store::session_get(&st.db.lock(), &id)?.engine == "codex")
    {
        return Err(AppError::new("bad_mode", mode));
    }
    if mode == "bypass" && !confirm_bypass.unwrap_or(false) {
        return Err(AppError::new("confirm_required", "Bypass all approvals mode requires confirmation"));
    }
    let command = json!({"cmd": "set_permission_mode", "mode": mode});
    if let Err(error) = agent::command(&st, &id, command.clone()).await {
        let outdated = matches!(mode.as_str(), "accept_edits" | "bypass" | "custom")
            && (error.message == "Choose Ask or Workspace write for Codex."
                || mode == "custom" && error.code == "bad_mode" && error.message == "invalid mode");
        if !outdated {
            return Err(error);
        }
        let session = store::session_get(&st.db.lock(), &id)?;
        if session.engine != "codex" {
            return Err(error);
        }
        if session.status != "idle" {
            return Err(AppError::new("agent_busy", "Wait for the Codex turn to finish before updating permissions."));
        }
        let terminal = session.hc_terminal.ok_or(error)?;
        agent::command(&st, &id, json!({"cmd": "shutdown"})).await?;
        for _ in 0..25 {
            if !st.session_terminal(&id, &terminal).await.is_ok_and(|term| term.state == "live") {
                break;
            }
            tokio::time::sleep(std::time::Duration::from_millis(80)).await;
        }
        let resumed = session_resume(st.clone(), id.clone()).await?;
        if resumed.hc_terminal.as_deref() == Some(terminal.as_str()) {
            return Err(AppError::new("agent_restart", "Codex is still stopping. Try changing permissions again."));
        }
        agent::open_view(st.inner().clone(), id.clone());
        agent::command(&st, &id, command).await?;
    }
    store::session_confirm_permission_mode(&st.db.lock(), &id, &mode)
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

#[tauri::command]
pub async fn account_usage(st: St<'_>, provider: String) -> AppResult<Value> {
    if !matches!(provider.as_str(), "claude" | "codex") {
        return Err(AppError::new("bad_engine", provider));
    }
    let mut sessions = store::session_all(&st.db.lock())?;
    sessions.retain(|s| s.engine == provider && s.hc_terminal.is_some());
    sessions.sort_unstable_by_key(|s| std::cmp::Reverse(s.updated_at));
    for session in sessions {
        if !st.sock_path(&session.id).exists() {
            continue;
        }
        match agent::command_if_running(&st, &session.id, json!({"cmd": "account_usage"})).await {
            Ok(response) => return Ok(response.get("usage").cloned().unwrap_or(Value::Null)),
            Err(error) if error.code == "timeout" => return Err(error),
            Err(_) => continue,
        }
    }
    Ok(Value::Null)
}

/// specs/005 FR-004/FR-007: đổi model; chỉ ghi DB sau khi agent ack.
#[tauri::command]
pub async fn session_set_model(st: St<'_>, id: String, model: String) -> AppResult<()> {
    let model = model.trim().to_string();
    if model.is_empty() {
        return Err(AppError::new("bad_model", "Model must not be empty"));
    }
    agent::command(&st, &id, json!({"cmd": "set_model", "model": model})).await?;
    store::session_confirm_model(&st.db.lock(), &id, &model)
}

/// Resume: terminal đã kết thúc/mất → chạy lại sidecar, engine nạp lại transcript gốc; seq nối tiếp.
#[tauri::command]
pub async fn session_resume(st: St<'_>, id: String) -> AppResult<Session> {
    let _lifecycle = crate::workspace_terminal::LIFECYCLE.lock().await;
    let (s, ws) = {
        let db = st.db.lock();
        let s = store::session_get(&db, &id)?;
        let ws = store::workspace_get(&db, &s.workspace_id)?;
        (s, ws)
    };
    if ws.deleted_at.is_some() {
        return Err(AppError::new("workspace_deleted", "This workspace was deleted"));
    }
    if !Path::new(&ws.work_dir).is_dir() {
        return Err(AppError::new("work_dir_missing", "The workspace working directory no longer exists"));
    }
    let hc = st.hc()?;
    if let Some(t) = &s.hc_terminal {
        if let Ok(term) = st.session_terminal(&s.id, t).await {
            if term.state == "live" {
                return Ok(s);
            }
            let _ = hc.rm(&term.address).await;
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
    close_session(&st, &id).await
}

pub async fn close_session(st: &AppState, id: &str) -> AppResult<()> {
    let _lifecycle = crate::workspace_terminal::LIFECYCLE.lock().await;
    let id = id.to_string();
    let s = store::session_get(&st.db.lock(), &id)?;
    let ws = store::workspace_get(&st.db.lock(), &s.workspace_id)?;
    agent::close_view(st, &id);
    if ws.deleted_at.is_some() {
        return Ok(());
    }
    let discard = s.title.is_none();
    if let (Some(t), Some(hc)) = (&s.hc_terminal, &st.hc) {
        let terminal = st.session_terminal(&id, t).await.ok();
        if s.status != "done" && s.status != "error" {
            let _ = agent::command(st, &id, json!({"cmd": "shutdown"})).await;
            if let Some(terminal) = &terminal {
                tokio::time::sleep(std::time::Duration::from_millis(300)).await;
                let _ = hc.kill(&terminal.address).await;
            }
        }
        if discard {
            if let Some(terminal) = terminal {
                let _ = hc.rm(&terminal.address).await;
            }
        }
    }
    if discard {
        let _ = std::fs::remove_dir_all(st.session_dir(&id));
        st.db.lock().execute("DELETE FROM sessions WHERE id = ?1", [&id])?;
        st.emit("workspace:changed", json!({"project_id": ws.project_id, "workspace_id": ws.id}));
    }
    Ok(())
}

#[tauri::command]
pub async fn session_kill(st: St<'_>, id: String) -> AppResult<()> {
    let s = store::session_get(&st.db.lock(), &id)?;
    if agent::command(&st, &id, json!({"cmd": "shutdown"})).await.is_err() {
        if let (Some(t), Some(hc)) = (&s.hc_terminal, &st.hc) {
            let terminal = st.session_terminal(&id, t).await?;
            hc.kill(&terminal.address).await?;
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
    let session = store::session_get(&st.db.lock(), &id)?;
    Ok(with_completion(&st, session))
}
