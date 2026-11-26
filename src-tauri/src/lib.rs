pub mod agent;
pub mod commands;
mod project_files;
mod project_skills;
mod editor_lsp;
mod workspace_terminal;
mod hc_output;
pub mod error;
pub mod git;
mod pull_requests;
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

/// Đường dẫn sidecar: biến môi trường → resource đóng gói → mã nguồn trong repo.
fn sidecar_entry(app: &tauri::AppHandle) -> PathBuf {
    if let Ok(p) = std::env::var("HERDSMAN_SIDECAR") {
        return PathBuf::from(p);
    }
    let dev = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../sidecar/src/index.mjs");
    if let Ok(resources) = app.path().resource_dir() {
        let bundled = resources.join("sidecar/src/index.mjs");
        if bundled.is_file() && resources.join("sidecar/node_modules").is_dir() {
            return bundled;
        }
    }
    dev.canonicalize().unwrap_or(dev)
}

fn find_node() -> Option<PathBuf> {
    if let Ok(p) = std::env::var("HERDSMAN_NODE") {
        return Some(PathBuf::from(p));
    }
    if let Ok(executable) = std::env::current_exe() {
        let bundled = executable.with_file_name("herdsman-node");
        if bundled.is_file() {
            return Some(bundled);
        }
    }
    if let Some(p) = hc::which_in_login_shell("node") {
        return Some(p);
    }
    ["/opt/homebrew/bin/node", "/usr/local/bin/node"].iter().map(PathBuf::from).find(|p| p.exists())
}

const ZOOM_MENU_IDS: [&str; 3] = ["zoom_in", "zoom_out", "zoom_reset"];
const CLOSE_TAB_MENU_ID: &str = "close_tab";

