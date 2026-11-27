//! Trạng thái dùng chung của backend.
use crate::environment::Environment;
use crate::error::{AppError, AppResult};
use crate::hc::{Hc, Terminal};
use parking_lot::Mutex;
use rusqlite::Connection;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;

pub struct AppState {
    /// Phát event lên UI (Tauri) — tách ra để test được không cần cửa sổ.
    pub emitter: Box<dyn Fn(&str, serde_json::Value) + Send + Sync>,
    pub db: Mutex<Connection>,
    pub environment: Environment,
    pub data_dir: PathBuf,
    pub hc: Option<Hc>,
    pub node: Option<PathBuf>,
    pub sidecar: PathBuf,
    /// Kết nối socket đang hiển thị trong UI, theo session id.
    pub views: Mutex<HashMap<String, tokio::task::AbortHandle>>,
    /// Snapshot of this environment's hc terminals, keyed by address.
    pub terminals: Mutex<HashMap<String, Terminal>>,
    pub hc_connected: AtomicBool,
    pub hc_version: Mutex<Option<String>>,
    /// Keychain in the app; in-memory for tests (spec 071).
    pub secrets: Arc<dyn crate::secrets::SecretStore>,
}

impl AppState {
    pub fn new(
        emitter: Box<dyn Fn(&str, serde_json::Value) + Send + Sync>,
        db: Connection,
        data_dir: PathBuf,
        hc: Option<Hc>,
        node: Option<PathBuf>,
        sidecar: PathBuf,
    ) -> Self {
        Self {
            emitter,
            db: Mutex::new(db),
            environment: Environment::Production,
            data_dir,
            hc,
            node,
            sidecar,
            views: Mutex::new(HashMap::new()),
            terminals: Mutex::new(HashMap::new()),
            hc_connected: AtomicBool::new(false),
            hc_version: Mutex::new(None),
            secrets: Arc::new(crate::secrets::MemorySecrets::default()),
        }
    }

    pub fn emit(&self, event: &str, payload: serde_json::Value) {
        (self.emitter)(event, payload);
    }

    pub fn hc(&self) -> crate::error::AppResult<&Hc> {
        self.hc.as_ref().ok_or_else(|| crate::error::AppError::new("hc_missing", "hc (herdr-core) is not installed. Install hc, then reopen the app."))
    }

    pub(crate) async fn session_terminal(&self, session_id: &str, address: &str) -> AppResult<Terminal> {
        let terminal = self.hc()?.get(address).await?;
        if !self.environment.owns(&terminal) || terminal.label("herdsman.session") != Some(session_id) {
            return Err(AppError::new("terminal_not_found", "Session terminal not found in this environment."));
        }
        Ok(terminal)
    }

    pub fn session_dir(&self, sid: &str) -> PathBuf {
        self.data_dir.join("sessions").join(sid)
    }

    pub fn sock_path(&self, sid: &str) -> PathBuf {
        self.data_dir.join("sock").join(format!("{sid}.sock"))
    }
}
