//! Quản lý session: chạy sidecar qua hc, kết nối socket, đẩy event lên UI, đồng bộ trạng thái.
use crate::error::{AppError, AppResult};
use crate::hc::Terminal;
use crate::state::AppState;
use crate::store::{self, IndexItem, Session, Workspace};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::UnixStream;

pub const PROTO: u64 = 1;

/// Chạy sidecar `herdsman-agent` trong một terminal hc (contracts/hc-integration.md).
pub async fn spawn_sidecar(st: &AppState, s: &Session, ws: &Workspace) -> AppResult<Terminal> {
    let hc = st.hc()?;
    let node = st
        .node
        .as_ref()
        .ok_or_else(|| AppError::new("node_missing", "Node.js not found; cannot run herdsman-agent"))?;
    let argv: Vec<String> = vec![
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
    let labels = [
        ("herdsman.app", "1".to_string()),
        ("herdsman.kind", "session".to_string()),
        ("herdsman.project", ws.project_id.clone()),
        ("herdsman.workspace", ws.id.clone()),
        ("herdsman.session", s.id.clone()),
        ("herdsman.engine", s.engine.clone()),
    ];
    let term = hc.run(&argv, &ws.work_dir, &labels).await?;
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

async fn run_view(st: Arc<AppState>, sid: &str) -> AppResult<()> {
    let stream = connect(&st, sid, 50).await?;
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
                    st.emit("status:changed", json!({"session_id": sid, "workspace_id": session.workspace_id, "state": state, "kind": kind}));
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

/// Index bù cho những session chưa được index hết (đọc event log trên đĩa).
pub fn backfill_index(st: &AppState) {
    let sessions = match store::session_all(&st.db.lock()) {
        Ok(s) => s,
        Err(_) => return,
    };
    for s in sessions {
        let path = st.session_dir(&s.id).join("events.ndjson");
        let Ok(text) = std::fs::read_to_string(&path) else { continue };
        let events: Vec<Value> = text
            .lines()
            .filter_map(|l| serde_json::from_str::<Value>(l).ok())
            .filter(|e| e.get("seq").and_then(|s| s.as_i64()).unwrap_or(0) > s.indexed_seq)
            .collect();
        if !events.is_empty() {
            persist_events(st, &s.id, &events);
        }
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

fn reconcile(st: &AppState, t: &Terminal) {
    match t.label("herdsman.kind") {
        Some("session") => {
            let Some(sid) = t.label("herdsman.session") else { return };
            let db = st.db.lock();
            let Ok(s) = store::session_get(&db, sid) else { return };
            if s.hc_terminal.as_deref() != Some(t.address.as_str()) {
                // terminal cũ của session (trước lần resume): bỏ qua
                if s.hc_terminal.is_some() {
                    return;
                }
                let _ = store::session_set_terminal(&db, sid, Some(&t.address));
            }
            let state = derive_status(t);
            if store::session_set_status(&db, sid, state).unwrap_or(false) {
                let kind = t.status.as_ref().and_then(|s| s.kind.clone());
                st.emit("status:changed", json!({"session_id": sid, "workspace_id": s.workspace_id, "state": state, "kind": kind}));
            }
        }
        Some("task") => {
            st.emit("tasks:changed", json!({"project_id": t.label("herdsman.project")}));
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
                st.terminals.lock().remove(&addr);
                st.emit("agents:changed", json!({"terminal": addr}));
                st.emit("tasks:changed", json!({}));
                continue;
            }
            if ty == "output" || ty == "foreground" || ty == "title" {
                continue;
            }
            if let Ok(t) = hc.get(&addr).await {
                st.terminals.lock().insert(addr.clone(), t.clone());
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
