//! Quản lý session: chạy sidecar qua hc, kết nối socket, đẩy event lên UI, đồng bộ trạng thái.
use crate::claude_history;
use crate::error::{AppError, AppResult};
use crate::hc::Terminal;
use crate::state::AppState;
use crate::store::{self, IndexItem, Session, Workspace};
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::time::SystemTime;
use std::fs::File;
use std::io::{BufRead, BufReader as FileReader, Read, Seek, SeekFrom};
use std::path::Path;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::UnixStream;

pub const PROTO: u64 = 1;

/// Chạy sidecar `herdsman-agent` trong một terminal hc (contracts/hc-integration.md).
fn codex_binary() -> AppResult<PathBuf> {
    if let Some(path) = std::env::var_os("HERDSMAN_CODEX") {
        return Ok(PathBuf::from(path));
    }
    if let Ok(executable) = std::env::current_exe() {
        if let Some(contents) = executable.parent().and_then(Path::parent) {
            let bundled = contents.join("Resources/codex/bin/codex");
            if bundled.is_file() {
                return Ok(bundled);
            }
        }
    }
    crate::hc::which_in_login_shell("codex").ok_or_else(|| {
        AppError::new("codex_missing", "Install the Codex CLI, then run codex login.")
    })
}

pub async fn codex_probe(st: &AppState, cwd: &str, action: &str, thread_id: Option<&str>) -> AppResult<Value> {
    let node = st.node.as_ref().ok_or_else(|| AppError::new("node_missing", "Install Node.js to run Codex in Herdsman."))?;
    let binary = codex_binary()?;
    let script = st.sidecar.with_file_name("engines").join("codex.mjs");
    let mut args = vec![
        node.to_string_lossy().into_owned(),
        script.to_string_lossy().into_owned(),
        binary.to_string_lossy().into_owned(),
        cwd.to_owned(),
        action.to_owned(),
    ];
    if let Some(id) = thread_id {
        args.push(id.to_owned());
    }
    let output = st.hc()?.exec_metadata(cwd, &args).await?;
    if !output.status.success() {
        let message = String::from_utf8_lossy(&output.stderr);
        let message = message.lines().last().filter(|line| !line.is_empty())
            .unwrap_or("Codex is unavailable. Check the installed CLI and run codex login.");
        return Err(AppError::new("codex_unavailable", message));
    }
    Ok(serde_json::from_slice(&output.stdout)?)
}

pub async fn spawn_sidecar(st: &AppState, s: &Session, ws: &Workspace) -> AppResult<Terminal> {
    let mut warnings = Vec::new();
    if s.engine == "claude" {
        warnings = crate::project_skills::prepare_missing(st, ws, &s.id).await;
        warnings.extend(crate::mcp::prepare_launch(st, ws, &s.id, false));
    }
    spawn_with_skills(st, s, ws, warnings).await
}

pub async fn spawn_new_sidecar(st: &AppState, s: &Session, ws: &Workspace) -> AppResult<Terminal> {
    let mut warnings = Vec::new();
    if s.engine == "claude" {
        warnings = crate::project_skills::prepare(st, ws, &s.id).await;
        warnings.extend(crate::mcp::prepare_launch(st, ws, &s.id, true));
    }
    spawn_with_skills(st, s, ws, warnings).await
}

