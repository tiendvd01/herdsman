use crate::environment::Environment;
use crate::error::{AppError, AppResult};
use crate::hc::{Hc, Terminal};
use crate::state::AppState;
use crate::store::{self, Workspace};
use parking_lot::Mutex;
use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Arc;
use tauri::ipc::{Channel, InvokeResponseBody};
use tauri::{AppHandle, Manager, State, WebviewWindow};

pub(crate) static LIFECYCLE: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());

const FLOATING_KIND: (&str, &str) = ("herdsman.kind", "floating-terminal");

type St<'a> = State<'a, Arc<AppState>>;

struct Viewer {
    master: Box<dyn MasterPty + Send>,
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
    child: Box<dyn Child + Send + Sync>,
}

impl Drop for Viewer {
    fn drop(&mut self) {
        if !matches!(self.child.try_wait(), Ok(Some(_))) {
            let _ = self.child.kill();
            let _ = self.child.wait();
        }
    }
}

#[derive(Clone, Default)]
pub(crate) struct Viewers(Arc<Mutex<HashMap<(String, String), Viewer>>>);

fn workspace(st: &AppState, id: &str) -> AppResult<Workspace> {
    let ws = store::workspace_get(&st.db.lock(), id)?;
    if ws.archived_at.is_some() {
        return Err(AppError::new(
            "workspace_archived",
            "This workspace is archived",
        ));
    }
    Ok(ws)
}

async fn list(hc: &Hc, environment: Environment, ws: &Workspace) -> AppResult<Vec<Terminal>> {
    let mut terminals = hc
        .list(
            &[
                environment.hc_label(),
                ("herdsman.kind", "terminal"),
                ("herdsman.project", &ws.project_id),
                ("herdsman.workspace", &ws.id),
            ],
            true,
        )
        .await?;
    terminals.sort_by_key(|t| t.created_ms);
    Ok(terminals)
}

fn belongs_to(terminal: &Terminal, environment: Environment, ws: &Workspace) -> bool {
    environment.owns(terminal)
        && terminal.label("herdsman.kind") == Some("terminal")
        && terminal.label("herdsman.project") == Some(ws.project_id.as_str())
        && terminal.label("herdsman.workspace") == Some(ws.id.as_str())
}

async fn owned_terminal(hc: &Hc, environment: Environment, ws: &Workspace, address: &str) -> AppResult<Terminal> {
    let terminal = hc.get(address).await?;
    if !belongs_to(&terminal, environment, ws) {
        return Err(AppError::new(
            "terminal_not_found",
            "Workspace terminal not found",
        ));
    }
    Ok(terminal)
}

async fn create(hc: &Hc, environment: Environment, ws: &Workspace) -> AppResult<Terminal> {
    let (app_label, app_value) = environment.hc_label();
    hc.run(
        &[],
        &ws.work_dir,
        &[
            (app_label, app_value.into()),
            ("herdsman.kind", "terminal".into()),
            ("herdsman.project", ws.project_id.clone()),
            ("herdsman.workspace", ws.id.clone()),
        ],
    )
    .await
}

async fn stop(hc: &Hc, terminal: Terminal) -> AppResult<()> {
    if terminal.state == "live" {
        if let Err(error) = hc.kill(&terminal.address).await {
            if hc.get(&terminal.address).await?.state == "live" {
                return Err(error);
            }
        }
    }
    hc.rm(&terminal.address).await
}

pub(crate) async fn stop_for_workspace(st: &AppState, ws: &Workspace) -> AppResult<()> {
    if let Some(hc) = &st.hc {
        for terminal in list(hc, st.environment, ws).await? {
            stop(hc, terminal).await?;
        }
    }
    Ok(())
}

#[tauri::command]
pub(crate) async fn workspace_terminal_create(
    st: St<'_>,
    workspace_id: String,
) -> AppResult<Terminal> {
    let _lifecycle = LIFECYCLE.lock().await;
    let ws = workspace(&st, &workspace_id)?;
    create(st.hc()?, st.environment, &ws).await
}

#[tauri::command]
pub(crate) async fn workspace_terminal_list(
    st: St<'_>,
    workspace_id: String,
) -> AppResult<Vec<Terminal>> {
    let ws = workspace(&st, &workspace_id)?;
    list(st.hc()?, st.environment, &ws).await
}

