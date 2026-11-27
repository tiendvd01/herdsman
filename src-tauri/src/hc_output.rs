use crate::error::{AppError, AppResult};
use crate::hc::Terminal;
use crate::state::AppState;
use crate::store;
use serde::Serialize;
use serde_json::Value;
use std::sync::Arc;
use tauri::{Manager, State, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tokio::io::{AsyncBufReadExt, BufReader};

type St<'a> = State<'a, Arc<AppState>>;
const PREFIX: &str = "hc-output-";

fn unavailable() -> AppError {
    AppError::new(
        "hc_output_unavailable",
        "The original terminal output is unavailable.",
    )
}

enum Target {
    Run {
        argv: Vec<String>,
        name: Option<String>,
        background: bool,
    },
    Existing(String),
}

fn parse(command: &str) -> Option<Target> {
    // Only direct invocations have one reliably identifiable terminal.
    let mut quote = None;
    let mut escaped = false;
    for c in command.chars() {
        if escaped {
            escaped = false;
            continue;
        }
        if c == '\\' && quote != Some('\'') {
            escaped = true;
            continue;
        }
        match (quote, c) {
            (None, '\'' | '"') => quote = Some(c),
            (Some(q), c) if q == c => quote = None,
            (
                None,
                ';' | '|' | '&' | '\n' | '<' | '>' | '(' | ')' | '#' | '*' | '?' | '[' | '{' | '~',
            )
            | (None | Some('"'), '$' | '`') => return None,
            _ => {}
        }
    }
    let words = shell_words::split(command).ok()?;
    let mut words = words.into_iter();
    if std::path::Path::new(&words.next()?).file_name()?.to_str()? != "hc" {
        return None;
    }
    match words.next()?.as_str() {
        "run" => {
            let mut name = None;
            let mut background = false;
            while let Some(word) = words.next() {
                match word.as_str() {
                    "--" => {
                        return Some(Target::Run {
                            argv: words.collect(),
                            name,
                            background,
                        })
                    }
                    "--name" => name = Some(words.next()?),
                    "--cwd" | "--label" | "--timeout" => {
                        words.next()?;
                    }
                    "--bg" => background = true,
                    "--json" | "--rm" | "--keep" | "--outlive-parent" | "--no-notify" => {}
                    flag if flag.starts_with("--name=") => name = Some(flag[7..].to_owned()),
                    flag if flag.starts_with("--cwd=")
                        || flag.starts_with("--label=")
                        || flag.starts_with("--timeout=") => {}
                    flag if flag.starts_with('-') => return None,
                    _ => {
                        return Some(Target::Run {
                            argv: std::iter::once(word).chain(words).collect(),
                            name,
                            background,
                        })
                    }
                }
            }
            None
        }
        "read" | "wait" | "attach" => {
            let mut target = None;
            while let Some(word) = words.next() {
                match word.as_str() {
                    "--lines" | "--history" | "--output" | "--timeout" => {
                        words.next()?;
                    }
                    "--" | "--json" => {}
                    flag if flag.starts_with("--lines=")
                        || flag.starts_with("--history=")
                        || flag.starts_with("--output=")
                        || flag.starts_with("--timeout=") => {}
                    flag if flag.starts_with('-') => return None,
                    _ if target.is_none() && local_target(&word) => target = Some(word),
                    _ => return None,
                }
            }
            target.map(Target::Existing)
        }
        _ => None,
    }
}

fn local_target(value: &str) -> bool {
    !value.is_empty()
        && !value.starts_with('-')
        && value
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || c == b'-' || c == b'_')
}

#[derive(Default)]
struct Invocation {
    target: Option<Target>,
    parent: Option<String>,
    start: u64,
    end: Option<u64>,
    denied: bool,
    launched_address: Option<String>,
    running: bool,
}

impl Invocation {
    fn observe(&mut self, event: &Value, tool_id: &str) {
        let same_tool = event["tool_use_id"].as_str() == Some(tool_id);
        match event["type"].as_str() {
            Some("session_started") if self.start == 0 => {
                self.parent = event["hc_terminal"].as_str().map(str::to_owned);
            }
            Some("tool_use") if same_tool && self.start == 0 && event["tool"] == "Bash" => {
                self.target = event["input"]["command"].as_str().and_then(parse);
                self.start = event["ts"].as_u64().unwrap_or_default();
            }
            Some("tool_result") if same_tool => {
                self.end = event["ts"].as_u64();
                // A background launch returns one JSON object before the child prints anything.
                if !matches!(
                    self.target,
                    Some(Target::Run {
                        background: true,
                        ..
                    })
                ) {
                    return;
                }
                self.launched_address = event["content"].as_str().and_then(launch_address);
            }
            Some("shell_update") if same_tool && event["status"] == "running" => {
                self.running = true;
            }
            Some("session_started" | "turn_end") if self.start != 0 && self.end.is_none() => {
                self.end = event["ts"].as_u64();
            }
            _ => {}
        }
    }
}

