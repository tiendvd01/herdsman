use super::{workspaces::CreatedWorkspace, St};
use crate::agent;
use crate::error::{AppError, AppResult};
use crate::state::AppState;
use crate::store::{self, SearchHit, Session, Workspace};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::Path;

#[derive(serde::Serialize)]
pub struct ClaudeHitView {
    #[serde(flatten)]
    hit: crate::claude_history::ClaudeHit,
    session_id: Option<String>,
    /// Workspace của Herdsman có work_dir trùng cwd của conversation (None → chưa thêm vào app).
    workspace_id: Option<String>,
    workspace_name: Option<String>,
    project_id: Option<String>,
    project_name: Option<String>,
}

/// Tìm trong transcript Claude Code (~/.claude/projects), không phải session hc của app.
#[tauri::command]
pub async fn claude_search(
    st: St<'_>, query: String, project_id: Option<String>, workspace_id: Option<String>, palette: Option<bool>,
) -> AppResult<Vec<ClaudeHitView>> {
    Ok(search_claude(st, query, project_id, workspace_id, palette.unwrap_or(false), false).await?.hits)
}

#[derive(serde::Serialize)]
pub struct ClaudeHistory {
    hits: Vec<ClaudeHitView>,
    partial: bool,
}

#[tauri::command]
pub async fn history_claude(st: St<'_>, query: String, workspace_id: Option<String>) -> AppResult<ClaudeHistory> {
    search_claude(st, query, None, workspace_id, true, true).await
}

async fn search_claude(
    st: St<'_>, query: String, project_id: Option<String>, workspace_id: Option<String>,
    include_archived: bool, history: bool,
) -> AppResult<ClaudeHistory> {
    let (workspaces, projects, sessions) = {
        let db = st.db.lock();
        (store::workspace_list(&db, None, include_archived)?, store::project_list(&db)?, store::session_all(&db)?)
    };
    let hits = tokio::task::spawn_blocking(move || {
        let workspaces_by_id: HashMap<_, _> = workspaces.iter().map(|w| (w.id.as_str(), w)).collect();
        let mut workspaces_by_dir: HashMap<&str, Vec<&Workspace>> = HashMap::new();
        for ws in workspaces.iter().filter(|ws| ws.deleted_at.is_none()) {
            workspaces_by_dir.entry(&ws.work_dir).or_default().push(ws);
        }
        let mut sessions_by_engine_id: HashMap<&str, Vec<&Session>> = HashMap::new();
        for session in sessions.iter().filter(|s| s.engine == "claude") {
            if let Some(id) = session.engine_session_id.as_deref() {
                sessions_by_engine_id.entry(id).or_default().push(session);
            }
        }
        let locate = |hit: &crate::claude_history::ClaudeHit| {
            if let Some(sessions) = sessions_by_engine_id.get(hit.claude_session_id.as_str()) {
                // A known conversation belongs to its managed locations, even if its old cwd matches another workspace.
                let candidates = sessions.iter().filter_map(|&session| {
                    let &ws = workspaces_by_id.get(session.workspace_id.as_str())?;
                    (project_id.as_ref().is_none_or(|id| id == &ws.project_id)
                        && workspace_id.as_ref().is_none_or(|id| id == &ws.id))
                        .then_some((session, ws))
                });
                if history {
                    return candidates.max_by_key(|(session, ws)| (ws.deleted_at.is_none(), session.updated_at, &session.id))
                        .map_or((None, None, None), |(session, ws)| (Some(session), Some(ws), Some(ws.project_id.as_str())));
                }
                let mut candidates = candidates;
                let Some((session, ws)) = candidates.next() else { return (None, None, None) };
                if let Some((_, other)) = candidates.next() {
                    let same_project = other.project_id == ws.project_id
                        && candidates.all(|(_, candidate)| candidate.project_id == ws.project_id);
                    return (None, None, same_project.then_some(ws.project_id.as_str()));
                }
                return (Some(session), Some(ws), Some(ws.project_id.as_str()));
            }
            let matches = hit.cwd.as_deref().and_then(|cwd| workspaces_by_dir.get(cwd));
            let ws = matches.and_then(|matches| {
                if history {
                    return match matches.as_slice() {
                        [ws] if workspace_id.as_ref().is_none_or(|id| id == &ws.id) => Some(*ws),
                        _ => None,
                    };
                }
                matches.iter().copied().find(|ws| {
                    Some(ws.id.as_str()) == workspace_id.as_deref()
                        && project_id.as_deref().is_none_or(|id| id == ws.project_id)
                })
            });
            let project = ws.map(|w| w.project_id.as_str()).or_else(|| {
                if let Some(matches) = matches {
                    let first = matches.first()?;
                    return matches.iter().all(|w| w.project_id == first.project_id).then_some(first.project_id.as_str());
                }
                projects.iter().find(|p| Some(p.path.as_str()) == hit.cwd.as_deref()).map(|p| p.id.as_str())
            });
            (None, ws, project)
        };
        let include = |hit: &crate::claude_history::ClaudeHit| {
            let (_, ws, project) = locate(hit);
            project_id.as_deref().is_none_or(|id| project == Some(id))
                && workspace_id.as_deref().is_none_or(|id| ws.is_some_and(|w| w.id == id))
        };
        let (hits, partial) = if history && query.trim().is_empty() {
            let mut cwd_by_directory = HashMap::new();
            for cwd in workspaces.iter().map(|ws| ws.work_dir.as_str()).chain(projects.iter().map(|p| p.path.as_str())) {
                // Claude's directory encoding loses separators, so match known paths and discard collisions.
                let directory: String = cwd.chars().map(|c| if c.is_ascii_alphanumeric() { c } else { '-' }).collect();
                cwd_by_directory.entry(directory).and_modify(|path| {
                    if *path != Some(cwd) { *path = None; }
                }).or_insert(Some(cwd));
            }
            crate::claude_history::claude_dir().map_or((vec![], false), |dir| {
                crate::claude_history::browse(&dir.join("projects"), |name| {
                    cwd_by_directory.get(name).copied().flatten().map(str::to_owned)
                }, include)
            })
        } else {
            crate::claude_history::search(&query, if history { usize::MAX } else { 50 }, include)
        };
        let hits = hits.into_iter().map(|hit| {
            let (session, ws, project) = locate(&hit);
            ClaudeHitView {
                session_id: session.map(|s| s.id.clone()),
                workspace_id: ws.map(|w| w.id.clone()),
                workspace_name: ws.and_then(|w| w.name.clone()),
                project_id: project.map(str::to_owned),
                project_name: projects.iter().find(|p| Some(p.id.as_str()) == project).map(|p| p.name.clone()),
                hit,
            }
        }).collect();
        ClaudeHistory { hits, partial }
    }).await.map_err(|e| AppError::new("search_failed", e.to_string()))?;
    Ok(hits)
}