#[tauri::command]
pub(crate) async fn workspace_terminal_stop(
    st: St<'_>,
    workspace_id: String,
    address: String,
) -> AppResult<()> {
    let ws = workspace(&st, &workspace_id)?;
    let hc = st.hc()?;
    stop(hc, owned_terminal(hc, st.environment, &ws, &address).await?).await
}

fn size(rows: u16, cols: u16) -> PtySize {
    PtySize {
        rows: rows.max(1),
        cols: cols.max(1),
        pixel_width: 0,
        pixel_height: 0,
    }
}

fn pty_error(error: impl std::fmt::Display) -> AppError {
    AppError::new("terminal_view", error.to_string())
}

fn attach(
    hc: &Hc,
    address: &str,
    dimensions: PtySize,
) -> AppResult<(Viewer, Box<dyn Read + Send>)> {
    let pair = native_pty_system().openpty(dimensions).map_err(pty_error)?;
    let reader = pair.master.try_clone_reader().map_err(pty_error)?;
    let writer = pair.master.take_writer().map_err(pty_error)?;
    let mut cmd = CommandBuilder::new(&hc.bin);
    cmd.args(["attach", "--history", "1000", "--", address]);
    cmd.env("TERM", "xterm-256color");
    let child = pair.slave.spawn_command(cmd).map_err(pty_error)?;
    Ok((
        Viewer {
            master: pair.master,
            writer: Arc::new(Mutex::new(writer)),
            child,
        },
        reader,
    ))
}

fn start_view(
    hc: &Hc,
    viewers: &Viewers,
    window: &WebviewWindow,
    terminal: Terminal,
    id: String,
    dimensions: PtySize,
    output: Channel<InvokeResponseBody>,
) -> AppResult<()> {
    if terminal.state != "live" {
        return Err(AppError::new("terminal_ended", "The terminal has ended."));
    }

    let key = (window.label().to_owned(), id);
    let mut entries = viewers.0.lock();
    if window.get_webview_window(window.label()).is_none() {
        return Err(AppError::new(
            "terminal_view",
            "The terminal window has closed.",
        ));
    }
    if entries.contains_key(&key) {
        return Err(AppError::new(
            "terminal_view",
            "The terminal view already exists",
        ));
    }
    let (viewer, mut reader) = attach(hc, &terminal.address, dimensions)?;
    entries.insert(key.clone(), viewer);
    drop(entries);

    let viewers = viewers.clone();
    std::thread::spawn(move || {
        let mut buffer = [0; 8192];
        while let Ok(count) = reader.read(&mut buffer) {
            if count == 0
                || output
                    .send(InvokeResponseBody::Raw(buffer[..count].to_vec()))
                    .is_err()
            {
                break;
            }
        }
        let viewer = viewers.0.lock().remove(&key);
        drop(viewer);
        let _ = output.send(InvokeResponseBody::Raw(Vec::new()));
    });
    Ok(())
}

#[tauri::command]
pub(crate) async fn workspace_terminal_attach(
    st: St<'_>,
    viewers: State<'_, Viewers>,
    window: WebviewWindow,
    workspace_id: String,
    address: String,
    id: String,
    rows: u16,
    cols: u16,
    output: Channel<InvokeResponseBody>,
) -> AppResult<()> {
    if window.label() != "main" {
        return Err(AppError::new("terminal_view", "Expected the main window."));
    }
    let ws = workspace(&st, &workspace_id)?;
    let hc = st.hc()?;
    let terminal = owned_terminal(hc, st.environment, &ws, &address).await?;
    start_view(
        hc,
        &viewers,
        &window,
        terminal,
        id,
        size(rows, cols),
        output,
    )
}

async fn floating_list(hc: &Hc, environment: Environment) -> AppResult<Vec<Terminal>> {
    let mut terminals = hc.list(&[environment.hc_label(), FLOATING_KIND], false).await?;
    terminals.sort_by(|a, b| {
        a.created_ms
            .cmp(&b.created_ms)
            .then(a.address.cmp(&b.address))
    });
    Ok(terminals)
}

async fn create_floating(hc: &Hc, environment: Environment, cwd: &str) -> AppResult<Terminal> {
    hc.run(
        &[],
        cwd,
        &[environment.hc_label(), FLOATING_KIND].map(|(key, value)| (key, value.into())),
    )
    .await
}