fn launch_address(text: &str) -> Option<String> {
    let first = text.lines().next()?.trim();
    let address = if let Ok(result) = serde_json::from_str::<Value>(first) {
        (result["state"] == "live").then_some(())?;
        result["address"].as_str()?.to_owned()
    } else {
        first.strip_suffix(" started")?.to_owned()
    };
    local_target(&address).then_some(address)
}

fn match_terminal(inv: &Invocation, term: &Terminal) -> bool {
    let Some(created) = term.created_ms else {
        return false;
    };
    if !local_target(&term.address) || inv.start == 0 || inv.denied {
        return false;
    }
    match &inv.target {
        Some(Target::Run { argv, name, .. }) => {
            let matches_argv = term.argv == *argv
                || (argv.len() == 1 && term.argv == ["sh", "-c", argv[0].as_str()]);
            matches_argv
                && created >= inv.start
                && inv.end.is_none_or(|end| created <= end)
                && term
                    .parent
                    .as_deref()
                    .is_some_and(|p| Some(p) == inv.parent.as_deref())
                && name.as_ref().is_none_or(|n| term.name.as_ref() == Some(n))
        }
        Some(Target::Existing(_)) | None => false,
    }
}

async fn resolve(st: &AppState, session_id: &str, tool_id: &str) -> AppResult<Terminal> {
    let session = store::session_get(&st.db.lock(), session_id)?;
    if session.engine != "claude" {
        return Err(unavailable());
    }
    let file = tokio::fs::File::open(st.session_dir(session_id).join("events.ndjson")).await?;
    let mut lines = BufReader::new(file).lines();
    let mut invocation = Invocation::default();
    let mut permission_id = None;
    while let Some(line) = lines.next_line().await? {
        let Ok(event) = serde_json::from_str::<Value>(&line) else {
            continue;
        };
        invocation.observe(&event, tool_id);
        if event["type"] == "permission_request" && event["tool_use_id"].as_str() == Some(tool_id) {
            permission_id = event["id"].as_str().map(str::to_owned);
            invocation.denied = true;
        } else if event["type"] == "permission_resolved"
            && permission_id.is_some()
            && event["id"].as_str() == permission_id.as_deref()
        {
            invocation.denied = event["decision"] != "allow";
        }
        if invocation.end.is_some() {
            break;
        }
    }
    if invocation.denied {
        return Err(unavailable());
    }
    let hc = st.hc()?;
    let terminal = match &invocation.target {
        Some(Target::Existing(target)) => {
            if !invocation.running && invocation.end.is_none() {
                return Err(unavailable());
            }
            let term = hc.get(target).await?;
            // Resolve a name against the original time and use the canonical address thereafter.
            if term
                .created_ms
                .is_some_and(|created| created <= invocation.start)
                && local_target(&term.address)
            {
                Ok(term)
            } else {
                Err(unavailable())
            }
        }
        Some(Target::Run { background, .. }) => {
            if invocation.parent.is_none() {
                invocation.parent = session.hc_terminal;
            }
            if let Some(address) = &invocation.launched_address {
                let term = hc.get(address).await?;
                match_terminal(&invocation, &term)
                    .then_some(term)
                    .ok_or_else(unavailable)
            } else if *background {
                return Err(unavailable());
            } else {
                let candidates = hc.list(&[], true).await?;
                let mut matches = candidates
                    .into_iter()
                    .filter(|t| match_terminal(&invocation, t));
                let terminal = matches.next().ok_or_else(unavailable)?;
                if matches.next().is_some() {
                    return Err(unavailable());
                }
                Ok(terminal)
            }
        }
        None => Err(unavailable()),
    }?;
    if hc.terminal_environment(&terminal).await?.is_some_and(|owner| owner != st.environment) {
        return Err(unavailable());
    }
    Ok(terminal)
}