#[derive(serde::Serialize)]
pub struct StoredHistoryEntry {
    session: Session,
    workspace: Workspace,
    project_name: String,
    snippet: Option<String>,
}

#[tauri::command]
pub async fn history_stored(st: St<'_>, query: String, workspace_id: Option<String>) -> AppResult<Vec<StoredHistoryEntry>> {
    let state = st.inner().clone();
    tokio::task::spawn_blocking(move || stored_history(&state.db.lock(), &query, workspace_id.as_deref()))
        .await.map_err(|error| AppError::new("search_failed", error.to_string()))?
}

fn stored_history(db: &rusqlite::Connection, query: &str, workspace_id: Option<&str>) -> AppResult<Vec<StoredHistoryEntry>> {
    let projects = store::project_list(db)?.into_iter().map(|project| (project.id, project.name)).collect::<HashMap<_, _>>();
    let workspaces = store::workspace_list(db, None, true)?.into_iter()
        .filter(|ws| workspace_id.is_none_or(|id| ws.id == id))
        .map(|ws| (ws.id.clone(), ws)).collect::<HashMap<_, _>>();
    let matches = if query.trim().is_empty() {
        None
    } else {
        Some(store::search_sessions(db, query, None, workspace_id, i64::MAX)?
            .into_iter().map(|hit| (hit.session_id, hit.snippet)).collect::<HashMap<_, _>>())
    };
    let sessions = match workspace_id {
        Some(id) => store::session_list(db, id)?,
        None => store::session_all(db)?,
    };
    Ok(sessions.into_iter().filter_map(|session| {
        let workspace = workspaces.get(&session.workspace_id)?;
        let snippet = match &matches {
            Some(matches) => Some(matches.get(&session.id)?.clone()),
            None => None,
        };
        Some(StoredHistoryEntry {
            session,
            workspace: workspace.clone(),
            project_name: projects.get(&workspace.project_id)?.clone(),
            snippet,
        })
    }).collect())
}

