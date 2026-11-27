//! Test tích hợp với hc thật + sidecar thật (engine echo, không gọi model).
//! T018 (contract hc), T065 (tiêu chí BR #3: duyệt quyền Edit), T073 (tiêu chí BR #1: tắt app rồi mở lại).
//! Bỏ qua khi không có hc/node (CI không có hc).
use herdsman_lib::{agent, commands, hc, state::AppState, store};
use herdsman_lib::environment::Environment;
use parking_lot::Mutex;
use serde_json::{json, Value};
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

struct Env {
    st: Arc<AppState>,
    events: Arc<Mutex<Vec<(String, Value)>>>,
    data_dir: PathBuf,
}

fn node() -> Option<PathBuf> {
    std::env::var("HERDSMAN_NODE").ok().map(PathBuf::from).or_else(|| hc::which_in_login_shell("node"))
}

fn make_state(data_dir: &PathBuf, db: rusqlite::Connection) -> Option<Env> {
    let hc_bin = hc::find_hc()?;
    let node = node()?;
    let events: Arc<Mutex<Vec<(String, Value)>>> = Arc::default();
    let ev2 = events.clone();
    let sidecar = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../sidecar/src/index.mjs").canonicalize().ok()?;
    let st = AppState::new(
        Box::new(move |name: &str, payload: Value| ev2.lock().push((name.to_string(), payload))),
        db,
        data_dir.clone(),
        Some(hc::Hc { bin: hc_bin }),
        Some(node),
        sidecar,
    );
    Some(Env { st: Arc::new(st), events, data_dir: data_dir.clone() })
}

fn read_log(data_dir: &PathBuf, sid: &str) -> Vec<Value> {
    std::fs::read_to_string(data_dir.join("sessions").join(sid).join("events.ndjson"))
        .unwrap_or_default()
        .lines()
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect()
}