async fn spawn_with_skills(st: &AppState, s: &Session, ws: &Workspace, warnings: Vec<String>) -> AppResult<Terminal> {
    let hc = st.hc()?;
    let node = st
        .node
        .as_ref()
        .ok_or_else(|| AppError::new("node_missing", "Node.js not found; cannot run herdsman-agent"))?;
    let mut argv: Vec<String> = vec![
        node.to_string_lossy().into(),
        st.sidecar.to_string_lossy().into(),
        "--session".into(),
        s.id.clone(),
        "--cwd".into(),
        ws.work_dir.clone(),
        "--engine".into(),
        s.engine.clone(),
        "--permission-mode".into(),
        s.permission_mode.clone(),
        "--data-dir".into(),
        st.data_dir.to_string_lossy().into(),
    ];
    if s.engine == "codex" {
        let codex = codex_binary()?;
        argv.extend(["--codex-binary".into(), codex.to_string_lossy().into()]);
        if let Some(model) = &s.model {
            argv.extend(["--model".into(), model.clone()]);
        }
    }
    if let ("claude", Some(model)) = (s.engine.as_str(), &s.model) {
        argv.extend(["--model".into(), model.clone()]);
        if s.engine_session_id.is_none() {
            argv.push("--inherited-model".into());
        }
    }
    if s.engine == "claude" {
        let plugin = crate::project_skills::plugin_path(&st.session_dir(&s.id));
        if plugin.is_dir() {
            argv.extend(["--project-skills-plugin".into(), plugin.to_string_lossy().into()]);
        }
        let mcp = crate::mcp::launch_path(&st.session_dir(&s.id));
        if mcp.is_file() {
            argv.extend(["--mcp-servers-file".into(), mcp.to_string_lossy().into()]);
        }
        let denied = crate::mcp::denied_path(&st.session_dir(&s.id));
        if denied.is_file() {
            argv.extend(["--mcp-denied-file".into(), denied.to_string_lossy().into()]);
        }
        if !warnings.is_empty() {
            argv.extend(["--project-skills-warning".into(), warnings.join("\n")]);
        }
    }
    let labels = [
        ("herdsman.app", "1".to_string()),
        ("herdsman.kind", "session".to_string()),
        ("herdsman.project", ws.project_id.clone()),
        ("herdsman.workspace", ws.id.clone()),
        ("herdsman.session", s.id.clone()),
        ("herdsman.engine", s.engine.clone()),
    ];
    let term = match hc.run(&argv, &ws.work_dir, &labels).await {
        Ok(term) => term,
        Err(error) => {
            // The sidecar never started, so nobody will delete the secrets file it was meant to read.
            let _ = std::fs::remove_file(crate::mcp::launch_path(&st.session_dir(&s.id)));
            return Err(error);
        }
    };
    store::session_set_terminal(&st.db.lock(), &s.id, Some(&term.address))?;
    st.terminals.lock().insert(term.address.clone(), term.clone());
    Ok(term)
}

async fn connect(st: &AppState, sid: &str, attempts: u32) -> AppResult<UnixStream> {
    let path = st.sock_path(sid);
    let mut last = String::new();
    for _ in 0..attempts {
        match UnixStream::connect(&path).await {
            Ok(s) => return Ok(s),
            Err(e) => last = e.to_string(),
        }
        tokio::time::sleep(Duration::from_millis(200)).await;
    }
    Err(AppError::new("sidecar_unreachable", format!("Could not connect to the agent: {last}")))
}

/// Gửi một lệnh tới sidecar (kết nối riêng, chờ phản hồi có cùng `req`).
pub async fn command(st: &AppState, sid: &str, mut cmd: Value) -> AppResult<Value> {
    let stream = connect(st, sid, 25).await?;
    let (r, mut w) = stream.into_split();
    let mut lines = BufReader::new(r).lines();
    let hello = json!({"cmd": "hello", "proto": PROTO, "req": 0});
    w.write_all(format!("{hello}\n").as_bytes()).await?;
    cmd["req"] = json!(1);
    w.write_all(format!("{cmd}\n").as_bytes()).await?;
    let wait = async {
        while let Some(line) = lines.next_line().await? {
            let v: Value = serde_json::from_str(&line).unwrap_or(Value::Null);
            if v.get("req") == Some(&json!(0)) && v.get("type") == Some(&json!("error")) {
                return Err(AppError::new("proto_mismatch", "Agent protocol version mismatch"));
            }
            if v.get("req") == Some(&json!(1)) {
                if v.get("type") == Some(&json!("error")) {
                    let code = v.get("code").and_then(|c| c.as_str()).unwrap_or("agent_error");
                    let msg = v.get("message").and_then(|c| c.as_str()).unwrap_or(code);
                    return Err(AppError::new(code, msg.to_string()));
                }
                return Ok(v);
            }
        }
        Err(AppError::new("sidecar_closed", "The agent closed the connection"))
    };
    tokio::time::timeout(Duration::from_secs(15), wait)
        .await
        .map_err(|_| AppError::new("timeout", "The agent is not responding"))?
}

/// Mở luồng hiển thị: phát lại toàn bộ event log rồi stream trực tiếp, gom batch ~30 ms.
pub fn open_view(st: Arc<AppState>, sid: String) {
    close_view(&st, &sid);
    let st2 = st.clone();
    let sid2 = sid.clone();
    let task = tokio::spawn(async move {
        if let Err(e) = run_view(st2.clone(), &sid2).await {
            if e.code == "sidecar_unreachable" {
                emit_saved_history(&st2, &sid2).await;
            }
            st2.emit("session:events", json!({"session_id": sid2, "events": [], "error": e}));
        }
        st2.views.lock().remove(&sid2);
    });
    st.views.lock().insert(sid, task.abort_handle());
}

