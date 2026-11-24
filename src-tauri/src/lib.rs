pub mod agent;
pub mod commands;
mod project_files;
mod workspace_terminal;
pub mod error;
pub mod git;
pub mod claude_history;
pub mod hc;
pub mod state;
pub mod store;

use parking_lot::Mutex;
use state::AppState;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tauri::{Emitter, Manager};

/// Đường dẫn sidecar: biến môi trường → mã nguồn trong repo (dev) → resource đóng gói.
fn sidecar_entry(app: &tauri::AppHandle) -> PathBuf {
    if let Ok(p) = std::env::var("HERDSMAN_SIDECAR") {
        return PathBuf::from(p);
    }
    let dev = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../sidecar/src/index.mjs");
    if dev.exists() {
        return dev.canonicalize().unwrap_or(dev);
    }
    app.path()
        .resource_dir()
        .map(|d| d.join("sidecar/src/index.mjs"))
        .unwrap_or(dev)
}

fn find_node() -> Option<PathBuf> {
    if let Ok(p) = std::env::var("HERDSMAN_NODE") {
        return Some(PathBuf::from(p));
    }
    if let Some(p) = hc::which_in_login_shell("node") {
        return Some(p);
    }
    ["/opt/homebrew/bin/node", "/usr/local/bin/node"].iter().map(PathBuf::from).find(|p| p.exists())
}