async fn wait_for(data_dir: &PathBuf, sid: &str, pred: impl Fn(&Value) -> bool, secs: u64) -> Value {
    for _ in 0..secs * 10 {
        if let Some(v) = read_log(data_dir, sid).into_iter().find(|e| pred(e)) {
            return v;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    panic!("không thấy event mong đợi trong {secs}s");
}

#[tokio::test]
async fn concurrent_profiles_keep_pending_permissions_separate_across_dev_restart() {
    let temp = tempfile::Builder::new().prefix("hpf-").tempdir_in("/tmp").unwrap();
    let profile = |name: &str| temp.path().join(name);
    let start = |name, environment| {
        let dir = profile(name);
        let mut env = make_state(&dir, store::open(&dir.join("herdsman.db")).unwrap())?;
        Arc::get_mut(&mut env.st).unwrap().environment = environment;
        Some(env)
    };
    let Some(prod) = start("prod", Environment::Production) else { return };
    let Some(dev) = start("dev", Environment::Development) else { return };
    let new_session = |st: &AppState| {
        let db = st.db.lock();
        let project = store::project_add(&db, "shared", temp.path().to_str().unwrap()).unwrap();
        let ws = store::workspace_insert(&db, &store::new_id(), &project.id, None, "project", &project.path, None, None).unwrap();
        let session = store::session_insert(&db, &ws.id, "echo", "ask", Some("Test session")).unwrap();
        (ws, session)
    };
    let (prod_ws, prod_session) = new_session(&prod.st);
    let (dev_ws, dev_session) = new_session(&dev.st);
    let prod_terminal = agent::spawn_sidecar(&prod.st, &prod_session, &prod_ws).await.unwrap();
    let dev_terminal = agent::spawn_sidecar(&dev.st, &dev_session, &dev_ws).await.unwrap();
    let hc = prod.st.hc().unwrap();
    assert_eq!(hc.get(&prod_terminal.address).await.unwrap().label("herdsman.app"), Some("1"));
    assert_eq!(hc.get(&dev_terminal.address).await.unwrap().label("herdsman.app"), Some("development"));
    let prompt = json!({"cmd": "prompt", "text": "edit README"});
    agent::command(&prod.st, &prod_session.id, prompt.clone()).await.unwrap();
    agent::command(&dev.st, &dev_session.id, prompt).await.unwrap();
    let production_request = wait_for(&prod.data_dir, &prod_session.id, |e| e["type"] == "permission_request", 10).await;
    let development_request = wait_for(&dev.data_dir, &dev_session.id, |e| e["type"] == "permission_request", 10).await;

    drop(dev);
    let dev = start("dev", Environment::Development).unwrap();
    let hc = dev.st.hc().unwrap();
    let response = |request: &Value| json!({"cmd": "permission_response", "id": request["id"], "decision": "allow"});
    assert!(agent::command(&dev.st, &prod_session.id, response(&production_request)).await.is_err());
    agent::command(&dev.st, &dev_session.id, response(&development_request)).await.unwrap();
    wait_for(&dev.data_dir, &dev_session.id, |e| e["type"] == "turn_end", 10).await;
    assert!(hc.get(&prod_terminal.address).await.unwrap().status.is_some_and(|status| status.state == "blocked"));
    assert!(!read_log(&prod.data_dir, &prod_session.id).iter().any(|event| event["type"] == "permission_resolved"));
    agent::command(&prod.st, &prod_session.id, response(&production_request)).await.unwrap();
    wait_for(&prod.data_dir, &prod_session.id, |e| e["type"] == "turn_end", 10).await;
    for terminal in [dev_terminal, prod_terminal] {
        hc.kill(&terminal.address).await.unwrap();
        hc.rm(&terminal.address).await.unwrap();
    }
}

#[tokio::test]
async fn session_survives_app_restart_and_permission_flow() {
    let tmp = tempfile::Builder::new().prefix("hsf-").tempdir_in("/tmp").unwrap();
    let data_dir = tmp.path().to_path_buf();
    let db_path = data_dir.join("herdsman.db");
    let Some(env) = make_state(&data_dir, store::open(&db_path).unwrap()) else {
        eprintln!("bỏ qua: không có hc hoặc node");
        return;
    };
    let st = env.st.clone();
    let work = tempfile::tempdir().unwrap();

    // Project → workspace → session (engine echo)
    let (s, ws) = {
        let db = st.db.lock();
        let p = store::project_add(&db, "demo", work.path().to_str().unwrap()).unwrap();
        let ws = store::workspace_insert(&db, &store::new_id(), &p.id, None, "project", &p.path, None, None).unwrap();
        let s = store::session_insert(&db, &ws.id, "echo", "ask", None).unwrap();
        (s, ws)
    };
    let term = agent::spawn_sidecar(&st, &s, &ws).await.expect("chạy sidecar qua hc");
    let hcc = st.hc().unwrap().clone();

    // T018: terminal có đủ label, lọc theo herdsman.app=1 thấy nó
    let listed = hcc.list(&[("herdsman.app", "1"), ("herdsman.session", &s.id)], false).await.unwrap();
    assert_eq!(listed.len(), 1);
    assert_eq!(listed[0].label("herdsman.workspace"), Some(ws.id.as_str()));
    assert_eq!(listed[0].label("herdsman.kind"), Some("session"));

    // T065: agent xin quyền Edit → có diff → Allow → chạy tiếp
    agent::command(&st, &s.id, json!({
        "cmd": "prompt",
        "text": "hãy edit README",
        "images": [{"media_type": "image/png", "data_b64": "AQID"}],
    })).await.unwrap();
    let req = wait_for(&data_dir, &s.id, |e| e["type"] == "permission_request", 10).await;
    assert_eq!(req["tool"], "Edit");
    assert!(req["input"]["old_string"].is_string(), "có dữ liệu để dựng diff");
    // hc thấy trạng thái blocked/permission qua OSC 7501
    let mut blocked = false;
    for _ in 0..30 {
        let t = hcc.get(&term.address).await.unwrap();
        if t.status.as_ref().map(|x| x.state.as_str()) == Some("blocked") {
            blocked = true;
            assert_eq!(t.status.unwrap().kind.as_deref(), Some("permission"));
            break;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    assert!(blocked, "hc phải thấy blocked");

    let named = store::session_insert(&st.db.lock(), &ws.id, &s.engine, "ask", Some("Sửa bộ lọc")).unwrap();
    let named_term = agent::spawn_sidecar(&st, &named, &ws).await.unwrap();
    wait_for(&data_dir, &named.id, |e| e["type"] == "session_started", 10).await;
    assert!(!read_log(&data_dir, &named.id).iter().any(|e| e["type"] == "user_message"));

    // T073: "tắt app" — bỏ toàn bộ state backend; sidecar trong hc vẫn sống, request vẫn chờ.
    let last_seq_before = read_log(&data_dir, &s.id).last().unwrap()["seq"].as_i64().unwrap();
    drop(st);
    drop(env);
    tokio::time::sleep(Duration::from_secs(2)).await;
    let t = hcc.get(&term.address).await.unwrap();
    assert_eq!(t.state, "live", "agent phải sống khi app tắt");

    // "mở lại app": state mới từ cùng DB; khôi phục view phát lại đủ event, request còn treo
    let env2 = make_state(&data_dir, store::open(&db_path).unwrap()).unwrap();
    let st2 = env2.st.clone();
    let sessions = store::session_list(&st2.db.lock(), &ws.id).unwrap();
    assert!(sessions.iter().any(|row| row.id == named.id && row.title.as_deref() == Some("Sửa bộ lọc")));
    assert!(sessions.iter().any(|row| row.id == s.id));
    assert_eq!(hcc.get(&named_term.address).await.unwrap().state, "live");
    agent::open_view(st2.clone(), s.id.clone());
    let mut got: Vec<Value> = vec![];
    for _ in 0..50 {
        got = env2
            .events
            .lock()
            .iter()
            .filter(|(n, p)| n == "session:events" && p["session_id"] == s.id.as_str())
            .flat_map(|(_, p)| p["events"].as_array().cloned().unwrap_or_default())
            .collect();
        if got.iter().filter_map(|e| e["seq"].as_i64()).max().unwrap_or(0) >= last_seq_before {
            break;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    let seqs: Vec<i64> = got.iter().filter_map(|e| e["seq"].as_i64()).collect();
    assert_eq!(seqs.first(), Some(&1));
    assert!(seqs.windows(2).all(|w| w[1] == w[0] + 1), "không mất event: {seqs:?}");
    assert!(got.iter().any(|e| e["type"] == "permission_request"));
    let image_id = got.iter().find(|e| e["type"] == "user_message").unwrap()
        ["images"][0]["attachment_id"].as_str().unwrap();
    assert_eq!(commands::read_session_image(&st2, &s.id, image_id).await.unwrap(), "AQID");
    assert_eq!(commands::read_session_image(&st2, &named.id, image_id).await.unwrap_err().code, "image_unavailable");
    assert_eq!(commands::read_session_image(&st2, &s.id, "../events.ndjson").await.unwrap_err().code, "invalid_attachment");

    assert!(!got.iter().any(|e| e["type"] == "permission_resolved"), "request không tự hết hạn");

    agent::command(&st2, &s.id, json!({"cmd": "permission_response", "id": req["id"], "decision": "allow"})).await.unwrap();
    let res = wait_for(&data_dir, &s.id, |e| e["type"] == "tool_result", 10).await;
    assert_eq!(res["is_error"], false);
    let turn = wait_for(&data_dir, &s.id, |e| e["type"] == "turn_end", 10).await;

    // A completed turn reaches the UI while the terminal is still live.
    let watcher = tokio::spawn(agent::watch_hc(st2.clone()));
    tokio::time::timeout(Duration::from_secs(5), async {
        loop {
            if env2.events.lock().iter().any(|(name, event)| {
                name == "status:changed"
                    && event["session_id"] == s.id.as_str()
                    && event["state"] == "idle"
                    && event["kind"] == "turn_complete"
                    && event["completion"]["seq"] == turn["seq"]
                    && event["completion"]["ts"] == turn["ts"]
            }) {
                break;
            }
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }).await.expect("completed turn should reach the app through hc");
    watcher.abort();
    assert_eq!(hcc.get(&term.address).await.unwrap().state, "live");

    // Chỉ mục tìm kiếm được cập nhật từ luồng view
    tokio::time::sleep(Duration::from_millis(300)).await;
    assert!(!store::search(&st2.db.lock(), "README", None, 10).unwrap().is_empty(), "tìm được nội dung hội thoại");

    // T018: kill → finished; rm → biến mất
    agent::close_view(&st2, &s.id);
    hcc.kill(&term.address).await.unwrap();
    for _ in 0..30 {
        if hcc.get(&term.address).await.map(|t| t.state != "live").unwrap_or(true) {
            break;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    hcc.rm(&term.address).await.unwrap();
    assert!(hcc.list(&[("herdsman.session", &s.id)], true).await.unwrap().is_empty());
    store::session_set_status(&st2.db.lock(), &s.id, "done").unwrap();
    env2.events.lock().clear();
    agent::open_view(st2.clone(), s.id.clone());
    for _ in 0..30 {
        if env2.events.lock().iter().any(|(_, p)| p["error"]["code"] == "sidecar_unreachable") {
            break;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    let offline = env2.events.lock().iter()
        .filter(|(name, p)| name == "session:events" && p["session_id"] == s.id.as_str())
        .flat_map(|(_, p)| p["events"].as_array().cloned().unwrap_or_default())
        .collect::<Vec<_>>();
    assert!(offline.iter().any(|e| e["images"][0]["attachment_id"] == image_id));
    assert!(!offline.iter().any(|e| e["type"] == "permission_request"));

    hcc.kill(&named_term.address).await.unwrap();
    for _ in 0..30 {
        if hcc.get(&named_term.address).await.map(|t| t.state != "live").unwrap_or(true) {
            break;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    hcc.rm(&named_term.address).await.unwrap();
    drop(env2);
    let _ = std::fs::remove_dir_all(&env_dir(&data_dir));
}

fn env_dir(p: &PathBuf) -> PathBuf {
    p.join("sock")
}

/// T100: `hc send` vào terminal sidecar → user_message nguồn hc_send. T096: agent con có parent = terminal session.
#[tokio::test]
async fn hc_send_and_agent_tree() {
    let tmp = tempfile::Builder::new().prefix("hsg-").tempdir_in("/tmp").unwrap();
    let data_dir = tmp.path().to_path_buf();
    let Some(env) = make_state(&data_dir, store::open_memory().unwrap()) else {
        eprintln!("bỏ qua: không có hc hoặc node");
        return;
    };
    let st = env.st.clone();
    let work = tempfile::tempdir().unwrap();
    let (s, ws) = {
        let db = st.db.lock();
        let p = store::project_add(&db, "demo", work.path().to_str().unwrap()).unwrap();
        let ws = store::workspace_insert(&db, &store::new_id(), &p.id, None, "project", &p.path, None, None).unwrap();
        let s = store::session_insert(&db, &ws.id, "echo", "ask", None).unwrap();
        (s, ws)
    };
    let term = agent::spawn_sidecar(&st, &s, &ws).await.unwrap();
    wait_for(&data_dir, &s.id, |e| e["type"] == "session_started", 10).await;
    let hc_bin = st.hc().unwrap().bin.clone();

    let out = std::process::Command::new(&hc_bin).args(["send", &term.address, "liet ke file\nva dong thu hai"]).output().unwrap();
    assert!(out.status.success(), "{}", String::from_utf8_lossy(&out.stdout));
    let msg = wait_for(&data_dir, &s.id, |e| e["type"] == "user_message", 10).await;
    assert_eq!(msg["source"], "hc_send");
    assert!(msg["text"].as_str().unwrap().contains("liet ke file"));

    // agent con chạy dưới terminal của session
    let child = std::process::Command::new(&hc_bin)
        .args(["run", "--bg", "--json", "--parent", &term.address, "--", "/bin/sleep", "20"])
        .output()
        .unwrap();
    let child_addr = serde_json::from_slice::<Value>(&child.stdout).unwrap()["address"].as_str().unwrap().to_string();
    let all = st.hc().unwrap().list(&[], true).await.unwrap();
    let tree = herdsman_lib::commands::build_tree(&term.address, &all, 0).expect("có cây");
    assert!(tree.children.iter().any(|c| c.terminal == child_addr), "agent con nằm dưới session");

    let hcc = st.hc().unwrap().clone();
    for t in [&child_addr, &term.address] {
        let _ = hcc.kill(t).await;
    }
    tokio::time::sleep(Duration::from_millis(500)).await;
    for t in [&child_addr, &term.address] {
        let _ = hcc.rm(t).await;
    }
}

/// specs/005 T021 + constitution I: agent đổi model rồi app "tắt" trước khi kịp ghi DB →
/// mở lại, phát lại log thì `sessions.model` khớp model agent đang dùng.
#[tokio::test]
async fn model_change_survives_app_restart() {
    let tmp = tempfile::Builder::new().prefix("hsm-").tempdir_in("/tmp").unwrap();
    let data_dir = tmp.path().to_path_buf();
    let db_path = data_dir.join("herdsman.db");
    let Some(env) = make_state(&data_dir, store::open(&db_path).unwrap()) else {
        eprintln!("bỏ qua: không có hc hoặc node");
        return;
    };
    let st = env.st.clone();
    let work = tempfile::tempdir().unwrap();
    let (s, ws) = {
        let db = st.db.lock();
        let p = store::project_add(&db, "demo", work.path().to_str().unwrap()).unwrap();
        let ws = store::workspace_insert(&db, &store::new_id(), &p.id, None, "project", &p.path, None, None).unwrap();
        let s = store::session_insert(&db, &ws.id, "echo", "ask", None).unwrap();
        (s, ws)
    };
    let term = agent::spawn_sidecar(&st, &s, &ws).await.unwrap();
    wait_for(&data_dir, &s.id, |e| e["type"] == "session_started", 10).await;

    let list = agent::command(&st, &s.id, json!({"cmd": "list_models"})).await.unwrap();
    assert!(list["models"].as_array().unwrap().len() >= 2);
    // Gửi thẳng tới agent (không qua session_set_model) = app tắt ngay sau ack, DB chưa ghi.
    agent::command(&st, &s.id, json!({"cmd": "set_model", "model": "echo-fast"})).await.unwrap();
    wait_for(&data_dir, &s.id, |e| e["type"] == "model_changed", 10).await;
    drop(st);
    drop(env);

    let env2 = make_state(&data_dir, store::open(&db_path).unwrap()).unwrap();
    let st2 = env2.st.clone();
    agent::open_view(st2.clone(), s.id.clone());
    let mut model = None;
    for _ in 0..50 {
        model = store::session_get(&st2.db.lock(), &s.id).unwrap().model;
        if model.as_deref() == Some("echo-fast") {
            break;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    assert_eq!(model.as_deref(), Some("echo-fast"), "phát lại log phải cập nhật sessions.model");

    agent::close_view(&st2, &s.id);
    let hcc = st2.hc().unwrap().clone();
    let _ = hcc.kill(&term.address).await;
    tokio::time::sleep(Duration::from_millis(500)).await;
    let _ = hcc.rm(&term.address).await;
}

/// Đóng tab phải tắt hẳn terminal hc (không để sidecar idle sống mãi) và dọn session chưa chat.
#[tokio::test]
async fn close_session_kills_idle_terminal() {
    let tmp = tempfile::Builder::new().prefix("hsc-").tempdir_in("/tmp").unwrap();
    let data_dir = tmp.path().to_path_buf();
    let Some(env) = make_state(&data_dir, store::open(&data_dir.join("herdsman.db")).unwrap()) else {
        eprintln!("bỏ qua: không có hc hoặc node");
        return;
    };
    let st = env.st.clone();
    let work = tempfile::tempdir().unwrap();
    let (s, ws) = {
        let db = st.db.lock();
        let p = store::project_add(&db, "demo", work.path().to_str().unwrap()).unwrap();
        let ws = store::workspace_insert(&db, &store::new_id(), &p.id, None, "project", &p.path, None, None).unwrap();
        let s = store::session_insert(&db, &ws.id, "echo", "ask", None).unwrap();
        (s, ws)
    };
    let term = agent::spawn_sidecar(&st, &s, &ws).await.expect("chạy sidecar qua hc");
    let hcc = st.hc().unwrap().clone();
    assert_eq!(hcc.get(&term.address).await.unwrap().state, "live");

    herdsman_lib::commands::close_session(&st, &s.id).await.unwrap();

    let mut gone = false;
    for _ in 0..30 {
        if hcc.list(&[("herdsman.session", &s.id)], true).await.unwrap().iter().all(|t| t.state != "live") {
            gone = true;
            break;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    assert!(gone, "terminal hc phải bị tắt sau khi đóng session");
    assert!(hcc.list(&[("herdsman.session", &s.id)], true).await.unwrap().is_empty(), "session chưa chat bị rm hẳn");
    assert!(store::session_get(&st.db.lock(), &s.id).is_err(), "session chưa chat bị xoá khỏi DB");
}