pub fn close_view(st: &AppState, sid: &str) {
    if let Some(h) = st.views.lock().remove(sid) {
        h.abort();
    }
}

pub fn open_saved_history(st: Arc<AppState>, sid: String) {
    close_view(&st, &sid);
    let state = st.clone();
    let id = sid.clone();
    let task = tokio::spawn(async move {
        emit_saved_history(&state, &id).await;
        state.emit("session:events", json!({"session_id": id, "events": [], "closed": true}));
    });
    st.views.lock().insert(sid, task.abort_handle());
}

// A stopped agent has no socket. The transcript is still available on disk.
pub(crate) async fn emit_saved_history(st: &AppState, sid: &str) {
    let path = st.session_dir(sid).join("events.ndjson");
    let Ok(file) = tokio::fs::File::open(path).await else { return };
    let mut lines = BufReader::new(file).lines();
    let mut events = Vec::new();
    while let Ok(Some(line)) = lines.next_line().await {
        let Ok(event) = serde_json::from_str::<Value>(&line) else { continue };
        if event["type"] == "permission_request" {
            continue;
        }
        events.push(event);
        if events.len() == 100 {
            st.emit("session:events", json!({"session_id": sid, "events": std::mem::take(&mut events)}));
        }
    }
    if !events.is_empty() {
        st.emit("session:events", json!({"session_id": sid, "events": events}));
    }
}

async fn run_view(st: Arc<AppState>, sid: &str) -> AppResult<()> {
    let stopped = store::session_get(&st.db.lock(), sid)
        .is_ok_and(|s| matches!(s.status.as_str(), "done" | "error"));
    let stream = connect(&st, sid, if stopped { 1 } else { 50 }).await?;
    let (r, mut w) = stream.into_split();
    w.write_all(format!("{}\n", json!({"cmd": "hello", "proto": PROTO})).as_bytes()).await?;
    w.write_all(format!("{}\n", json!({"cmd": "subscribe", "from_seq": 0})).as_bytes()).await?;
    let mut lines = BufReader::new(r).lines();
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<Value>();

    // Batch: gom event trong 30 ms rồi gửi một lần (delta chỉ re-render message đang chạy ở UI).
    let st_b = st.clone();
    let sid_b = sid.to_string();
    let batcher = tokio::spawn(async move {
        let mut buf: Vec<Value> = Vec::new();
        loop {
            let first = rx.recv().await;
            let Some(first) = first else { break };
            buf.push(first);
            let deadline = tokio::time::sleep(Duration::from_millis(30));
            tokio::pin!(deadline);
            loop {
                tokio::select! {
                    _ = &mut deadline => break,
                    v = rx.recv() => match v { Some(v) => buf.push(v), None => break },
                }
            }
            let events = std::mem::take(&mut buf);
            persist_events(&st_b, &sid_b, &events);
            st_b.emit("session:events", json!({"session_id": sid_b, "events": events}));
        }
    });

    while let Some(line) = lines.next_line().await? {
        let Ok(v) = serde_json::from_str::<Value>(&line) else { continue };
        match v.get("type").and_then(|t| t.as_str()) {
            Some("hello") => {
                st.emit("session:info", json!({"session_id": sid, "info": v}));
            }
            Some("live") | Some("ack") => {}
            _ => {
                let _ = tx.send(v);
            }
        }
    }
    drop(tx);
    let _ = batcher.await;
    st.emit("session:events", json!({"session_id": sid, "events": [], "closed": true}));
    Ok(())
}