/// Open a retained session in a fresh workspace when its original folder still exists.
#[tauri::command]
pub async fn session_rehome(st: St<'_>, id: String) -> AppResult<CreatedWorkspace> {
    let _lifecycle = crate::workspace_terminal::LIFECYCLE.lock().await;
    let mut db = st.db.lock();
    let tx = db.transaction()?;
    let session = store::session_get(&tx, &id)?;
    let old = store::workspace_get(&tx, &session.workspace_id)?;
    let workspace = rehome_session(&tx, &session, old)?;
    let session = store::session_get(&tx, &id)?;
    tx.commit()?;
    Ok(CreatedWorkspace { workspace, session })
}

fn rehome_session(db: &rusqlite::Connection, session: &Session, old: Workspace) -> AppResult<Workspace> {
    if old.deleted_at.is_none() || !Path::new(&old.work_dir).is_dir() {
        return Ok(old);
    }
    let title = session.title.as_deref().unwrap_or("Untitled session");
    let workspace = store::workspace_insert(
        db, &store::new_id(), &old.project_id, Some(title), "project", &old.work_dir, None, None,
    )?;
    db.execute(
        "UPDATE sessions SET workspace_id = ?2, title = COALESCE(title, ?3), status = 'done',
         hc_terminal = NULL, pinned_tab = 1 WHERE id = ?1",
        rusqlite::params![session.id, workspace.id, title],
    )?;
    db.execute("UPDATE message_fts SET workspace_id = ?2 WHERE session_id = ?1",
        rusqlite::params![session.id, workspace.id])?;
    Ok(workspace)
}

#[tauri::command]
pub async fn claude_open(st: St<'_>, claude_session_id: String, workspace_id: Option<String>) -> AppResult<CreatedWorkspace> {
    let _lifecycle = crate::workspace_terminal::LIFECYCLE.lock().await;
    let state = st.inner().clone();
    tokio::task::spawn_blocking(move || {
        let projects = crate::claude_history::claude_dir().map(|dir| dir.join("projects"));
        import_claude(&state, &claude_session_id, workspace_id.as_deref(), projects.as_deref())
    }).await.map_err(|e| AppError::new("claude_import_failed", e.to_string()))?
}