fn window_label(term: &Terminal) -> String {
    format!(
        "{PREFIX}{}-{}",
        term.address,
        term.created_ms.unwrap_or_default()
    )
}

#[tauri::command]
pub(crate) async fn hc_output_target(
    st: St<'_>,
    session_id: String,
    tool_id: String,
) -> AppResult<String> {
    resolve(&st, &session_id, &tool_id)
        .await
        .map(|term| window_label(&term))
}

#[tauri::command]
pub(crate) async fn hc_output_open(
    app: tauri::AppHandle,
    st: St<'_>,
    session_id: String,
    tool_id: String,
    target: String,
) -> AppResult<()> {
    let term = resolve(&st, &session_id, &tool_id).await?;
    let label = window_label(&term);
    if label != target {
        return Err(unavailable());
    }
    static WINDOWS: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());
    let _opening = WINDOWS.lock().await;
    if let Some(window) = app.get_webview_window(&label) {
        window
            .unminimize()
            .and_then(|_| window.set_focus())
            .map_err(window_error)?;
        return Ok(());
    }
    let title = term.name.as_deref().unwrap_or(&term.address);
    WebviewWindowBuilder::new(&app, &label, WebviewUrl::App("index.html?hc-output".into()))
        .title(format!("{title} — Terminal Output ({})", st.environment.name()))
        .inner_size(780.0, 460.0)
        .min_inner_size(420.0, 240.0)
        .decorations(true)
        .resizable(true)
        .build()
        .map_err(window_error)?;
    Ok(())
}

fn window_error(error: tauri::Error) -> AppError {
    AppError::new("hc_output_window", error.to_string())
}

#[derive(Serialize)]
pub(crate) struct Output {
    terminal: Terminal,
    text: String,
    complete: bool,
}