/// Ghi lại những gì cần bền vững từ event: trạng thái, id engine, chỉ mục tìm kiếm, last_seen_seq.
fn persist_events(st: &AppState, sid: &str, events: &[Value]) {
    let db = st.db.lock();
    let Ok(session) = store::session_get(&db, sid) else { return };
    let ws = store::workspace_get(&db, &session.workspace_id).ok();
    let mut max_seq = session.last_seen_seq;
    let mut items: Vec<(i64, String, String)> = Vec::new();
    for ev in events {
        let seq = ev.get("seq").and_then(|s| s.as_i64()).unwrap_or(0);
        max_seq = max_seq.max(seq);
        // Event đã thấy (phát lại khi mở lại view) không được ghi đè trạng thái hiện tại.
        let fresh = seq > session.last_seen_seq;
        match if fresh { ev.get("type").and_then(|t| t.as_str()).unwrap_or("") } else { "" } {
            "status" => {
                let state = ev.get("state").and_then(|s| s.as_str()).unwrap_or("idle");
                if store::session_set_status(&db, sid, state).unwrap_or(false) {
                    let kind = ev.get("kind").cloned().unwrap_or(Value::Null);
                    let mut status = json!({"session_id": sid, "workspace_id": session.workspace_id, "state": state, "kind": kind});
                    if state == "idle" && kind.as_str() == Some("turn_complete") {
                        if let Some((seq, ts)) = completed_turn(&st.session_dir(sid).join("events.ndjson")) {
                            status["completion_seq"] = json!(seq);
                            status["completion_ts"] = json!(ts);
                        }
                    }
                    st.emit("status:changed", status);
                }
            }
            "engine_session" => {
                if let Some(id) = ev.get("engine_session_id").and_then(|s| s.as_str()) {
                    let _ = store::session_set_field(&db, sid, "engine_session_id", Some(id));
                }
                if let Some(m) = ev.get("model").and_then(|s| s.as_str()) {
                    let _ = store::session_set_field(&db, sid, "model", Some(m));
                }
            }
            "model_fallback" => {
                let _ = store::session_set_field(&db, sid, "model", None);
            }
            "model_changed" => {
                if let Some(m) = ev.get("model").and_then(|s| s.as_str()) {
                    let _ = store::session_set_field(&db, sid, "model", Some(m));
                }
            }
            "permission_mode_changed" => {
                if let Some(m) = ev.get("mode").and_then(|s| s.as_str()) {
                    let _ = store::session_set_field(&db, sid, "permission_mode", Some(m));
                }
            }
            _ => {}
        }
        if seq > session.indexed_seq {
            if let Some((role, text)) = index_text(ev) {
                items.push((seq, role, text));
            }
        }
    }
    if let Some(ws) = ws {
        if !items.is_empty() {
            let idx: Vec<IndexItem> = items
                .iter()
                .map(|(seq, role, text)| IndexItem { session_id: sid, workspace_id: &ws.id, project_id: &ws.project_id, seq: *seq, role, text })
                .collect();
            let _ = store::index_messages(&db, &idx, sid, max_seq);
        }
    }
    let _ = store::session_set_seen(&db, sid, max_seq);
}

/// Nội dung đưa vào chỉ mục tìm kiếm cho một event (FR-028).
pub fn index_text(ev: &Value) -> Option<(String, String)> {
    match ev.get("type").and_then(|t| t.as_str())? {
        "user_message" => Some(("user".into(), ev.get("text")?.as_str()?.to_string())),
        "assistant_message" => {
            let text = ev
                .get("blocks")?
                .as_array()?
                .iter()
                .filter(|b| b.get("kind").and_then(|k| k.as_str()) == Some("text"))
                .filter_map(|b| b.get("text").and_then(|t| t.as_str()))
                .collect::<Vec<_>>()
                .join("\n");
            (!text.is_empty()).then(|| ("assistant".into(), text))
        }
        "tool_use" => {
            let tool = ev.get("tool")?.as_str()?;
            let input = ev.get("input")?;
            let detail = ["command", "file_path", "pattern", "description", "prompt"]
                .iter()
                .find_map(|k| input.get(*k).and_then(|v| v.as_str()))
                .unwrap_or("");
            Some(("tool".into(), format!("{tool} {detail}")))
        }
        _ => None,
    }
}

fn matches_legacy_prompt_title(path: &Path, saved: &str) -> bool {
    let Ok(file) = File::open(path) else { return false };
    for line in FileReader::new(file).lines().map_while(Result::ok) {
        let Ok(event) = serde_json::from_str::<Value>(&line) else { continue };
        if event["type"] == "user_message" && event["source"] == "app" {
            let Some(text) = event["text"].as_str() else { return false };
            let title = text.lines().map(str::trim).find(|line| !line.is_empty()).unwrap_or("Session");
            return saved == title || title.char_indices().nth(40).is_some_and(|(cut, _)| {
                format!("{}…", title[..cut].trim_end()) == saved
            });
        }
    }
    false
}