fn import_claude(
    st: &AppState, id: &str, workspace_id: Option<&str>, projects: Option<&Path>,
) -> AppResult<CreatedWorkspace> {
    let existing = {
        let db = st.db.lock();
        let linked = store::session_all(&db)?.into_iter()
            .filter(|s| s.engine == "claude" && s.engine_session_id.as_deref() == Some(id));
        let mut matches = linked.map(|s| store::workspace_get(&db, &s.workspace_id).map(|w| (s, w)))
            .collect::<AppResult<Vec<_>>>()?;
        matches.sort_by_key(|(_, ws)| (Some(ws.id.as_str()) != workspace_id, ws.deleted_at.is_some()));
        matches.into_iter().next()
    };
    if let Some((session, old)) = existing {
        let mut db = st.db.lock();
        let tx = db.transaction()?;
        let workspace = rehome_session(&tx, &session, old)?;
        let session = store::session_get(&tx, &session.id)?;
        tx.commit()?;
        return Ok(CreatedWorkspace { workspace, session });
    }
    let path = projects.and_then(|dir| crate::claude_history::session_path(dir, id))
        .ok_or_else(|| AppError::new("claude_transcript_missing", "Claude Code transcript not found"))?;
    let hit = crate::claude_history::details(&path)
        .ok_or_else(|| AppError::new("claude_transcript_empty", "The Claude Code transcript has no conversation"))?;
    let unknown_folder = st.data_dir.join("missing-claude-working-folder");
    let cwd = hit.cwd.as_deref().filter(|cwd| Path::new(cwd).is_absolute());
    let unknown_folder = unknown_folder.to_string_lossy();
    let work_dir = cwd.unwrap_or(&unknown_folder);
    let title = hit.title.as_deref().unwrap_or("Claude conversation");

    let mut db = st.db.lock();
    let tx = db.transaction()?;
    let locations = store::workspace_list(&tx, None, true)?;
    let workspace = locations.iter()
        .find(|ws| Some(ws.id.as_str()) == workspace_id && ws.deleted_at.is_none() && ws.work_dir == work_dir);
    let workspace = match workspace {
        Some(ws) => ws.clone(),
        None => {
            let matching_project = locations.iter().find(|ws| ws.work_dir == work_dir).map(|ws| &ws.project_id);
            let project = match store::project_list(&tx)?.into_iter()
                .find(|p| p.path == work_dir || Some(&p.id) == matching_project) {
                Some(project) => project,
                None => {
                    let name = cwd.map(|cwd| Path::new(cwd).file_name().and_then(|n| n.to_str()).unwrap_or(cwd))
                        .unwrap_or("Claude Code (unknown folder)");
                    store::project_add(&tx, name, work_dir)?
                }
            };
            store::workspace_insert(&tx, &store::new_id(), &project.id, Some(title), "project", work_dir, None, None)?
        }
    };
    let session = store::session_insert(&tx, &workspace.id, "claude", store::DEFAULT_MODE, Some(title))?;
    let dir = st.session_dir(&session.id);
    let saved = (|| -> AppResult<Session> {
        store::session_set_field(&tx, &session.id, "engine_session_id", Some(id))?;
        store::session_set_status(&tx, &session.id, "done")?;
        if hit.updated_at > 0 {
            tx.execute("UPDATE sessions SET updated_at = ?2 WHERE id = ?1", rusqlite::params![session.id, hit.updated_at])?;
        }
        let session = store::session_get(&tx, &session.id)?;
        std::fs::create_dir_all(&dir)?;
        let mut events = std::io::BufWriter::new(std::fs::File::create(dir.join("events.ndjson"))?);
        crate::claude_history::import_messages(&path, &mut events)?;
        std::io::Write::flush(&mut events)?;
        std::fs::write(dir.join("meta.json"), json!({"engine_session_id": id}).to_string())?;
        tx.commit()?;
        Ok(session)
    })();
    drop(db);
    match saved {
        Ok(session) => {
            agent::backfill_session_index(st, &session);
            Ok(CreatedWorkspace { workspace, session })
        }
        Err(error) => {
            let _ = std::fs::remove_dir_all(dir);
            Err(error)
        }
    }
}

#[tauri::command]
pub async fn codex_threads(st: St<'_>, workspace_id: String) -> AppResult<Value> {
    let ws = store::workspace_get(&st.db.lock(), &workspace_id)?;
    agent::codex_probe(&st, &ws.work_dir, "list", None).await
}

#[tauri::command]
pub async fn codex_open(st: St<'_>, workspace_id: String, thread_id: String) -> AppResult<Session> {
    let _lifecycle = crate::workspace_terminal::LIFECYCLE.lock().await;
    let ws = store::workspace_get(&st.db.lock(), &workspace_id)?;
    if ws.deleted_at.is_some() {
        return Err(AppError::new("workspace_deleted", "This workspace was deleted"));
    }
    // Reuse the link before consulting Codex so its running session can be reopened.
    let linked = |db: &rusqlite::Connection| -> AppResult<Option<Session>> {
        let existing = store::session_all(db)?.into_iter().find(|session| {
            session.engine == "codex" && session.engine_session_id.as_deref() == Some(thread_id.as_str())
        });
        match existing {
            Some(session) if session.workspace_id != ws.id => {
                Err(AppError::new("codex_already_linked", "This Codex conversation is linked to another workspace. Open it there."))
            }
            session => Ok(session),
        }
    };
    if let Some(session) = linked(&st.db.lock())? {
        return Ok(session);
    }
    let thread = agent::codex_probe(&st, &ws.work_dir, "read", Some(&thread_id)).await?;
    let session = {
        let db = st.db.lock();
        if let Some(session) = linked(&db)? {
            return Ok(session);
        }
        let session = store::session_insert(&db, &ws.id, "codex", "ask", thread["name"].as_str())?;
        let save = (|| -> AppResult<()> {
            let dir = st.session_dir(&session.id);
            std::fs::create_dir_all(&dir)?;
            std::fs::write(dir.join("meta.json"), json!({ "engine_session_id": thread_id }).to_string())?;
            store::session_set_field(&db, &session.id, "engine_session_id", Some(&thread_id))?;
            Ok(())
        })();
        if let Err(error) = save {
            let _ = db.execute("DELETE FROM sessions WHERE id = ?1", [&session.id]);
            return Err(error);
        }
        session
    };
    if let Err(error) = agent::spawn_sidecar(&st, &session, &ws).await {
        let _ = st.db.lock().execute("DELETE FROM sessions WHERE id = ?1", [&session.id]);
        return Err(error);
    }
    store::session_get(&st.db.lock(), &session.id)
}