#[tauri::command]
pub(crate) async fn hc_output_read(st: St<'_>, window: WebviewWindow) -> AppResult<Output> {
    let (address, created) = window
        .label()
        .strip_prefix(PREFIX)
        .and_then(|label| label.rsplit_once('-'))
        .ok_or_else(unavailable)?;
    let created = created.parse::<u64>().map_err(|_| unavailable())?;
    if !local_target(address) {
        return Err(unavailable());
    }
    let hc = st.hc()?;
    let check = |term: &Terminal| term.address == address && term.created_ms == Some(created);
    let terminal = hc.get(address).await?;
    if !check(&terminal) || hc.terminal_environment(&terminal).await?.is_some_and(|owner| owner != st.environment) {
        return Err(unavailable());
    }
    let (text, complete) = hc.read_output(address, 1500).await?;
    let terminal = hc.get(address).await?;
    if !check(&terminal) {
        return Err(unavailable());
    }
    Ok(Output {
        terminal,
        text,
        complete,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recognizes_single_local_invocations() {
        assert!(matches!(
            parse("hc run --bg --name backend-test -- cargo test"),
            Some(Target::Run { argv, name: Some(name), background: true })
                if argv == ["cargo", "test"] && name == "backend-test"
        ));
        assert!(matches!(
            parse("hc run 'cd backend && cargo test'"),
            Some(Target::Run { argv, .. }) if argv == ["cd backend && cargo test"]
        ));
        assert!(
            matches!(parse("hc read backend-test --lines 100"), Some(Target::Existing(name)) if name == "backend-test")
        );
        for command in [
            "echo 'hc read t3'",
            "hc run cargo test; hc run cargo test",
            "hc run cargo test|cat",
            "hc read $TARGET",
            "hc wait --children any",
            "hc run --on remote cargo test",
            "hc read remote/t7",
        ] {
            assert!(parse(command).is_none(), "{command}");
        }
    }

    #[test]
    fn binds_runs_to_the_parent_and_original_invocation() {
        let mut inv = Invocation::default();
        inv.observe(
            &serde_json::json!({"type":"session_started", "hc_terminal":"t1"}),
            "tool",
        );
        inv.observe(
            &serde_json::json!({
                "type":"tool_use","tool":"Bash","tool_use_id":"tool","ts":10,
                "input":{"command":"hc run --bg --name backend-test -- cargo test"}
            }),
            "tool",
        );
        inv.observe(
            &serde_json::json!({
                "type":"tool_result", "tool_use_id":"tool", "ts":20,
                "content":"{\"state\":\"live\",\"address\":\"t2\"}"
            }),
            "tool",
        );
        assert_eq!(inv.launched_address.as_deref(), Some("t2"));
        assert_eq!(launch_address("t2 started").as_deref(), Some("t2"));
        assert!(launch_address("terminal t2 started").is_none());
        let mut terminal: Terminal = serde_json::from_value(serde_json::json!({
            "address":"t2","argv":["cargo","test"],"state":"finished",
            "parent":"t1","name":"backend-test","created_ms":15
        }))
        .unwrap();
        assert!(match_terminal(&inv, &terminal));
        terminal.created_ms = Some(21);
        assert!(!match_terminal(&inv, &terminal));
        terminal.created_ms = Some(15);
        terminal.parent = Some("t3".into());
        assert!(!match_terminal(&inv, &terminal));
    }

    #[tokio::test]
    async fn resolves_real_background_launch_and_rejects_a_reused_name() {
        use serde_json::json;
        use std::time::{Duration, SystemTime, UNIX_EPOCH};

        let Some(bin) = crate::hc::find_hc() else {
            return;
        };
        let hc = crate::hc::Hc { bin };
        if !hc.server_ok().await {
            return;
        }
        let dir = tempfile::tempdir().unwrap();
        let cwd = dir.path().to_str().unwrap();
        let db = store::open(&dir.path().join("test.db")).unwrap();
        let project = store::project_add(&db, "output-test", cwd).unwrap();
        let workspace = store::workspace_insert(
            &db,
            &store::new_id(),
            &project.id,
            None,
            "project",
            cwd,
            None,
            None,
        )
        .unwrap();
        let session = store::session_insert(&db, &workspace.id, "claude", "ask", None).unwrap();
        let st = AppState::new(
            Box::new(|_, _| {}),
            db,
            dir.path().to_owned(),
            Some(hc.clone()),
            None,
            Default::default(),
        );
        let name = format!("output-{}", &session.id.to_lowercase()[..12]);
        let command = format!("hc run --bg --name {name} --no-notify -- printf hc-output-marker");
        let ms = || {
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64
        };
        let start = ms();
        let parent = hc
            .run(&["sh".into(), "-c".into(), command.clone()], cwd, &[])
            .await
            .unwrap();
        let mut child = None;
        for _ in 0..25 {
            if let Ok(terminal) = hc.get(&name).await {
                if terminal.state != "live" {
                    child = Some(terminal);
                    break;
                }
            }
            tokio::time::sleep(Duration::from_millis(40)).await;
        }
        let child = child.expect("background command ran");
        let session_dir = st.session_dir(&session.id);
        std::fs::create_dir_all(&session_dir).unwrap();
        let log = [
            json!({"type":"session_started", "hc_terminal":parent.address}),
            json!({"type":"tool_use", "tool_use_id":"tool", "tool":"Bash", "ts":start, "input":{"command":command}}),
            json!({"type":"tool_result", "tool_use_id":"tool", "ts":ms(), "content":format!("{} started", child.address)}),
        ];
        let log = log
            .iter()
            .map(Value::to_string)
            .collect::<Vec<_>>()
            .join("\n");
        std::fs::write(session_dir.join("events.ndjson"), log).unwrap();
        let resolved = resolve(&st, &session.id, "tool").await;
        let output = hc.read_output(&child.address, 10).await;
        hc.rm(&child.address).await.unwrap();
        let _ = hc.rm(&parent.address).await;
        let replacement = hc
            .run(&["sh".into(), "-c".into(), command], cwd, &[])
            .await
            .unwrap();
        let mut replacement_child = None;
        for _ in 0..25 {
            if let Ok(terminal) = hc.get(&name).await {
                if terminal.state != "live" {
                    replacement_child = Some(terminal);
                    break;
                }
            }
            tokio::time::sleep(Duration::from_millis(40)).await;
        }
        let after = resolve(&st, &session.id, "tool").await;
        let replacement_child = replacement_child.expect("name was reused");
        assert_ne!(child.address, replacement_child.address);
        hc.rm(&replacement_child.address).await.unwrap();
        if hc
            .get(&replacement.address)
            .await
            .is_ok_and(|t| t.state == "live")
        {
            let _ = hc.kill(&replacement.address).await;
        }
        let _ = hc.rm(&replacement.address).await;
        assert_eq!(resolved.unwrap().address, child.address);
        assert!(output.unwrap().0.contains("hc-output-marker"));
        assert!(after.is_err());
    }
}