/// Remove older prompt-derived names only when the recorded prompt matches.
fn clear_legacy_prompt_titles(st: &AppState) -> AppResult<()> {
    const KEY: &str = "legacy_prompt_titles_cleared";
    let sessions = {
        let db = st.db.lock();
        if store::setting_get(&db, KEY)?.is_some() {
            return Ok(());
        }
        store::session_all(&db)?
    };
    let mut repairs = Vec::new();
    let mut workspace_names = HashSet::new();
    for session in &sessions {
        let Some(saved) = session.title.as_deref() else { continue };
        let path = st.session_dir(&session.id).join("events.ndjson");
        if matches_legacy_prompt_title(&path, saved) {
            repairs.push((&session.id, saved));
            workspace_names.insert((&session.workspace_id, saved));
        }
    }
    let mut db = st.db.lock();
    let tx = db.transaction()?;
    let mut changed = 0;
    for (id, saved) in repairs {
        changed += tx.execute("UPDATE sessions SET title = NULL WHERE id = ?1 AND title = ?2", rusqlite::params![id, saved])?;
    }
    for (id, saved) in workspace_names {
        changed += tx.execute("UPDATE workspaces SET name = NULL WHERE id = ?1 AND name = ?2", rusqlite::params![id, saved])?;
    }
    store::setting_set(&tx, KEY, "true")?;
    tx.commit()?;
    drop(db);
    if changed > 0 {
        st.emit("workspace:changed", json!({}));
    }
    Ok(())
}

fn refresh_claude_titles(st: &AppState, projects: &Path, untitled: &mut HashMap<PathBuf, SystemTime>) -> AppResult<()> {
    let sessions = store::session_all(&st.db.lock())?;
    let mut checked = HashSet::new();
    let mut changed = false;

    for session in sessions.into_iter().filter(|s| s.engine == "claude" && s.title.is_none()) {
        // Sessions can finish while their views are closed. In that case, the sidecar
        // has recorded the engine ID on disk even if the database has not seen the event.
        let id = session.engine_session_id.or_else(|| {
            let meta = std::fs::read(st.session_dir(&session.id).join("meta.json")).ok()?;
            serde_json::from_slice::<Value>(&meta).ok()?["engine_session_id"].as_str().map(str::to_owned)
        });
        let Some(path) = id.and_then(|id| claude_history::session_path(projects, &id)) else { continue };
        checked.insert(path.clone());
        let Ok(modified) = path.metadata().and_then(|file| file.modified()) else { continue };
        if untitled.get(&path) == Some(&modified) {
            continue;
        }
        let Some(title) = claude_history::session_title(&path) else {
            untitled.insert(path, modified);
            continue;
        };
        changed |= store::fill_conversation_title(&mut st.db.lock(), &session.id, &session.workspace_id, &title)?;
    }

    untitled.retain(|path, _| checked.contains(path));
    if changed {
        st.emit("workspace:changed", json!({}));
    }
    Ok(())
}

pub async fn watch_claude_titles(st: Arc<AppState>) {
    let cleanup_state = st.clone();
    let _ = tokio::task::spawn_blocking(move || {
        if let Err(error) = clear_legacy_prompt_titles(&cleanup_state) {
            eprintln!("Could not clear legacy conversation titles: {}", error.message);
        }
    }).await;

    let Some(projects) = claude_history::claude_dir().map(|dir| dir.join("projects")) else { return };
    let mut untitled = HashMap::new();
    loop {
        let st = st.clone();
        let projects = projects.clone();
        let result = tokio::task::spawn_blocking(move || {
            if let Err(error) = refresh_claude_titles(&st, &projects, &mut untitled) {
                eprintln!("Could not refresh Claude conversation titles: {}", error.message);
            }
            untitled
        }).await;
        let Ok(checked) = result else { return };
        untitled = checked;
        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}

/// Index bù cho những session chưa được index hết (đọc event log trên đĩa).
pub fn backfill_index(st: &AppState) {
    let sessions = match store::session_all(&st.db.lock()) {
        Ok(s) => s,
        Err(_) => return,
    };
    for s in sessions {
        backfill_session_index(st, &s);
    }
}

pub(crate) fn backfill_session_index(st: &AppState, session: &Session) {
    let path = st.session_dir(&session.id).join("events.ndjson");
    let Ok(text) = std::fs::read_to_string(&path) else { return };
    let events: Vec<Value> = text
        .lines()
        .filter_map(|line| serde_json::from_str::<Value>(line).ok())
        .filter(|event| event.get("seq").and_then(Value::as_i64).unwrap_or(0) > session.indexed_seq)
        .collect();
    if !events.is_empty() {
        persist_events(st, &session.id, &events);
    }
}

// ───────────────────────────── Theo dõi hc ─────────────────────────────

fn derive_status(t: &Terminal) -> &'static str {
    if t.state == "live" {
        match t.status.as_ref().map(|s| s.state.as_str()) {
            Some("working") => "working",
            Some("blocked") => "blocked",
            Some("done") => "done",
            Some("error") => "error",
            _ => "idle",
        }
    } else if t.exit_code == Some(0) || t.reason.as_deref() == Some("killed") {
        "done"
    } else {
        "error"
    }
}