#[tauri::command]
pub fn search(
    st: St<'_>, query: String, workspace_id: Option<String>, project_id: Option<String>,
) -> AppResult<Vec<SearchHit>> {
    store::search_sessions(&st.db.lock(), &query, project_id.as_deref(), workspace_id.as_deref(), 50)
}

#[cfg(test)]
mod retained_session_tests {
    use super::*;

    #[test]
    fn imports_a_standalone_claude_session_once_with_history() {
        let root = tempfile::tempdir().unwrap();
        let projects = root.path().join("claude/projects");
        let project_dir = projects.join("source");
        std::fs::create_dir_all(&project_dir).unwrap();
        let id = "01234567-89ab-cdef-0123-456789abcdef";
        let prompt = json!({"type": "user", "cwd": root.path(), "message": {"content": "Keep this prompt"}});
        let source = project_dir.join(format!("{id}.jsonl"));
        std::fs::write(&source, prompt.to_string()).unwrap();
        let db_path = root.path().join("db.sqlite");
        let open_app = || AppState::new(
            Box::new(|_, _| {}), store::open(&db_path).unwrap(), root.path().join("app"), None, None, "sidecar".into(),
        );
        let state = open_app();
        let opened = import_claude(&state, id, None, Some(&projects)).unwrap();
        assert_eq!(opened.workspace.name.as_deref(), Some("Keep this prompt"));
        assert_eq!(opened.session.status, "done");
        assert_eq!(opened.session.updated_at, crate::claude_history::details(&source).unwrap().updated_at);
        assert_eq!(opened.session.engine_session_id.as_deref(), Some(id));
        let events = std::fs::read_to_string(state.session_dir(&opened.session.id).join("events.ndjson")).unwrap();
        assert!(events.contains("Keep this prompt"));
        drop(state);
        let reopened = import_claude(&open_app(), id, None, Some(&projects)).unwrap();
        assert_eq!(std::fs::read_to_string(source).unwrap(), prompt.to_string());
        assert_eq!(reopened.session.hc_terminal, None);
        assert_eq!(reopened.session.id, opened.session.id);
        assert_eq!(reopened.workspace.id, opened.workspace.id);
    }

    #[test]
    fn opens_cli_history_without_a_working_folder() {
        let root = tempfile::tempdir().unwrap();
        let project = root.path().join("projects/source");
        std::fs::create_dir_all(&project).unwrap();
        let id = "fedcba98-7654-3210-fedc-ba9876543210";
        let transcript = br#"{"type":"assistant","message":{"id":"reply","content":"Saved reply"}}"#;
        std::fs::write(project.join(format!("{id}.jsonl")), transcript).unwrap();
        let state = AppState::new(
            Box::new(|_, _| {}), store::open_memory().unwrap(), root.path().join("app"), None, None, "sidecar".into(),
        );
        let replay = import_claude(&state, id, None, Some(&root.path().join("projects"))).unwrap();
        assert_eq!(replay.session.status, "done");
        assert!(replay.session.hc_terminal.is_none());
        assert!(!Path::new(&replay.workspace.work_dir).exists());
        let events = std::fs::read_to_string(state.session_dir(&replay.session.id).join("events.ndjson")).unwrap();
        assert!(events.contains("Saved reply"));
    }

    #[test]
    fn stored_history_includes_untitled_and_archived_sessions_and_searches_content() {
        let db = store::open_memory().unwrap();
        let project = store::project_add(&db, "Project", "/fixture").unwrap();
        let active = store::workspace_insert(&db, "active", &project.id, None, "project", "/fixture", None, None).unwrap();
        let archived = store::workspace_insert(&db, "archived", &project.id, None, "worktree", "/fixture2", None, None).unwrap();
        store::workspace_set_archived(&db, &archived.id, true, None).unwrap();
        let current = store::session_insert(&db, &active.id, "codex", "ask", None).unwrap();
        let old = store::session_insert(&db, &archived.id, "claude", "ask", Some("Archived conversation")).unwrap();
        store::index_messages(&db, &[store::IndexItem {
            session_id: &old.id, workspace_id: &archived.id, project_id: &project.id,
            seq: 1, role: "user", text: "A searchable historical message",
        }], &old.id, 1).unwrap();

        let scoped = stored_history(&db, "", Some(&active.id)).unwrap();
        assert_eq!(scoped.len(), 1);
        assert_eq!(scoped[0].session.id, current.id);
        assert_eq!(scoped[0].session.title, None);
        assert_eq!(stored_history(&db, "", None).unwrap().len(), 2);
        assert!(stored_history(&db, "historical", Some(&active.id)).unwrap().is_empty());
        assert!(stored_history(&db, "historical", None).unwrap()[0].snippet.as_deref().unwrap().contains("[[historical]]"));
        assert_eq!(stored_history(&db, "archived", None).unwrap()[0].session.id, old.id);
    }

