use super::St;
use crate::error::{AppError, AppResult};
use crate::{git, store};
use serde::Serialize;
use std::path::Path;
use tauri::State;

#[derive(Serialize)]
pub struct ChangedFile {
    status: String,
    path: String,
}

#[tauri::command]
pub async fn files_changed(st: St<'_>, workspace_id: String) -> AppResult<Vec<ChangedFile>> {
    let ws = store::workspace_get(&st.db.lock(), &workspace_id)?;
    let dir = Path::new(&ws.work_dir);
    if !git::is_repo(dir).await {
        return Ok(vec![]);
    }
    Ok(git::changed_files(dir).await?.into_iter().map(|(status, path)| ChangedFile { status, path }).collect())
}

#[tauri::command]
pub async fn git_history(st: St<'_>, workspace_id: String) -> AppResult<Option<git::History>> {
    let ws = store::workspace_get(&st.db.lock(), &workspace_id)?;
    git::history(Path::new(&ws.work_dir)).await
}

#[tauri::command]
pub async fn git_commit_changes(st: St<'_>, workspace_id: String, commit: String) -> AppResult<Vec<git::Change>> {
    let ws = store::workspace_get(&st.db.lock(), &workspace_id)?;
    git::commit_changes(Path::new(&ws.work_dir), &commit).await
}

#[tauri::command]
pub async fn git_commit_file_diff(st: St<'_>, workspace_id: String, commit: String, path: String, original: Option<String>) -> AppResult<String> {
    let ws = store::workspace_get(&st.db.lock(), &workspace_id)?;
    git::commit_file_diff(Path::new(&ws.work_dir), &commit, &path, original.as_deref()).await
}

#[tauri::command]
pub async fn project_files_changed(st: St<'_>, project_id: String) -> AppResult<Vec<ChangedFile>> {
    let project = store::project_get(&st.db.lock(), &project_id)?;
    Ok(git::project_changed_files(Path::new(&project.path)).await?.into_iter()
        .map(|(status, path)| ChangedFile { status, path }).collect())
}

#[tauri::command]
pub async fn file_diff(st: St<'_>, workspace_id: String, path: String) -> AppResult<String> {
    let ws = store::workspace_get(&st.db.lock(), &workspace_id)?;
    git::file_diff(Path::new(&ws.work_dir), &path).await
}

#[tauri::command]
pub async fn project_files_list(st: St<'_>, project_id: String, path: String) -> AppResult<Vec<crate::project_files::Entry>> {
    let project = store::project_get(&st.db.lock(), &project_id)?;
    tokio::task::spawn_blocking(move || crate::project_files::list(Path::new(&project.path), &path))
        .await.map_err(|error| AppError::new("file_task", error.to_string()))?
}

#[tauri::command]
pub async fn project_files_search(
    st: St<'_>,
    project_id: String,
    query: String,
) -> AppResult<Vec<crate::project_files::Entry>> {
    let project = store::project_get(&st.db.lock(), &project_id)?;
    tokio::task::spawn_blocking(move || crate::project_files::search(Path::new(&project.path), &query))
        .await
        .map_err(|error| AppError::new("file_task", error.to_string()))?
}

#[tauri::command]
pub async fn project_file_read(st: St<'_>, project_id: String, path: String) -> AppResult<crate::project_files::Document> {
    let project = store::project_get(&st.db.lock(), &project_id)?;
    tokio::task::spawn_blocking(move || crate::project_files::read(Path::new(&project.path), &path))
        .await.map_err(|error| AppError::new("file_task", error.to_string()))?
}

#[tauri::command]
pub async fn editor_lsp_open(
    st: St<'_>, lsp: State<'_, crate::editor_lsp::EditorLsp>, session: String,
    project_id: String, workspace_id: Option<String>, path: String, text: String,
) -> AppResult<()> {
    let root = {
        let db = st.db.lock();
        if Path::new(&path).is_absolute() {
            let workspace = workspace_id.as_deref().map(|id| store::workspace_get(&db, id)).transpose()?
                .filter(|workspace| workspace.project_id == project_id)
                .ok_or_else(|| AppError::new("editor_lsp", "Type hover is unavailable outside this workspace."))?;
            workspace.work_dir
        } else {
            store::project_get(&db, &project_id)?.path
        }
    };
    let (root, file) = tokio::task::spawn_blocking(move || -> AppResult<_> {
        let root = Path::new(&root).canonicalize()?;
        let file = if Path::new(&path).is_absolute() {
            crate::project_files::resolve_workspace(&root, Path::new(&path))?.0
        } else {
            crate::project_files::resolve(&root, &path)?
        };
        if !file.is_file() {
            return Err(AppError::new("editor_lsp", "Type hover requires a regular workspace file."));
        }
        Ok((root, file))
    }).await.map_err(|_| AppError::new("editor_lsp", "Could not locate the editor file."))??;
    lsp.open(session, &root, &file, text).await
}