// Some hc versions omit the kind on idle statuses. Read the latest turn from the
// sidecar log, starting at the tail so long conversations usually cost one read.
pub(crate) fn completed_turn(log: &Path) -> Option<(u64, i64)> {
    let read_tail = || -> std::io::Result<Option<(u64, i64)>> {
        let mut file = File::open(log)?;
        let end = file.metadata()?.len();
        let mut size = 8192;
        loop {
            let start = end.saturating_sub(size);
            file.seek(SeekFrom::Start(start))?;
            let mut bytes = vec![0; (end - start) as usize];
            file.read_exact(&mut bytes)?;
            let lines = if start == 0 {
                &bytes[..]
            } else {
                bytes.iter().position(|byte| *byte == b'\n').map_or(&[][..], |i| &bytes[i + 1..])
            };
            for line in lines.rsplit(|byte| *byte == b'\n') {
                let Ok(event) = serde_json::from_slice::<Value>(line) else { continue };
                match event["type"].as_str() {
                    Some("turn_end") if event["interrupted"] != true && event["is_error"] != true => {
                        return Ok(event["seq"].as_u64().zip(event["ts"].as_i64()));
                    }
                    Some("turn_end" | "user_message" | "session_started") => return Ok(None),
                    _ => {}
                }
            }
            if start == 0 {
                return Ok(None);
            }
            size = size.saturating_mul(2);
        }
    };
    read_tail().ok().flatten()
}

fn reconcile(st: &AppState, t: &Terminal) {
    match t.label("herdsman.kind") {
        Some("session") => {
            let Some(sid) = t.label("herdsman.session") else { return };
            let db = st.db.lock();
            let Ok(s) = store::session_get(&db, sid) else { return };
            if t.label("herdsman.workspace").is_some_and(|id| id != s.workspace_id)
                || store::workspace_get(&db, &s.workspace_id).is_ok_and(|w| w.deleted_at.is_some())
            {
                return;
            }
            if s.hc_terminal.as_deref() != Some(t.address.as_str()) {
                // terminal cũ của session (trước lần resume): bỏ qua
                if s.hc_terminal.is_some() {
                    return;
                }
                let _ = store::session_set_terminal(&db, sid, Some(&t.address));
            }
            let state = derive_status(t);
            let changed = store::session_set_status(&db, sid, state).unwrap_or(false);
            drop(db);
            // The idle kind can change when a fast turn is missed or after reconnecting.
            if changed || state == "idle" {
                let mut kind = t.status.as_ref().and_then(|s| s.kind.as_deref());
                let completion = if state == "idle" {
                    completed_turn(&st.session_dir(sid).join("events.ndjson"))
                } else {
                    None
                };
                if completion.is_some() && kind.is_none() {
                    kind = Some("turn_complete");
                }
                let mut event = json!({"session_id": sid, "workspace_id": s.workspace_id, "state": state, "kind": kind});
                if let Some((seq, ts)) = completion {
                    event["completion"] = json!({"seq": seq, "ts": ts, "title": s.title});
                }
                st.emit("status:changed", event);
            }
        }
        _ => {}
    }
    st.emit("agents:changed", json!({"terminal": t.address}));
}

/// Session có terminal không còn trong hc (mất do reboot/rm): đánh dấu lỗi để người dùng Resume.
fn mark_lost(st: &AppState, known: &HashMap<String, Terminal>) {
    let db = st.db.lock();
    let Ok(all) = store::session_all(&db) else { return };
    for s in all {
        if let Some(t) = &s.hc_terminal {
            if !known.contains_key(t) && s.status != "done" && s.status != "error" && store::session_set_status(&db, &s.id, "error").unwrap_or(false) {
                st.emit("status:changed", json!({"session_id": s.id, "workspace_id": s.workspace_id, "state": "error", "kind": "lost"}));
            }
        }
    }
}