#[tauri::command]
pub(crate) async fn floating_terminal_list(st: St<'_>) -> AppResult<Vec<Terminal>> {
    floating_list(st.hc()?, st.environment).await
}

fn floating_directory(
    st: &AppState,
    workspace_id: Option<&str>,
    project_id: Option<&str>,
    home: impl FnOnce() -> AppResult<String>,
) -> AppResult<String> {
    if let Some(id) = workspace_id {
        return Ok(workspace(st, id)?.work_dir);
    }
    if let Some(id) = project_id {
        return Ok(store::project_get(&st.db.lock(), id)?.path);
    }
    home()
}

#[tauri::command]
pub(crate) async fn floating_terminal_create(
    window: WebviewWindow,
    app: AppHandle,
    st: St<'_>,
    workspace_id: Option<String>,
    project_id: Option<String>,
) -> AppResult<Terminal> {
    if window.label() != "main" {
        return Err(AppError::new("terminal_view", "Expected the main window."));
    }
    let hc = st.hc()?;
    if !hc.server_ok().await {
        return Err(AppError::new(
            "hc_disconnected",
            "hc is not connected. Try again when it reconnects.",
        ));
    }
    let cwd = floating_directory(&st, workspace_id.as_deref(), project_id.as_deref(), || {
        Ok(app
            .path()
            .home_dir()
            .map_err(pty_error)?
            .to_string_lossy()
            .into_owned())
    })?;
    create_floating(hc, st.environment, &cwd).await
}

async fn owned_floating_terminal(hc: &Hc, environment: Environment, address: &str) -> AppResult<Terminal> {
    let terminal = hc.get(address).await?;
    if !environment.owns(&terminal) || terminal.label(FLOATING_KIND.0) != Some(FLOATING_KIND.1)
    {
        return Err(AppError::new(
            "terminal_not_found",
            "Floating terminal not found.",
        ));
    }
    Ok(terminal)
}

#[tauri::command]
pub(crate) async fn floating_terminal_stop(
    st: St<'_>,
    window: WebviewWindow,
    address: String,
) -> AppResult<()> {
    if window.label() != "main" {
        return Err(AppError::new("terminal_view", "Expected the main window."));
    }
    let hc = st.hc()?;
    stop(hc, owned_floating_terminal(hc, st.environment, &address).await?).await
}

#[tauri::command]
pub(crate) async fn floating_terminal_attach(
    st: St<'_>,
    viewers: State<'_, Viewers>,
    window: WebviewWindow,
    address: String,
    id: String,
    rows: u16,
    cols: u16,
    output: Channel<InvokeResponseBody>,
) -> AppResult<()> {
    if window.label() != "main" {
        return Err(AppError::new("terminal_view", "Expected the main window."));
    }
    let hc = st.hc()?;
    let terminal = owned_floating_terminal(hc, st.environment, &address).await?;
    start_view(
        hc,
        &viewers,
        &window,
        terminal,
        id,
        size(rows, cols),
        output,
    )
}

