//! Trạng thái dùng chung của backend.
use crate::hc::{Hc, Terminal};
use parking_lot::Mutex;
use rusqlite::Connection;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;

pub struct AppState {
    /// Phát event lên UI (Tauri) — tách ra để test được không cần cửa sổ.
    pub emitter: Box<dyn Fn(&str, serde_json::Value) + Send + Sync>,
    pub db: Mutex<Connection>,
    pub data_dir: PathBuf,
    pub hc: Option<Hc>,
    pub node: Option<PathBuf>,
    pub sidecar: PathBuf,
    /// Kết nối socket đang hiển thị trong UI, theo session id.
    pub views: Mutex<HashMap<String, tokio::task::AbortHandle>>,
    /// Ảnh chụp terminal hc có label herdsman.app=1, theo địa chỉ.
    pub terminals: Mutex<HashMap<String, Terminal>>,
    pub hc_connected: AtomicBool,
    pub hc_version: Mutex<Option<String>>,
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
            data_dir,
            hc,
            node,
            sidecar,
            views: Mutex::new(HashMap::new()),
            terminals: Mutex::new(HashMap::new()),
            hc_connected: AtomicBool::new(false),
            hc_version: Mutex::new(None),
        }
    }

    pub fn emit(&self, event: &str, payload: serde_json::Value) {
        (self.emitter)(event, payload);
    }

    pub fn hc(&self) -> crate::error::AppResult<&Hc> {
        self.hc.as_ref().ok_or_else(|| crate::error::AppError::new("hc_missing", "hc (herdr-core) is not installed. Install hc, then reopen the app."))
    }

    pub fn session_dir(&self, sid: &str) -> PathBuf {
        self.data_dir.join("sessions").join(sid)
    }

    pub fn sock_path(&self, sid: &str) -> PathBuf {
        self.data_dir.join("sock").join(format!("{sid}.sock"))
    }
}