/// Vòng theo dõi `hc events`: snapshot ban đầu (khôi phục khi mở app) rồi từng thay đổi. Tự nối lại.
pub async fn watch_hc(st: Arc<AppState>) {
    let Some(hc) = st.hc.clone() else {
        st.emit("hc:connection", json!({"connected": false, "error": "hc_missing"}));
        return;
    };
    if let Ok(v) = hc.version().await {
        *st.hc_version.lock() = Some(v);
    }
    let started = std::time::Instant::now();
    let mut first = true;
    loop {
        let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<(String, Option<String>, Value)>();
        let hc2 = hc.clone();
        let follower = tokio::spawn(async move {
            let _ = hc2
                .follow_events(("herdsman.app", "1"), |ty, term, params| {
                    let _ = tx.send((ty.to_string(), term.map(|s| s.to_string()), params.clone()));
                })
                .await;
        });
        while let Some((ty, term, params)) = rx.recv().await {
            if ty == "snapshot" {
                st.hc_connected.store(true, Ordering::SeqCst);
                st.emit("hc:connection", json!({"connected": true, "version": *st.hc_version.lock()}));
                let terms: Vec<Terminal> = serde_json::from_value(params.get("terminals").cloned().unwrap_or(json!([]))).unwrap_or_default();
                let map: HashMap<String, Terminal> = terms.into_iter().map(|t| (t.address.clone(), t)).collect();
                for t in map.values() {
                    reconcile(&st, t);
                }
                mark_lost(&st, &map);
                *st.terminals.lock() = map;
                if first {
                    first = false;
                    eprintln!("[herdsman] restored state from hc in {} ms", started.elapsed().as_millis());
                }
                continue;
            }
            let Some(addr) = term else { continue };
            if ty == "removed" {
                let removed = st.terminals.lock().remove(&addr);
                if let Some(t) = removed.filter(|t| t.label("herdsman.kind") == Some("terminal")) {
                    st.emit("terminals:changed", json!({"workspace_id": t.label("herdsman.workspace")}));
                }
                st.emit("agents:changed", json!({"terminal": addr}));
                continue;
            }
            if ty == "output" || ty == "foreground" || ty == "title" {
                continue;
            }
            if let Ok(t) = hc.get(&addr).await {
                st.terminals.lock().insert(addr.clone(), t.clone());
                if t.label("herdsman.kind") == Some("terminal") && matches!(ty.as_str(), "created" | "finished" | "lost" | "restarted" | "labels") {
                    st.emit("terminals:changed", json!({"workspace_id": t.label("herdsman.workspace")}));
                }
                reconcile(&st, &t);
            }
        }
        let _ = follower.await;
        st.hc_connected.store(false, Ordering::SeqCst);
        st.emit("hc:connection", json!({"connected": false}));
        tokio::time::sleep(Duration::from_secs(2)).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn index_text_extracts() {
        let ev = json!({"type": "assistant_message", "blocks": [{"kind": "thinking", "text": "x"}, {"kind": "text", "text": "Xin chào"}]});
        assert_eq!(index_text(&ev).unwrap().1, "Xin chào");
        let ev = json!({"type": "tool_use", "tool": "Bash", "input": {"command": "ls -la"}});
        assert_eq!(index_text(&ev).unwrap().1, "Bash ls -la");
        assert!(index_text(&json!({"type": "delta", "text": "a"})).is_none());
    }

    #[test]
    fn completion_from_legacy_idle_log() {
        let dir = tempfile::tempdir().unwrap();
        let log = dir.path().join("events.ndjson");
        let idle = json!({"type": "status", "state": "idle"});
        for (event, expected) in [
            (json!({"type": "turn_end", "seq": 2, "ts": 100, "is_error": false, "interrupted": false}), Some((2, 100))),
            (json!({"type": "turn_end", "seq": 2, "ts": 100, "is_error": true}), None),
            (json!({"type": "turn_end", "seq": 2, "ts": 100, "interrupted": true}), None),
            (json!({"type": "user_message", "text": "x".repeat(9000)}), None),
            (json!({"type": "session_started"}), None),
        ] {
            let previous_turn = json!({"type": "turn_end", "seq": 1, "ts": 99});
            std::fs::write(&log, format!("{previous_turn}\n{event}\n{idle}\n")).unwrap();
            assert_eq!(completed_turn(&log), expected);
        }
    }

    #[test]
    fn status_from_terminal() {
        let mut t: Terminal = serde_json::from_value(json!({"address": "t1", "state": "live", "status": {"state": "blocked", "kind": "permission"}})).unwrap();
        assert_eq!(derive_status(&t), "blocked");
        t.state = "finished".into();
        t.exit_code = Some(0);
        assert_eq!(derive_status(&t), "done");
        t.exit_code = Some(1);
        assert_eq!(derive_status(&t), "error");
    }
}

#[cfg(test)]
mod title_backfill_tests {
    use super::*;

    #[test]
    fn replaces_prompt_names_only_when_claude_provides_a_title() {
        let dir = tempfile::tempdir().unwrap();
        let db = store::open(&dir.path().join("herdsman.db")).unwrap();
        let project = store::project_add(&db, "Project", "/project").unwrap();
        let full = "Đổi icon của app này thành icon ở trong thư mục assets";
        let legacy = "Đổi icon của app này thành icon ở trong…";
        store::workspace_insert(&db, "ws", &project.id, Some(legacy), "project", "/project", None, None).unwrap();
        store::workspace_insert(&db, "manual", &project.id, Some("Tên riêng…"), "project", "/project", None, None).unwrap();
        let sessions = [
            (store::session_insert(&db, "ws", "claude", "ask", Some(legacy)).unwrap(), full),
            (store::session_insert(&db, "manual", "claude", "ask", Some(full)).unwrap(), full),
            (store::session_insert(&db, "ws", "claude", "ask", Some("Tên khác…")).unwrap(), full),
        ];
        let st = AppState::new(Box::new(|_, _| {}), db, dir.path().into(), None, None, Default::default());
        for (session, prompt) in &sessions {
            let path = st.session_dir(&session.id);
            std::fs::create_dir_all(&path).unwrap();
            std::fs::write(path.join("events.ndjson"), format!("{}\n{}\n",
                json!({"type": "user_message", "source": "cli", "text": "A separate terminal message"}),
                json!({"type": "user_message", "source": "app", "text": format!("\n  {prompt}\nChi tiết")}),
            )).unwrap();
        }

        clear_legacy_prompt_titles(&st).unwrap();
        let engine_id = "01234567-89ab-cdef-0123-456789abcdef";
        let projects = dir.path().join("projects");
        let project_dir = projects.join("project");
        std::fs::create_dir_all(&project_dir).unwrap();
        for (session, _) in &sessions[..2] {
            std::fs::write(st.session_dir(&session.id).join("meta.json"), json!({"engine_session_id": engine_id}).to_string()).unwrap();
        }
        let transcript = project_dir.join(format!("{engine_id}.jsonl"));
        std::fs::write(&transcript, format!("{}\n", json!({"type": "user", "message": {"content": full}}))).unwrap();

        let mut untitled = HashMap::new();
        refresh_claude_titles(&st, &projects, &mut untitled).unwrap();
        {
            let db = st.db.lock();
            assert_eq!(store::workspace_get(&db, "ws").unwrap().name, None);
            for (session, _) in &sessions[..2] {
                assert_eq!(store::session_get(&db, &session.id).unwrap().title, None);
            }
        }

        let generated = "Đổi icon ứng dụng";
        let custom = "Icon ứng dụng";
        std::fs::write(&transcript, format!("{}\n{}\n",
            json!({"type": "custom-title", "customTitle": custom}),
            json!({"type": "ai-title", "aiTitle": generated}),
        )).unwrap();
        // Avoid file modification timestamp granularity affecting this fixture.
        untitled.clear();
        refresh_claude_titles(&st, &projects, &mut untitled).unwrap();
        clear_legacy_prompt_titles(&st).unwrap();
        let db = st.db.lock();
        assert_eq!(store::workspace_get(&db, "ws").unwrap().name.as_deref(), Some(custom));
        assert_eq!(store::workspace_get(&db, "manual").unwrap().name.as_deref(), Some("Tên riêng…"));
        assert_eq!(store::session_get(&db, &sessions[0].0.id).unwrap().title.as_deref(), Some(custom));
        assert_eq!(store::session_get(&db, &sessions[1].0.id).unwrap().title.as_deref(), Some(custom));
        assert_eq!(store::session_get(&db, &sessions[2].0.id).unwrap().title.as_deref(), Some("Tên khác…"));
    }
}