#[tauri::command]
pub(crate) async fn workspace_terminal_input(
    viewers: State<'_, Viewers>,
    window: WebviewWindow,
    id: String,
    data: Vec<u8>,
) -> AppResult<()> {
    let writer = viewers
        .0
        .lock()
        .get(&(window.label().to_owned(), id))
        .map(|viewer| viewer.writer.clone());
    if let Some(writer) = writer {
        tokio::task::spawn_blocking(move || writer.lock().write_all(&data))
            .await
            .map_err(pty_error)??;
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn workspace_terminal_resize(
    viewers: State<'_, Viewers>,
    window: WebviewWindow,
    id: String,
    rows: u16,
    cols: u16,
) -> AppResult<()> {
    if let Some(viewer) = viewers.0.lock().get(&(window.label().to_owned(), id)) {
        viewer.master.resize(size(rows, cols)).map_err(pty_error)?;
    }
    Ok(())
}

#[tauri::command]
pub(crate) async fn workspace_terminal_detach(
    viewers: State<'_, Viewers>,
    window: WebviewWindow,
    id: String,
) -> AppResult<()> {
    let viewer = viewers.0.lock().remove(&(window.label().to_owned(), id));
    drop(viewer);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::os::unix::fs::PermissionsExt;
    use std::path::Path;
    use std::sync::mpsc;
    use std::time::{Duration, Instant};

    struct TestCore(Hc);

    impl Drop for TestCore {
        fn drop(&mut self) {
            let _ = std::process::Command::new(&self.0.bin)
                .args(["server", "stop"])
                .output();
        }
    }

    fn wait_for_output(reader: Box<dyn Read + Send>) -> mpsc::Receiver<String> {
        let (sender, receiver) = mpsc::channel();
        std::thread::spawn(move || {
            let mut reader = reader;
            let mut buf = [0; 2048];
            while let Ok(n) = reader.read(&mut buf) {
                if n == 0
                    || sender
                        .send(String::from_utf8_lossy(&buf[..n]).into_owned())
                        .is_err()
                {
                    break;
                }
            }
        });
        receiver
    }

    fn expect_output(receiver: &mpsc::Receiver<String>, needle: &str) {
        let deadline = Instant::now() + Duration::from_secs(8);
        let mut output = String::new();
        while let Ok(chunk) =
            receiver.recv_timeout(deadline.saturating_duration_since(Instant::now()))
        {
            output.push_str(&chunk);
            if output.contains(needle) {
                return;
            }
        }
        panic!("Expected terminal output {needle:?}, received {output:?}");
    }

    fn shell_quote(path: &Path) -> String {
        format!("'{}'", path.to_string_lossy().replace('\'', "'\\''"))
    }

    #[tokio::test]
    async fn shell_contract_create_attach_resize_detach_reattach_and_stop() {
        let Some(hc) = crate::hc::find_hc() else {
            eprintln!("skipping workspace terminal contract because hc is unavailable");
            return;
        };
        let scratch = tempfile::Builder::new()
            .prefix("hwt-")
            .tempdir_in("/tmp")
            .unwrap();
        let wrapper = scratch.path().join("hc");
        std::fs::write(&wrapper, format!(
            "#!/bin/sh\nexport HC_SESSION={} XDG_CONFIG_HOME={} XDG_STATE_HOME={} XDG_RUNTIME_DIR={}\nunset HC_SOCKET\nexec {} \"$@\"\n",
            ulid::Ulid::new().to_string().to_lowercase(),
            shell_quote(scratch.path()),
            shell_quote(scratch.path()),
            shell_quote(scratch.path()),
            shell_quote(&hc),
        )).unwrap();
        std::fs::set_permissions(&wrapper, std::fs::Permissions::from_mode(0o700)).unwrap();
        let core = TestCore(Hc { bin: wrapper });
        let hc = &core.0;
        let db = store::open(&scratch.path().join("test.db")).unwrap();
        let project = store::project_add(&db, "test", scratch.path().to_str().unwrap()).unwrap();
        let project_ws = store::workspace_insert(
            &db,
            "project-ws",
            &project.id,
            None,
            "project",
            &project.path,
            None,
            None,
        )
        .unwrap();
        let worktree = scratch.path().join("worktree");
        std::fs::create_dir(&worktree).unwrap();
        let ws = store::workspace_insert(
            &db,
            "worktree-ws",
            &project.id,
            None,
            "worktree",
            worktree.to_str().unwrap(),
            None,
            None,
        )
        .unwrap();

        let production = Environment::Production;
        let project_terminal = create(hc, production, &project_ws).await.unwrap();
        assert_eq!(project_terminal.cwd, project_ws.work_dir);
        let first = create(hc, production, &ws).await.unwrap();
        let second = create(hc, production, &ws).await.unwrap();
        assert_eq!(first.cwd, ws.work_dir);
        assert_eq!(list(hc, production, &ws).await.unwrap().len(), 2);
        assert!(owned_terminal(hc, production, &project_ws, &first.address)
            .await
            .is_err());

        let (viewer, reader) = attach(hc, &first.address, size(24, 80)).unwrap();
        let output = wait_for_output(reader);
        // Give the interactive hc client time to enter raw mode before sending shell input.
        expect_output(&output, "\x1b[");
        tokio::time::sleep(Duration::from_millis(250)).await;
        viewer
            .writer
            .lock()
            .write_all(b"printf 'ready_%s\\n' \"$(pwd -P)\"; sleep 60\r")
            .unwrap();
        let dir = worktree.canonicalize().unwrap();
        expect_output(&output, &format!("ready_{}", dir.display()));
        viewer.master.resize(size(32, 96)).unwrap();
        tokio::time::timeout(Duration::from_secs(5), async {
            loop {
                let result = tokio::process::Command::new(&hc.bin)
                    .args(["get", "--json", &first.address])
                    .output()
                    .await
                    .unwrap();
                let terminal: serde_json::Value = serde_json::from_slice(&result.stdout).unwrap();
                if terminal["rows"] == 32 && terminal["cols"] == 96 {
                    break;
                }
                tokio::time::sleep(Duration::from_millis(50)).await;
            }
        })
        .await
        .expect("hc should receive the new terminal dimensions");
        viewer.writer.lock().write_all(b"\x03").unwrap();
        tokio::time::sleep(Duration::from_millis(250)).await;
        viewer
            .writer
            .lock()
            .write_all(b"printf 'resized_%s\\n' \"$(stty size)\"\r")
            .unwrap();
        expect_output(&output, "resized_32 96");

        drop(viewer);
        drop(output);
        assert_eq!(hc.get(&first.address).await.unwrap().state, "live");
        let (viewer, reader) = attach(hc, &first.address, size(24, 80)).unwrap();
        let output = wait_for_output(reader);
        expect_output(&output, "resized_32 96");
        drop(viewer);

        let start_app = || {
            AppState::new(
                Box::new(|_, _| {}),
                store::open(&scratch.path().join("test.db")).unwrap(),
                scratch.path().to_owned(),
                Some(hc.clone()),
                None,
                Default::default(),
            )
        };
        let app = start_app();
        let home = || Ok("/tmp".to_owned());
        assert_eq!(floating_directory(&app, None, None, home).unwrap(), "/tmp");
        assert_eq!(
            floating_directory(&app, None, Some(&project.id), home).unwrap(),
            project.path
        );
        let cwd = floating_directory(&app, Some(&ws.id), Some(&project.id), home).unwrap();
        let floating = create_floating(hc, production, &cwd).await.unwrap();
        let next = create_floating(hc, production, &project.path).await.unwrap();
        let development = Environment::Development;
        let dev_shell = create_floating(hc, development, &cwd).await.unwrap();
        assert_eq!(floating_list(hc, production).await.unwrap().len(), 2);
        assert_eq!(floating_list(hc, development).await.unwrap()[0].address, dev_shell.address);
        assert!(owned_floating_terminal(hc, development, &floating.address).await.is_err());
        assert!(owned_floating_terminal(hc, production, &dev_shell.address).await.is_err());
        stop(hc, dev_shell).await.unwrap();
        assert_eq!(hc.get(&floating.address).await.unwrap().state, "live");
        assert_eq!(floating.cwd, ws.work_dir);
        assert_eq!(list(hc, production, &ws).await.unwrap().len(), 2);
        assert!(owned_terminal(hc, production, &ws, &floating.address).await.is_err());
        let (viewer, reader) = attach(hc, &floating.address, size(24, 80)).unwrap();
        let output = wait_for_output(reader);
        expect_output(&output, "\x1b[");
        tokio::time::sleep(Duration::from_millis(250)).await;
        viewer
            .writer
            .lock()
            .write_all(b"printf 'float_%s\\n' ready; sleep 2; printf 'float_%s\\n' continued\r")
            .unwrap();
        expect_output(&output, "float_ready");
        drop(viewer);
        drop(output);
        drop(app);

        let reopened_app = start_app();
        let found = floating_list(reopened_app.hc().unwrap(), reopened_app.environment)
            .await
            .unwrap()
            .remove(0);
        assert_eq!(found.address, floating.address);
        let (viewer, reader) = attach(hc, &found.address, size(24, 80)).unwrap();
        let output = wait_for_output(reader);
        expect_output(&output, "float_continued");
        drop(viewer);
        assert!(owned_floating_terminal(hc, production, &first.address).await.is_err());
        stop(
            hc,
            owned_floating_terminal(hc, production, &found.address).await.unwrap(),
        )
        .await
        .unwrap();
        assert_eq!(floating_list(hc, production).await.unwrap()[0].address, next.address);
        stop(hc, next).await.unwrap();

        stop(hc, first).await.unwrap();
        assert_eq!(list(hc, production, &ws).await.unwrap()[0].address, second.address);
        assert_eq!(hc.get(&second.address).await.unwrap().state, "live");
        stop(hc, second).await.unwrap();
        stop(hc, project_terminal).await.unwrap();
    }
}
