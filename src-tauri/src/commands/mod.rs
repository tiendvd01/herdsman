//! Tauri IPC commands grouped by feature.

pub(crate) mod agent_output;
pub(crate) mod files;
pub(crate) mod history;
pub(crate) mod sessions;
pub(crate) mod settings;
pub(crate) mod workspaces;

pub use agent_output::*;
pub use files::*;
pub use history::*;
pub use sessions::*;
pub use settings::*;
pub use workspaces::*;

use crate::state::AppState;
use std::sync::Arc;
use tauri::State;

type St<'a> = State<'a, Arc<AppState>>;