#[tauri::command]
pub async fn editor_lsp_hover(
    lsp: State<'_, crate::editor_lsp::EditorLsp>, session: String, text: String, line: u32, character: u32,
) -> AppResult<Option<String>> {
    lsp.hover(&session, text, line, character).await
}

#[tauri::command]
pub async fn editor_lsp_close(lsp: State<'_, crate::editor_lsp::EditorLsp>, session: String) -> AppResult<()> {
    lsp.close(&session).await;
    Ok(())
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionFile {
    project_id: String,
    path: String,
    document: crate::project_files::Document,
}

fn session_workspace(st: &St<'_>, session_id: &str) -> AppResult<store::Workspace> {
    let db = st.db.lock();
    let session = store::session_get(&db, session_id)?;
    store::workspace_get(&db, &session.workspace_id)
}

#[tauri::command]
pub async fn session_file_exists(st: St<'_>, session_id: String, path: String) -> AppResult<bool> {
    let workspace = session_workspace(&st, &session_id)?;
    tokio::task::spawn_blocking(move || {
        crate::project_files::workspace_file_exists(Path::new(&workspace.work_dir), Path::new(&path))
    })
    .await
    .map_err(|error| AppError::new("file_task", error.to_string()))
}

#[tauri::command]
pub async fn session_file_read(
    st: St<'_>,
    session_id: String,
    path: String,
) -> AppResult<SessionFile> {
    let workspace = session_workspace(&st, &session_id)?;
    tokio::task::spawn_blocking(move || {
        let (path, document) = crate::project_files::read_workspace(
            Path::new(&workspace.work_dir),
            Path::new(&path),
            workspace.dir_kind == "worktree",
        )?;
        Ok(SessionFile {
            project_id: workspace.project_id,
            path,
            document,
        })
    })
    .await
    .map_err(|error| AppError::new("file_task", error.to_string()))?
}

#[tauri::command]
pub async fn absolute_files_search(path: String) -> AppResult<Vec<crate::project_files::Entry>> {
    tokio::task::spawn_blocking(move || crate::project_files::search_absolute(Path::new(&path)))
        .await
        .map_err(|error| AppError::new("file_task", error.to_string()))?
}

#[tauri::command]
pub async fn absolute_file_read(path: String) -> AppResult<crate::project_files::Document> {
    tokio::task::spawn_blocking(move || crate::project_files::read_absolute(Path::new(&path)))
        .await
        .map_err(|error| AppError::new("file_task", error.to_string()))?
}

#[tauri::command]
pub async fn project_file_save(st: St<'_>, project_id: String, path: String, baseline: String, text: String) -> AppResult<()> {
    let project = store::project_get(&st.db.lock(), &project_id)?;
    tokio::task::spawn_blocking(move || crate::project_files::save(Path::new(&project.path), &path, &baseline, &text))
        .await.map_err(|error| AppError::new("file_task", error.to_string()))?
}

#[tauri::command]
pub async fn project_markdown_download(
    window: tauri::WebviewWindow,
    st: St<'_>,
    project_id: String,
    path: String,
    text: String,
) -> AppResult<()> {
    use tauri_plugin_dialog::DialogExt;

    let source = if Path::new(&path).is_absolute() {
        Path::new(&path).to_path_buf()
    } else {
        let project = store::project_get(&st.db.lock(), &project_id)?;
        Path::new(&project.path).join(&path)
    };
    let name = source
        .file_name()
        .and_then(|name| name.to_str())
        .filter(|name| {
            let name = name.to_ascii_lowercase();
            name.ends_with(".md") || name.ends_with(".markdown")
        })
        .ok_or_else(|| AppError::new("unsupported_file", "Choose a Markdown file."))?
        .to_owned();

    tokio::task::spawn_blocking(move || {
        let Some(destination) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Download Markdown")
            .set_file_name(name)
            .blocking_save_file()
        else {
            return Ok(());
        };
        let destination = destination
            .into_path()
            .map_err(|error| AppError::new("invalid_path", error.to_string()))?;
        crate::project_files::write_markdown_copy(&source, &destination, &text)
    })
    .await
    .map_err(|error| AppError::new("file_task", error.to_string()))?
}