fn install_shortcut_menu(app: &tauri::App) -> tauri::Result<()> {
    use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
    let handle = app.handle();
    let menu = Menu::default(handle)?;
    let items = [
        MenuItem::with_id(handle, ZOOM_MENU_IDS[0], "Zoom In", true, Some("CmdOrCtrl+="))?,
        MenuItem::with_id(handle, ZOOM_MENU_IDS[1], "Zoom Out", true, Some("CmdOrCtrl+-"))?,
        MenuItem::with_id(handle, ZOOM_MENU_IDS[2], "Actual Size", true, Some("CmdOrCtrl+0"))?,
    ];
    // The webview handles Close Tab so holding the key cannot repeatedly close tabs.
    let close_tab = MenuItem::with_id(handle, CLOSE_TAB_MENU_ID, "Close Tab", true, None::<&str>)?;
    // The default native Close Window accelerator consumes Cmd+W before the webview sees it.
    for item in menu.items()? {
        let Some(submenu) = item.as_submenu() else { continue };
        let title = submenu.text()?;
        if title != "Window" && title != "File" {
            continue;
        }
        #[cfg(target_os = "macos")]
        for item in submenu.items()? {
            if let Some(predefined) = item.as_predefined_menuitem() {
                let text = predefined.text()?;
                if text == "Close" || text == "Close Window" {
                    submenu.remove(predefined)?;
                }
            }
        }
        let close_menu = if cfg!(target_os = "macos") { "File" } else { "Window" };
        if title == close_menu {
            submenu.append(&close_tab)?;
        }
    }

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
            CLOSE_TAB_MENU_ID => "close-tab",
            _ => return,
        };
        let _ = app.emit_to("main", "ui-shortcut", dir);
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
fn set_shortcut_accelerators(
    app: tauri::AppHandle,
    accelerators: [Option<String>; 3],
    close_tab_label: String,
) -> Result<(), String> {
    let menu = app.menu().ok_or_else(|| "Application menu is unavailable".to_owned())?;
    let mut updated = 0;
    for item in menu.items().map_err(|error| error.to_string())? {
        let Some(submenu) = item.as_submenu() else { continue };
        for item in submenu.items().map_err(|error| error.to_string())? {
            let Some(item) = item.as_menuitem() else { continue };
            if item.id().as_ref() == CLOSE_TAB_MENU_ID {
                item.set_text(format!("Close Tab ({close_tab_label})")).map_err(|error| error.to_string())?;
                updated += 1;
            } else if let Some(index) = ZOOM_MENU_IDS.iter().position(|id| *id == item.id().as_ref()) {
                item.set_accelerator(accelerators[index].as_deref()).map_err(|error| error.to_string())?;
                updated += 1;
            }
        }
    }
    if updated != accelerators.len() + 1 {
        return Err("Keyboard shortcut menu items are unavailable".into());
    }
    Ok(())
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
            install_shortcut_menu(app)?;
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
        .manage(editor_lsp::EditorLsp::default())
        .manage(pull_requests::PullRequests::default())
        .invoke_handler(tauri::generate_handler![
            pull_requests::github_accounts,
            pull_requests::pull_requests_refresh,
            pull_requests::pull_requests_read,
            pull_requests::pull_request_open,
            pull_requests::detail::pull_request_detail,
            workspace_terminal::workspace_terminal_create,
            workspace_terminal::workspace_terminal_list,
            workspace_terminal::workspace_terminal_stop,
            workspace_terminal::workspace_terminal_attach,
            workspace_terminal::workspace_terminal_input,
            workspace_terminal::workspace_terminal_resize,
            workspace_terminal::workspace_terminal_detach,
            commands::settings::app_info,
            commands::settings::font_families,
            commands::settings::terminal_font_data,
            commands::settings::theme_files,
            commands::settings::settings_get,
            commands::settings::settings_set,
            commands::workspaces::project_list,
            project_skills::project_skill_catalog,
            project_skills::project_skill_change,
            commands::workspaces::project_add,
            commands::workspaces::project_rename,
            commands::workspaces::project_delete,
            commands::workspaces::workspace_list,
            commands::workspaces::workspace_create,
            commands::workspaces::workspace_rename,
            commands::workspaces::workspace_dirty_check,
            commands::workspaces::workspace_archive,
            commands::workspaces::workspace_unarchive,
            commands::workspaces::workspace_delete,
            commands::workspaces::git_branches,
            commands::sessions::session_history,
            commands::sessions::session_create,
            commands::sessions::session_open,
            commands::sessions::session_close_view,
            commands::sessions::session_prompt,
            commands::sessions::session_image,
            commands::sessions::session_interrupt,
            commands::sessions::session_permission,
            commands::sessions::session_set_permission_mode,
            commands::sessions::session_list_models,
            commands::sessions::session_list_commands,
            commands::sessions::session_set_model,
            commands::sessions::session_resume,
            commands::sessions::session_kill,
            commands::sessions::session_close,
            commands::sessions::session_set_pinned,
            commands::sessions::session_get,
            commands::history::search,
            commands::history::claude_search,
            commands::history::history_stored,
            commands::history::history_claude,
            commands::history::claude_open,
            commands::history::session_rehome,
            commands::history::codex_threads,
            commands::history::codex_open,
            commands::agent_output::terminal_read,
            hc_output::hc_output_target,
            hc_output::hc_output_open,
            hc_output::hc_output_read,
            commands::agent_output::agent_tree,
            commands::files::git_history,
            commands::files::git_commit_changes,
            commands::files::git_commit_file_diff,
            commands::files::files_changed,
            commands::files::project_files_changed,
            commands::files::file_diff,
            commands::files::project_files_list,
            commands::files::project_files_search,
            commands::files::project_file_read,
            commands::files::editor_lsp_open,
            commands::files::editor_lsp_hover,
            commands::files::editor_lsp_close,
            commands::files::session_file_read,
            commands::files::session_file_exists,
            commands::files::absolute_file_read,
            commands::files::absolute_files_search,
            commands::files::project_file_save,
            commands::files::project_markdown_download,
            notifications_request_permission,
            exit_after_file_review,
            set_shortcut_accelerators,
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