/// Spec 006: View → Zoom In / Zoom Out / Actual Size. The frontend owns the zoom state, so the menu only
/// emits `ui-zoom` ("in" | "out" | "reset"). Built on the default menu so Edit (copy/paste) keeps working.
fn install_zoom_menu(app: &tauri::App) -> tauri::Result<()> {
    use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
    let handle = app.handle();
    let menu = Menu::default(handle)?;
    let items = [
        MenuItem::with_id(handle, "zoom_in", "Zoom In", true, Some("CmdOrCtrl+="))?,
        MenuItem::with_id(handle, "zoom_out", "Zoom Out", true, Some("CmdOrCtrl+-"))?,
        MenuItem::with_id(handle, "zoom_reset", "Actual Size", true, Some("CmdOrCtrl+0"))?,
    ];
    let view = menu
        .items()?
        .into_iter()
        .filter_map(|k| k.as_submenu().cloned())
        .find(|m| m.text().map(|t| t == "View").unwrap_or(false));
    match view {
        Some(view) => {
            view.append(&PredefinedMenuItem::separator(handle)?)?;
            for it in &items {
                view.append(it)?;
            }
        }
        None => {
            let view = Submenu::with_items(handle, "View", true, &[&items[0], &items[1], &items[2]])?;
            menu.append(&view)?;
        }
    }
    app.set_menu(menu)?;
    app.on_menu_event(|app, ev| {
        let dir = match ev.id().as_ref() {
            "zoom_in" => "in",
            "zoom_out" => "out",
            "zoom_reset" => "reset",
            _ => return,
        };
        let _ = app.emit("ui-zoom", dir);
    });
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[cfg(target_os = "macos")]
fn set_dock_icon() {
    use objc2::{AnyThread, MainThreadMarker};
    use objc2_app_kit::{NSApplication, NSImage};
    use objc2_foundation::NSData;
    let Some(mtm) = MainThreadMarker::new() else { return };
    let data = NSData::with_bytes(include_bytes!("../icons/icon.png"));
    if let Some(img) = NSImage::initWithData(NSImage::alloc(), &data) {
        unsafe { NSApplication::sharedApplication(mtm).setApplicationIconImage(Some(&img)) };
    }
}

#[cfg(target_os = "macos")]
fn request_notification_permission() {
    use block2::RcBlock;
    use objc2_foundation::NSError;
    use objc2_user_notifications::{UNAuthorizationOptions, UNUserNotificationCenter};

    // An unbundled tauri dev binary has no notification identity of its own.
    let Ok(executable) = std::env::current_exe() else { return };
    if executable.ancestors().nth(3).and_then(|p| p.extension())
        != Some(std::ffi::OsStr::new("app"))
    {
        return;
    }

    let on_result = RcBlock::new(|_, error: *mut NSError| {
        if !error.is_null() {
            eprintln!("[herdsman] macOS notification authorization request failed");
        }
    });
    UNUserNotificationCenter::currentNotificationCenter()
        .requestAuthorizationWithOptions_completionHandler(
            UNAuthorizationOptions::Alert | UNAuthorizationOptions::Sound,
            &on_result,
        );
}

#[tauri::command]
fn notifications_request_permission() {
    #[cfg(target_os = "macos")]
    request_notification_permission();
}

#[tauri::command]
fn exit_after_file_review(app: tauri::AppHandle) {
    app.exit(0);
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            set_dock_icon();
            let handle = app.handle().clone();
            let data_dir = std::env::var("HERDSMAN_DATA_DIR").map(PathBuf::from).unwrap_or(app.path().app_data_dir()?);
            std::fs::create_dir_all(data_dir.join("sock"))?;
            let db = store::open(&data_dir.join("herdsman.db")).map_err(|e| e.message)?;
            let st = Arc::new(AppState {
                emitter: {
                    let h = handle.clone();
                    Box::new(move |ev: &str, payload: serde_json::Value| {
                        let _ = h.emit(ev, payload);
                    })
                },
                db: Mutex::new(db),
                hc: hc::find_hc().map(|bin| hc::Hc { bin }),
                node: find_node(),
                sidecar: sidecar_entry(&handle),
                data_dir,
                views: Mutex::new(HashMap::new()),
                terminals: Mutex::new(HashMap::new()),
                hc_connected: AtomicBool::new(false),
                hc_version: Mutex::new(None),
            });
            install_zoom_menu(app)?;
            #[cfg(target_os = "macos")]
            request_notification_permission();
            app.manage(st.clone());
            let st_watch = st.clone();
            tauri::async_runtime::spawn(async move { agent::watch_hc(st_watch).await });
            let st_index = st.clone();
            tauri::async_runtime::spawn_blocking(move || agent::backfill_index(&st_index));
            tauri::async_runtime::spawn(agent::watch_claude_titles(st));
            Ok(())
        })
        .manage(workspace_terminal::Viewers::default())
        .invoke_handler(tauri::generate_handler![
            workspace_terminal::workspace_terminal_create,
            workspace_terminal::workspace_terminal_list,
            workspace_terminal::workspace_terminal_stop,
            workspace_terminal::workspace_terminal_attach,
            workspace_terminal::workspace_terminal_input,
            workspace_terminal::workspace_terminal_resize,
            workspace_terminal::workspace_terminal_detach,
            commands::app_info,
            commands::font_families,
            commands::terminal_font_data,
            commands::theme_files,
            commands::settings_get,
            commands::settings_set,
            commands::project_list,
            commands::project_add,
            commands::project_rename,
            commands::project_delete_preview,
            commands::project_delete,
            commands::workspace_list,
            commands::workspace_create,
            commands::workspace_rename,
            commands::workspace_dirty_check,
            commands::workspace_archive,
            commands::workspace_unarchive,
            commands::workspace_delete,
            commands::git_branches,
            commands::session_history,
            commands::session_create,
            commands::session_open,
            commands::session_close_view,
            commands::session_prompt,
            commands::session_image,
            commands::session_interrupt,
            commands::session_permission,
            commands::session_set_permission_mode,
            commands::session_list_models,
            commands::session_list_commands,
            commands::session_set_model,
            commands::session_resume,
            commands::session_kill,
            commands::session_close,
            commands::session_set_pinned,
            commands::session_get,
            commands::search,
            commands::claude_search,
            commands::claude_open,
            commands::codex_threads,
            commands::codex_open,
            commands::terminal_read,
            commands::agent_tree,
            commands::files_changed,
            commands::project_files_changed,
            commands::file_diff,
            commands::project_files_list,
            commands::project_files_search,
            commands::project_file_read,
            commands::session_file_read,
            commands::session_file_exists,
            commands::absolute_file_read,
            commands::absolute_files_search,
            commands::project_file_save,
            commands::project_markdown_download,
            notifications_request_permission,
            exit_after_file_review,
        ])
        .build(tauri::generate_context!())
        .expect("failed to start Herdsman")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { code: None, api, .. } = event {
                if let Some(window) = app.get_webview_window("main") {
                    if window.emit("review-files-before-quit", ()).is_ok() {
                        api.prevent_exit();
                    }
                }
            }
        });
}