    #[test]
    #[ignore = "run explicitly to measure search latency on 1,000 stored and CLI sessions"]
    fn history_search_latency_on_two_sources() {
        let root = tempfile::tempdir().unwrap();
        let db = store::open_memory().unwrap();
        let project = store::project_add(&db, "Project", "/fixture").unwrap();
        let workspace = store::workspace_insert(&db, "workspace", &project.id, None, "project", "/fixture", None, None).unwrap();
        let transcript_dir = root.path().join("projects/fixture");
        std::fs::create_dir_all(&transcript_dir).unwrap();
        for i in 0..500 {
            let text = format!("Review marker{i} {}", "and check this context ".repeat(20));
            let session = store::session_insert(&db, &workspace.id, "codex", "ask", Some("Review")).unwrap();
            store::index_messages(&db, &[store::IndexItem {
                session_id: &session.id, workspace_id: &workspace.id, project_id: &project.id,
                seq: 1, role: "user", text: &text,
            }], &session.id, 1).unwrap();
            let transcript = (0..12).map(|_| json!({"type":"user", "cwd":"/fixture", "message":{"content":text}}).to_string())
                .collect::<Vec<_>>().join("\n");
            std::fs::write(transcript_dir.join(format!("{i:036}.jsonl")), transcript).unwrap();
        }

        let mut elapsed = Vec::new();
        for i in 0..20 {
            let query = format!("marker{}", 480 + i);
            let start = std::time::Instant::now();
            let stored = stored_history(&db, &query, None).unwrap();
            let (cli, partial) = crate::claude_history::search_in(&root.path().join("projects"), &query, usize::MAX, |_| true);
            elapsed.push(start.elapsed());
            assert!(!partial);
            assert_eq!(stored.len(), 1);
            assert!(!cli.is_empty());
        }
        elapsed.sort();
        eprintln!("1,000 historical sessions, 20 queries: p95 {:?} before UI debounce and rendering", elapsed[18]);
        assert!(elapsed[18] < std::time::Duration::from_millis(850));
    }

    #[test]
    fn rehomes_the_same_session_and_moves_its_search_index() {
        let dir = tempfile::tempdir().unwrap();
        let cwd = dir.path().to_str().unwrap();
        let db = store::open_memory().unwrap();
        let project = store::project_add(&db, "Project", cwd).unwrap();
        let old = store::workspace_insert(&db, "old", &project.id, None, "project", cwd, None, None).unwrap();
        let session = store::session_insert(&db, &old.id, "echo", "ask", Some("A conversation")).unwrap();
        store::index_messages(&db, &[store::IndexItem {
            session_id: &session.id, workspace_id: &old.id, project_id: &project.id,
            seq: 1, role: "user", text: "Keep this message",
        }], &session.id, 1).unwrap();

        store::workspace_keep_history(&db, &old.id, false).unwrap();
        let old = store::workspace_get(&db, &old.id).unwrap();
        let workspace = rehome_session(&db, &session, old).unwrap();
        assert_ne!(workspace.id, session.workspace_id);
        assert_eq!(workspace.name.as_deref(), session.title.as_deref());
        let saved = store::session_get(&db, &session.id).unwrap();
        assert_eq!(saved.workspace_id, workspace.id);
        assert_eq!(saved.status, "done");
        assert_eq!(store::search(&db, "message", Some(&workspace.id), 10).unwrap()[0].session_id, session.id);
        assert!(store::search_sessions(&db, "", None, None, 10).unwrap().is_empty());
        assert_eq!(rehome_session(&db, &saved, workspace.clone()).unwrap().id, workspace.id);
    }
}
