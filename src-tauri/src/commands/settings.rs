use super::St;
use crate::error::{AppError, AppResult};
use crate::store;
use serde::Serialize;
use std::path::Path;
use std::sync::atomic::Ordering;

#[derive(Serialize)]
pub struct AppInfo {
    environment: crate::environment::Environment,
    hc_connected: bool,
    hc_version: Option<String>,
    hc_path: Option<String>,
    node_path: Option<String>,
    data_dir: String,
}

#[tauri::command]
pub fn app_info(st: St<'_>) -> AppInfo {
    AppInfo {
        environment: st.environment,
        hc_connected: st.hc_connected.load(Ordering::SeqCst),
        hc_version: st.hc_version.lock().clone(),
        hc_path: st.hc.as_ref().map(|h| h.bin.to_string_lossy().into()),
        node_path: st.node.as_ref().map(|p| p.to_string_lossy().into()),
        data_dir: st.data_dir.to_string_lossy().into(),
    }
}

/// Installed font family names, sorted, without hidden `.`-prefixed system families (spec 010).
#[tauri::command]
pub async fn font_families() -> Vec<String> {
    tokio::task::spawn_blocking(list_font_families).await.unwrap_or_default()
}

#[cfg(target_os = "macos")]
fn list_font_families() -> Vec<String> {
    let names = core_text::font_manager::copy_available_font_family_names();
    let mut out: Vec<String> = names.iter().map(|n| n.to_string()).filter(|n| !n.starts_with('.')).collect();
    out.sort_by_key(|n| n.to_lowercase());
    out.dedup();
    out
}

#[cfg(not(target_os = "macos"))]
fn list_font_families() -> Vec<String> {
    Vec::new()
}

/// Resolve a selectable font through Core Text for WebKit, which hides some local fonts.
#[tauri::command]
pub async fn terminal_font_data(family: String) -> AppResult<tauri::ipc::Response> {
    let data = tokio::task::spawn_blocking(move || read_terminal_font(&family))
        .await
        .map_err(|error| AppError::new("terminal_font", error.to_string()))??;
    Ok(tauri::ipc::Response::new(data))
}

fn read_terminal_font(family: &str) -> AppResult<Vec<u8>> {
    #[cfg(target_os = "macos")]
    if let Ok(font) = core_text::font::new_from_name(family, 13.0) {
        if font.family_name() == family {
            if let Some(path) = font.url().and_then(|url| url.to_path()) {
                if matches!(path.extension().and_then(|ext| ext.to_str()), Some("ttf" | "otf")) {
                    return Ok(std::fs::read(path)?);
                }
            }
        }
    }

    Err(AppError::new("terminal_font", format!("Font cannot be loaded: {family}")))
}

/// A custom theme file as read from disk (spec 016); the frontend validates the contents.
#[derive(Serialize, Debug, PartialEq)]
pub struct ThemeFile {
    file: String,
    text: Option<String>,
    error: Option<String>,
}

const MAX_THEME_BYTES: u64 = 256 * 1024;

/// Reads `<dir>/*.json` raw, sorted by name; creates `dir` when missing. Files over 256 KB come back with an error instead of text.
fn read_theme_files(dir: &Path) -> Vec<ThemeFile> {
    let _ = std::fs::create_dir_all(dir);
    let Ok(rd) = std::fs::read_dir(dir) else { return vec![] };
    let mut out: Vec<ThemeFile> = rd
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file() && e.path().extension().map(|x| x.eq_ignore_ascii_case("json")).unwrap_or(false))
        .map(|e| {
            let file = e.file_name().to_string_lossy().into_owned();
            let too_big = e.metadata().map(|m| m.len() > MAX_THEME_BYTES).unwrap_or(false);
            if too_big {
                return ThemeFile { file, text: None, error: Some("file is larger than 256 KB".into()) };
            }
            match std::fs::read_to_string(e.path()) {
                Ok(text) => ThemeFile { file, text: Some(text), error: None },
                Err(err) => ThemeFile { file, text: None, error: Some(format!("could not read the file: {err}")) },
            }
        })
        .collect();
    out.sort_by(|a, b| a.file.cmp(&b.file));
    out
}

/// Custom themes in `<data_dir>/themes/` (spec 016).
#[tauri::command]
pub async fn theme_files(st: St<'_>) -> Result<Vec<ThemeFile>, ()> {
    let dir = st.data_dir.join("themes");
    Ok(tokio::task::spawn_blocking(move || read_theme_files(&dir)).await.unwrap_or_default())
}

#[tauri::command]
pub fn settings_get(st: St<'_>, key: String) -> AppResult<Option<String>> {
    store::setting_get(&st.db.lock(), &key)
}

#[tauri::command]
pub fn settings_set(st: St<'_>, key: String, value: String) -> AppResult<()> {
    store::setting_set(&st.db.lock(), &key, &value)
}

#[cfg(test)]
mod theme_file_tests {
    use super::*;

    #[test]
    fn reads_only_json_sorted_and_creates_the_dir() {
        let base = std::env::temp_dir().join(format!("herdsman-themes-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&base);
        let dir = base.join("themes");
        assert!(read_theme_files(&dir).is_empty()); // missing dir → created, empty
        assert!(dir.is_dir());
        std::fs::write(dir.join("b.json"), "{}").unwrap();
        std::fs::write(dir.join("a.JSON"), "{\"background\":\"#fff\"}").unwrap();
        std::fs::write(dir.join("notes.txt"), "x").unwrap();
        let files = read_theme_files(&dir);
        assert_eq!(files.iter().map(|f| f.file.as_str()).collect::<Vec<_>>(), vec!["a.JSON", "b.json"]);
        assert_eq!(files[1].text.as_deref(), Some("{}"));
        std::fs::remove_dir_all(&base).unwrap();
    }

    #[test]
    fn oversized_file_returns_an_error_not_text() {
        let base = std::env::temp_dir().join(format!("herdsman-themes-big-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&base);
        std::fs::create_dir_all(&base).unwrap();
        std::fs::write(base.join("big.json"), vec![b' '; (MAX_THEME_BYTES + 1) as usize]).unwrap();
        let files = read_theme_files(&base);
        assert_eq!(files.len(), 1);
        assert!(files[0].text.is_none());
        assert!(files[0].error.is_some());
        std::fs::remove_dir_all(&base).unwrap();
    }
}

#[cfg(all(test, target_os = "macos"))]
mod font_tests {
    #[test]
    fn lists_installed_families() {
        let f = super::list_font_families();
        eprintln!("font families: {}", f.len());
        assert!(f.iter().any(|n| n == "Menlo"), "Menlo ships with macOS");
        assert!(f.iter().all(|n| !n.starts_with('.')));
    }
}
