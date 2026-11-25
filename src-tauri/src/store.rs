//! SQLite: projects, workspaces, sessions, settings, chỉ mục tìm kiếm (data-model.md).
use crate::error::{AppError, AppResult};
use rusqlite::{params, Connection, OptionalExtension, Row};
use serde::Serialize;
use std::path::Path;

pub const DEFAULT_MODE: &str = "auto";

const MIGRATIONS: &[&str] = &[
    include_str!("../migrations/0001_init.sql"),
    include_str!("../migrations/0002_auto_mode.sql"),
    include_str!("../migrations/0003_drop_issue_ref.sql"),
    include_str!("../migrations/0004_codex_custom_mode.sql"),
    include_str!("../migrations/0005_workspace_history.sql"),
    include_str!("../migrations/0006_project_skills.sql"),
    include_str!("../migrations/0007_removed_projects.sql"),
];

pub fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

pub fn new_id() -> String {
    ulid::Ulid::new().to_string().to_lowercase()
}

pub fn open(path: &Path) -> AppResult<Connection> {
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let conn = Connection::open(path)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    migrate(&conn)?;
    Ok(conn)
}

pub fn open_memory() -> AppResult<Connection> {
    let conn = Connection::open_in_memory()?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    migrate(&conn)?;
    Ok(conn)
}

fn migrate(conn: &Connection) -> AppResult<()> {
    let version: usize = conn.pragma_query_value(None, "user_version", |r| r.get(0))?;
    for (i, sql) in MIGRATIONS.iter().enumerate().skip(version) {
        conn.execute_batch(sql)?;
        conn.pragma_update(None, "user_version", i + 1)?;
    }
    Ok(())
}

// ───────────────────────────── Project ─────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub sort: i64,
    pub created_at: i64,
    pub missing: bool,
}

fn project_row(r: &Row) -> rusqlite::Result<Project> {
    let path: String = r.get(2)?;
    Ok(Project {
        id: r.get(0)?,
        name: r.get(1)?,
        missing: !Path::new(&path).is_dir(),
        path,
        sort: r.get(3)?,
        created_at: r.get(4)?,
    })
}

pub fn project_list(c: &Connection) -> AppResult<Vec<Project>> {
    let mut st = c.prepare("SELECT id, name, path, sort, created_at FROM projects WHERE removed_at IS NULL ORDER BY sort, created_at")?;
    let rows = st.query_map([], project_row)?.collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

pub fn project_get(c: &Connection, id: &str) -> AppResult<Project> {
    Ok(c.query_row("SELECT id, name, path, sort, created_at FROM projects WHERE id = ?1", [id], project_row)?)
}

pub fn project_add(c: &Connection, name: &str, path: &str) -> AppResult<Project> {
    let existing: Option<(String, bool)> = c.query_row(
        "SELECT id, removed_at IS NOT NULL FROM projects WHERE path = ?1",
        [path],
        |r| Ok((r.get(0)?, r.get(1)?)),
    ).optional()?;
    if let Some((id, removed)) = existing {
        if removed {
            c.execute("UPDATE projects SET removed_at = NULL WHERE id = ?1", [&id])?;
            return project_get(c, &id);
        }
        return Err(AppError::new("already_exists", "This folder is already a project"));
    }
    let id = new_id();
    let sort: i64 = c.query_row("SELECT COALESCE(MAX(sort), 0) + 1 FROM projects", [], |r| r.get(0))?;
    c.execute(
        "INSERT INTO projects (id, name, path, sort, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, name, path, sort, now_ms()],
    )?;
    project_get(c, &id)
}

pub fn project_rename(c: &Connection, id: &str, name: &str) -> AppResult<Project> {
    c.execute("UPDATE projects SET name = ?2 WHERE id = ?1", params![id, name])?;
    project_get(c, id)
}

pub fn project_delete(c: &Connection, id: &str) -> AppResult<()> {
    c.execute("UPDATE projects SET removed_at = ?2 WHERE id = ?1", params![id, now_ms()])?;
    Ok(())
}

// ───────────────────────────── Workspace ─────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct Workspace {
    pub id: String,
    pub project_id: String,
    pub name: Option<String>,
    pub dir_kind: String,
    pub work_dir: String,
    pub branch: Option<String>,
    pub base_branch: Option<String>,
    pub archived_at: Option<i64>,
    pub deleted_at: Option<i64>,
    pub worktree_removed: bool,
    pub created_at: i64,
}

const WS_COLS: &str = "id, project_id, name, dir_kind, work_dir, branch, base_branch, archived_at, worktree_removed, created_at, deleted_at";

fn ws_row(r: &Row) -> rusqlite::Result<Workspace> {
    Ok(Workspace {
        id: r.get(0)?,
        project_id: r.get(1)?,
        name: r.get(2)?,
        dir_kind: r.get(3)?,
        work_dir: r.get(4)?,
        branch: r.get(5)?,
        base_branch: r.get(6)?,
        archived_at: r.get(7)?,
        worktree_removed: r.get::<_, i64>(8)? != 0,
        created_at: r.get(9)?,
        deleted_at: r.get(10)?,
    })
}

pub fn workspace_list(c: &Connection, project_id: Option<&str>, include_archived: bool) -> AppResult<Vec<Workspace>> {
    let sql = format!(
        "SELECT {WS_COLS} FROM workspaces WHERE project_id IN (SELECT id FROM projects WHERE removed_at IS NULL) AND (?1 IS NULL OR project_id = ?1) AND (?2 OR archived_at IS NULL) ORDER BY created_at DESC"
    );
    let mut st = c.prepare(&sql)?;
    let rows = st.query_map(params![project_id, include_archived], ws_row)?.collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

pub fn workspace_get(c: &Connection, id: &str) -> AppResult<Workspace> {
    Ok(c.query_row(&format!("SELECT {WS_COLS} FROM workspaces WHERE id = ?1"), [id], ws_row)?)
}

#[allow(clippy::too_many_arguments)]
pub fn workspace_insert(
    c: &Connection,
    id: &str,
    project_id: &str,
    name: Option<&str>,
    dir_kind: &str,
    work_dir: &str,
    branch: Option<&str>,
    base_branch: Option<&str>,
) -> AppResult<Workspace> {
    c.execute(
        "INSERT INTO workspaces (id, project_id, name, dir_kind, work_dir, branch, base_branch, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![id, project_id, name, dir_kind, work_dir, branch, base_branch, now_ms()],
    )?;
    workspace_get(c, id)
}

pub fn workspace_rename(c: &Connection, id: &str, name: &str) -> AppResult<Workspace> {
    c.execute("UPDATE workspaces SET name = ?2 WHERE id = ?1", params![id, name])?;
    workspace_get(c, id)
}

pub fn workspace_set_archived(c: &Connection, id: &str, archived: bool, worktree_removed: Option<bool>) -> AppResult<Workspace> {
    let at = if archived { Some(now_ms()) } else { None };
    if !archived && workspace_get(c, id)?.deleted_at.is_some() {
        return Err(AppError::new("workspace_deleted", "This workspace was deleted"));
    }
    c.execute("UPDATE workspaces SET archived_at = ?2 WHERE id = ?1", params![id, at])?;
    if let Some(r) = worktree_removed {
        c.execute("UPDATE workspaces SET worktree_removed = ?2 WHERE id = ?1", params![id, r as i64])?;
    }
    workspace_get(c, id)
}

pub fn workspace_keep_history(c: &Connection, id: &str, removed_worktree: bool) -> AppResult<()> {
    c.execute(
        "UPDATE workspaces SET archived_at = COALESCE(archived_at, ?2), deleted_at = COALESCE(deleted_at, ?2),
         worktree_removed = worktree_removed OR ?3 WHERE id = ?1",
        params![id, now_ms(), removed_worktree],
    )?;
    Ok(())
}

pub fn discard_failed_workspace(c: &Connection, id: &str) -> AppResult<()> {
    c.execute("DELETE FROM message_fts WHERE workspace_id = ?1", [id])?;
    c.execute("DELETE FROM workspaces WHERE id = ?1", [id])?;
    Ok(())
}

// ───────────────────────────── Session ─────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct Session {
    pub id: String,
    pub workspace_id: String,
    pub engine: String,
    pub hc_terminal: Option<String>,
    pub title: Option<String>,
    pub status: String,
    pub permission_mode: String,
    pub model: Option<String>,
    pub engine_session_id: Option<String>,
    pub last_seen_seq: i64,
    pub indexed_seq: i64,
    pub pinned_tab: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub ended_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completion_seq: Option<u64>,
}

const S_COLS: &str = "id, workspace_id, engine, hc_terminal, title, status, permission_mode, model, engine_session_id, last_seen_seq, indexed_seq, pinned_tab, created_at, updated_at, ended_at";

fn s_row(r: &Row) -> rusqlite::Result<Session> {
    Ok(Session {
        id: r.get(0)?,
        workspace_id: r.get(1)?,
        engine: r.get(2)?,
        hc_terminal: r.get(3)?,
        title: r.get(4)?,
        status: r.get(5)?,
        permission_mode: r.get(6)?,
        model: r.get(7)?,
        engine_session_id: r.get(8)?,
        last_seen_seq: r.get(9)?,
        indexed_seq: r.get(10)?,
        pinned_tab: r.get::<_, i64>(11)? != 0,
        created_at: r.get(12)?,
        updated_at: r.get(13)?,
        ended_at: r.get(14)?,
        completion_seq: None,
    })
}

pub fn session_insert(c: &Connection, workspace_id: &str, engine: &str, mode: &str, title: Option<&str>) -> AppResult<Session> {
    insert_session(c, workspace_id, engine, mode, title, None)
}

pub fn new_conversation_insert(c: &Connection, workspace_id: &str, engine: &str, mode: Option<&str>, title: Option<&str>) -> AppResult<Session> {
    let (preferred_mode, model) = match engine {
        "claude" | "codex" => (
            setting_get(c, &format!("{engine}_permission_mode_preference"))?,
            setting_get(c, &format!("{engine}_model_preference"))?,
        ),
        _ => (None, None),
    };
    let mode = mode.or(preferred_mode.as_deref()).unwrap_or(DEFAULT_MODE);
    insert_session(c, workspace_id, engine, mode, title, model.as_deref())
}

fn insert_session(c: &Connection, workspace_id: &str, engine: &str, mode: &str, title: Option<&str>, model: Option<&str>) -> AppResult<Session> {
    let id = new_id();
    let now = now_ms();
    c.execute(
        "INSERT INTO sessions (id, workspace_id, engine, permission_mode, title, model, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)",
        params![id, workspace_id, engine, mode, title, model, now],
    )?;
    session_get(c, &id)
}

pub fn session_get(c: &Connection, id: &str) -> AppResult<Session> {
    Ok(c.query_row(&format!("SELECT {S_COLS} FROM sessions WHERE id = ?1"), [id], s_row)?)
}

pub fn session_list(c: &Connection, workspace_id: &str) -> AppResult<Vec<Session>> {
    let mut st = c.prepare(&format!("SELECT {S_COLS} FROM sessions WHERE workspace_id = ?1 ORDER BY updated_at DESC"))?;
    let rows = st.query_map([workspace_id], s_row)?.collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

pub fn session_all(c: &Connection) -> AppResult<Vec<Session>> {
    let mut st = c.prepare(&format!("SELECT {S_COLS} FROM sessions"))?;
    let rows = st.query_map([], s_row)?.collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

pub fn fill_conversation_title(c: &mut Connection, id: &str, workspace_id: &str, title: &str) -> AppResult<bool> {
    let tx = c.transaction()?;
    let changed = tx.execute("UPDATE sessions SET title = ?2 WHERE id = ?1 AND title IS NULL", params![id, title])?;
    if changed > 0 {
        tx.execute("UPDATE workspaces SET name = ?2 WHERE id = ?1 AND name IS NULL", params![workspace_id, title])?;
    }
    tx.commit()?;
    Ok(changed > 0)
}

pub fn session_set_terminal(c: &Connection, id: &str, terminal: Option<&str>) -> AppResult<()> {
    c.execute("UPDATE sessions SET hc_terminal = ?2, updated_at = ?3 WHERE id = ?1", params![id, terminal, now_ms()])?;
    Ok(())
}

/// Cập nhật trạng thái; trả về true nếu có thay đổi.
pub fn session_set_status(c: &Connection, id: &str, status: &str) -> AppResult<bool> {
    let ended = if status == "done" { Some(now_ms()) } else { None };
    let n = c.execute(
        "UPDATE sessions SET status = ?2, updated_at = ?3, ended_at = COALESCE(?4, CASE WHEN ?2 = 'done' THEN ended_at ELSE NULL END)
         WHERE id = ?1 AND status != ?2",
        params![id, status, now_ms(), ended],
    )?;
    Ok(n > 0)
}

pub fn session_set_field(c: &Connection, id: &str, field: &str, value: Option<&str>) -> AppResult<()> {
    let col = match field {
        "title" | "permission_mode" | "model" | "engine_session_id" => field,
        _ => return Err(AppError::new("bad_field", field.to_string())),
    };
    c.execute(&format!("UPDATE sessions SET {col} = ?2 WHERE id = ?1"), params![id, value])?;
    Ok(())
}

pub fn session_confirm_model(c: &Connection, id: &str, model: &str) -> AppResult<()> {
    confirm_session_preference(c, id, "model", model)
}

pub fn session_confirm_permission_mode(c: &Connection, id: &str, mode: &str) -> AppResult<()> {
    confirm_session_preference(c, id, "permission_mode", mode)
}

fn confirm_session_preference(c: &Connection, id: &str, field: &str, value: &str) -> AppResult<()> {
    let tx = c.unchecked_transaction()?;
    let session = session_get(&tx, id)?;
    session_set_field(&tx, id, field, Some(value))?;
    if matches!(session.engine.as_str(), "claude" | "codex") {
        setting_set(&tx, &format!("{}_{field}_preference", session.engine), value)?;
    }
    tx.commit()?;
    Ok(())
}

pub fn session_set_pinned(c: &Connection, id: &str, pinned: bool) -> AppResult<()> {
    c.execute("UPDATE sessions SET pinned_tab = ?2 WHERE id = ?1", params![id, pinned as i64])?;
    Ok(())
}

pub fn session_set_seen(c: &Connection, id: &str, seq: i64) -> AppResult<()> {
    c.execute("UPDATE sessions SET last_seen_seq = MAX(last_seen_seq, ?2) WHERE id = ?1", params![id, seq])?;
    Ok(())
}

pub fn session_touch(c: &Connection, id: &str) -> AppResult<()> {
    c.execute("UPDATE sessions SET updated_at = ?2 WHERE id = ?1", params![id, now_ms()])?;
    Ok(())
}

// ───────────────────────────── Tìm kiếm (FTS5) ─────────────────────────────

pub struct IndexItem<'a> {
    pub session_id: &'a str,
    pub workspace_id: &'a str,
    pub project_id: &'a str,
    pub seq: i64,
    pub role: &'a str,
    pub text: &'a str,
}

/// FTS5 `remove_diacritics` không coi `đ` là `d` có dấu: chuẩn hoá tay cho tiếng Việt.
pub fn fold_vi(s: &str) -> String {
    s.replace(['đ', 'Đ'], "d")
}

pub fn index_messages(c: &Connection, items: &[IndexItem], session_id: &str, upto_seq: i64) -> AppResult<()> {
    let tx = c.unchecked_transaction()?;
    {
        let mut st = tx.prepare("INSERT INTO message_fts (session_id, workspace_id, project_id, seq, role, text) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")?;
        for it in items {
            st.execute(params![it.session_id, it.workspace_id, it.project_id, it.seq, it.role, fold_vi(it.text)])?;
        }
    }
    tx.execute("UPDATE sessions SET indexed_seq = MAX(indexed_seq, ?2) WHERE id = ?1", params![session_id, upto_seq])?;
    tx.commit()?;
    Ok(())
}

#[derive(Debug, Clone, Serialize)]
pub struct SearchHit {
    pub session_id: String,
    pub seq: i64,
    pub snippet: String,
    pub workspace_id: String,
    pub workspace_name: Option<String>,
    pub workspace_archived: bool,
    pub project_id: String,
    pub project_name: String,
    pub session_title: Option<String>,
    pub engine_session_id: Option<String>,
}

/// Biến chuỗi người dùng gõ thành truy vấn FTS5 an toàn: mỗi từ thành một cụm trong ngoặc kép.
pub fn fts_query(input: &str) -> Option<String> {
    let input = fold_vi(input);
    let terms: Vec<String> = input
        .split_whitespace()
        .map(|t| t.replace('"', ""))
        .filter(|t| !t.is_empty())
        .map(|t| format!("\"{t}\""))
        .collect();
    if terms.is_empty() {
        None
    } else {
        Some(terms.join(" "))
    }
}

pub fn search(c: &Connection, query: &str, workspace_id: Option<&str>, limit: i64) -> AppResult<Vec<SearchHit>> {
    search_sessions(c, query, None, workspace_id, limit)
}

pub fn search_sessions(
    c: &Connection, query: &str, project_id: Option<&str>, workspace_id: Option<&str>, limit: i64,
) -> AppResult<Vec<SearchHit>> {
    let browsing = query.trim().is_empty();
    if browsing && workspace_id.is_some() {
        return Ok(vec![]);
    }
    let Some(q) = fts_query(query).or_else(|| browsing.then(|| r#""""#.to_owned())) else { return Ok(vec![]) };
    let mut st = c.prepare(
        "WITH matches AS MATERIALIZED (
             SELECT session_id, seq, snippet(message_fts, 5, '[[', ']]', '…', 12) AS excerpt, rank
             FROM message_fts
             WHERE message_fts MATCH ?1 AND (?2 IS NULL OR project_id = ?2) AND (?3 IS NULL OR workspace_id = ?3)
         ), best AS (
             SELECT session_id, seq, excerpt, MIN(rank) AS score FROM matches GROUP BY session_id
         )
         SELECT s.id, best.seq, best.excerpt,
                w.id, w.name, w.archived_at IS NOT NULL, p.id, p.name, s.title,
                CASE WHEN s.engine = 'claude' THEN s.engine_session_id END
         FROM sessions s
         JOIN workspaces w ON w.id = s.workspace_id
         JOIN projects p ON p.id = w.project_id
         LEFT JOIN best ON best.session_id = s.id
         WHERE p.removed_at IS NULL AND (?2 IS NULL OR p.id = ?2) AND (?3 IS NULL OR w.id = ?3)
           AND (NOT ?4 OR w.deleted_at IS NOT NULL)
         ORDER BY best.score IS NULL, best.score, s.updated_at DESC, s.id",
    )?;
    let terms: Vec<_> = query.split_whitespace().map(str::to_lowercase).collect();
    let mut rows = st.query(params![q, project_id, workspace_id, browsing])?;
    let mut hits = Vec::new();
    while (hits.len() as i64) < limit {
        let Some(r) = rows.next()? else { break };
        let title: Option<String> = r.get(8)?;
        let snippet: Option<String> = r.get(2)?;
        if !browsing && snippet.is_none() && !title.as_deref().is_some_and(|title| {
            let title = title.to_lowercase();
            terms.iter().all(|term| title.contains(term))
        }) {
            continue;
        }
        hits.push(SearchHit {
            session_id: r.get(0)?,
            seq: r.get::<_, String>(1).map(|s| s.parse().unwrap_or(0))
                .or_else(|_| r.get::<_, Option<i64>>(1).map(|seq| seq.unwrap_or(0)))?,
            snippet: snippet.unwrap_or_default(),
            workspace_id: r.get(3)?,
            workspace_name: r.get(4)?,
            workspace_archived: r.get(5)?,
            project_id: r.get(6)?,
            project_name: r.get(7)?,
            session_title: title,
            engine_session_id: r.get(9)?,
        });
    }
    Ok(hits)
}

// ───────────────────────────── Settings ─────────────────────────────

pub fn setting_get(c: &Connection, key: &str) -> AppResult<Option<String>> {
    Ok(c.query_row("SELECT value FROM settings WHERE key = ?1", [key], |r| r.get(0)).optional()?)
}

pub fn setting_set(c: &Connection, key: &str, value: &str) -> AppResult<()> {
    c.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn seed(c: &Connection) -> (Project, Workspace, Session) {
        let dir = std::env::temp_dir();
        let p = project_add(c, "demo", dir.to_str().unwrap()).unwrap();
        let w = workspace_insert(c, &new_id(), &p.id, None, "project", &p.path, None, None).unwrap();
        let s = session_insert(c, &w.id, "echo", "ask", None).unwrap();
        (p, w, s)
    }

    #[test]
    fn project_path_unique() {
        let c = open_memory().unwrap();
        seed(&c);
        let err = project_add(&c, "again", std::env::temp_dir().to_str().unwrap()).unwrap_err();
        assert_eq!(err.code, "already_exists");
    }

    #[test]
    fn removing_and_readding_project_preserves_workspaces_and_sessions() {
        let c = open_memory().unwrap();
        let (project, workspace, session) = seed(&c);
        session_set_status(&c, &session.id, "working").unwrap();

        project_delete(&c, &project.id).unwrap();
        assert!(project_list(&c).unwrap().is_empty());
        assert!(workspace_list(&c, Some(&project.id), true).unwrap().is_empty());

        let restored = project_add(&c, &project.name, &project.path).unwrap();
        assert_eq!(restored.id, project.id);
        assert_eq!(workspace_list(&c, Some(&restored.id), true).unwrap()[0].id, workspace.id);
        assert_eq!(session_get(&c, &session.id).unwrap().status, "working");
    }

    #[test]
    fn session_defaults_and_status() {
        let c = open_memory().unwrap();
        let (_, _, s) = seed(&c);
        assert_eq!(s.permission_mode, "ask");
        assert_eq!(s.status, "idle");
        assert!(session_set_status(&c, &s.id, "working").unwrap());
        assert!(!session_set_status(&c, &s.id, "working").unwrap());
        assert!(session_set_status(&c, &s.id, "done").unwrap());
        assert!(session_get(&c, &s.id).unwrap().ended_at.is_some());
    }

    #[test]
    fn engine_preferences_survive_reopen_and_only_seed_new_conversations() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("preferences.sqlite");
        let c = open(&path).unwrap();
        let (_, w, echo) = seed(&c);
        let claude = new_conversation_insert(&c, &w.id, "claude", None, None).unwrap();
        let codex = new_conversation_insert(&c, &w.id, "codex", None, None).unwrap();
        assert_eq!(claude.permission_mode, "auto");
        assert!(claude.model.is_none());

        session_confirm_model(&c, &claude.id, "sonnet").unwrap();
        session_confirm_permission_mode(&c, &claude.id, "bypass").unwrap();
        let first = new_conversation_insert(&c, &w.id, "claude", None, Some("First")).unwrap();
        assert_eq!(first.model.as_deref(), Some("sonnet"));
        assert_eq!(first.permission_mode, "bypass");
        session_confirm_model(&c, &claude.id, "opus").unwrap();
        session_confirm_model(&c, &codex.id, "gpt-codex").unwrap();
        session_confirm_permission_mode(&c, &codex.id, "custom").unwrap();
        session_confirm_model(&c, &echo.id, "echo-large").unwrap();
        // Engine-reported values are session-local.
        session_set_field(&c, &first.id, "model", Some("claude-sonnet")).unwrap();
        session_set_field(&c, &first.id, "permission_mode", Some("auto")).unwrap();
        drop(c);

        let c = open(&path).unwrap();
        let project_dir = dir.path().join("second-project");
        std::fs::create_dir(&project_dir).unwrap();
        let p = project_add(&c, "second", project_dir.to_str().unwrap()).unwrap();
        let second_workspace = workspace_insert(&c, &new_id(), &p.id, None, "project", &p.path, None, None).unwrap();
        let later = new_conversation_insert(&c, &second_workspace.id, "claude", None, None).unwrap();
        assert_eq!(later.model.as_deref(), Some("opus"));
        assert_eq!(later.permission_mode, "bypass");
        assert_eq!(session_get(&c, &first.id).unwrap().model.as_deref(), Some("claude-sonnet"));

        let later_codex = new_conversation_insert(&c, &second_workspace.id, "codex", None, None).unwrap();
        assert_eq!(later_codex.model.as_deref(), Some("gpt-codex"));
        assert_eq!(later_codex.permission_mode, "custom");
        let explicit = new_conversation_insert(&c, &w.id, "codex", Some("ask"), None).unwrap();
        assert_eq!(explicit.permission_mode, "ask");
        let other = new_conversation_insert(&c, &w.id, "echo", None, None).unwrap();
        assert_eq!(other.permission_mode, "auto");
        assert!(other.model.is_none());
        let imported = session_insert(&c, &w.id, "claude", "ask", None).unwrap();
        assert_eq!(imported.permission_mode, "ask");
        assert!(imported.model.is_none());
    }

    #[test]
    fn named_session_persists_after_reopening_database() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("sessions.sqlite");
        let c = open(&path).unwrap();
        let (_, w, original) = seed(&c);
        let title = "Sửa bộ lọc";
        let named = session_insert(&c, &w.id, "echo", "ask", Some(title)).unwrap();
        let duplicate = session_insert(&c, &w.id, "echo", "ask", Some(title)).unwrap();
        drop(c);

        let reopened = open(&path).unwrap();
        assert_eq!(session_get(&reopened, &named.id).unwrap().title.as_deref(), Some(title));
        assert_eq!(session_get(&reopened, &duplicate.id).unwrap().title.as_deref(), Some(title));
        assert!(session_get(&reopened, &original.id).unwrap().title.is_none());
    }

    #[test]
    fn search_scopes_and_archive() {
        let c = open_memory().unwrap();
        let (p, w, s) = seed(&c);
        index_messages(
            &c,
            &[IndexItem { session_id: &s.id, workspace_id: &w.id, project_id: &p.id, seq: 3, role: "user", text: "Vẽ sơ đồ đăng nhập OAuth" }],
            &s.id,
            3,
        )
        .unwrap();
        assert_eq!(search(&c, "đăng nhập", Some(&w.id), 10).unwrap().len(), 1);
        assert_eq!(search(&c, "dang nhap", None, 10).unwrap().len(), 1, "bỏ dấu vẫn tìm được");
        assert_eq!(search(&c, "đăng nhập", Some("other"), 10).unwrap().len(), 0);
        workspace_set_archived(&c, &w.id, true, None).unwrap();
        let hits = search(&c, "OAuth", None, 10).unwrap();
        assert_eq!(hits.len(), 1, "workspace đã archive vẫn tìm thấy");
        assert!(hits[0].workspace_archived);
        workspace_keep_history(&c, &w.id, false).unwrap();
        assert!(workspace_list(&c, Some(&p.id), false).unwrap().is_empty());
        assert_eq!(search(&c, "OAuth", None, 10).unwrap()[0].session_id, s.id);
        assert!(workspace_set_archived(&c, &w.id, false, None).is_err());
        assert_eq!(search_sessions(&c, "", Some(&p.id), None, 10).unwrap()[0].session_id, s.id);
        assert!(search_sessions(&c, "", None, Some(&w.id), 10).unwrap().is_empty());
        assert_eq!(session_all(&c).unwrap().len(), 1);
    }

    #[test]
    fn keeping_deleted_history_releases_the_worktree_branch() {
        let c = open_memory().unwrap();
        let (p, _, _) = seed(&c);
        let insert = |id: &str| workspace_insert(&c, id, &p.id, None, "worktree", &p.path, Some("feature"), None);
        insert("old").unwrap();
        assert!(insert("new").is_err());
        workspace_keep_history(&c, "old", true).unwrap();
        insert("new").unwrap();
        assert!(workspace_get(&c, "old").unwrap().worktree_removed);
    }

    #[test]
    fn session_search_scopes_before_limiting_and_deduplicates_matches() {
        let c = open_memory().unwrap();
        let (p, w, s) = seed(&c);
        let w2 = workspace_insert(&c, "second", &p.id, None, "project", &p.path, None, None).unwrap();
        let s2 = session_insert(&c, &w2.id, "echo", "ask", Some("OAUTH title only")).unwrap();
        let path = tempfile::tempdir().unwrap();
        let other = project_add(&c, "other", path.path().to_str().unwrap()).unwrap();
        let w3 = workspace_insert(&c, "third", &other.id, None, "project", &other.path, None, None).unwrap();
        let s3 = session_insert(&c, &w3.id, "echo", "ask", None).unwrap();
        for (session, ws) in [(&s, &w), (&s3, &w3)] {
            let matches = [1, 2].map(|seq| IndexItem {
                session_id: &session.id, workspace_id: &ws.id, project_id: &ws.project_id,
                seq, role: "user", text: "OAuth in a message",
            });
            index_messages(&c, &matches, &session.id, 2).unwrap();
        }

        let all = search_sessions(&c, "oauth", None, None, 10).unwrap();
        assert_eq!(all.len(), 3);
        assert!(all.iter().any(|hit| hit.session_id == s2.id && hit.snippet.is_empty()));
        let project = search_sessions(&c, "oauth", Some(&p.id), None, 10).unwrap();
        assert_eq!(project.len(), 2);
        assert!(project.iter().all(|hit| hit.project_id == p.id));
        let workspace = search_sessions(&c, "oauth", None, Some(&w2.id), 1).unwrap();
        assert_eq!(workspace.len(), 1);
        assert_eq!(workspace[0].session_id, s2.id);
    }

    #[test]
    #[ignore = "run explicitly to measure search on a seeded dataset"]
    fn session_search_latency_on_1000_sessions() {
        let c = open_memory().unwrap();
        let root = tempfile::tempdir().unwrap();
        let mut projects = Vec::new();
        for index in 0..3 {
            let path = root.path().join(index.to_string());
            std::fs::create_dir(&path).unwrap();
            let project = project_add(&c, "Fixture", path.to_str().unwrap()).unwrap();
            let workspace = workspace_insert(&c, &new_id(), &project.id, None, "project", &project.path, None, None).unwrap();
            projects.push((project, workspace));
        }
        for index in 0..1_000 {
            let (project, workspace) = &projects[index % projects.len()];
            let title = format!("Title case{index:04}");
            let text = format!("Indexed message case{index:04}");
            let session = session_insert(&c, &workspace.id, "echo", "ask", Some(&title)).unwrap();
            index_messages(&c, &[IndexItem {
                session_id: &session.id, workspace_id: &workspace.id, project_id: &project.id,
                seq: 1, role: "user", text: &text,
            }], &session.id, 1).unwrap();
        }

        let mut durations = Vec::new();
        for index in 0..20 {
            let (project, workspace) = &projects[index % projects.len()];
            let (project_id, workspace_id) = match index % 3 {
                1 => (Some(project.id.as_str()), None),
                2 => (None, Some(workspace.id.as_str())),
                _ => (None, None),
            };
            let (term, expected_hits) = match index % 4 {
                0 => (format!("Title case{index:04}"), 1),
                1 => (format!("message case{index:04}"), 1),
                2 => ("no-such-phrase".to_string(), 0),
                _ => ("indexed".to_string(), 50),
            };
            let start = std::time::Instant::now();
            let results = search_sessions(&c, &term, project_id, workspace_id, 50).unwrap();
            durations.push(start.elapsed());
            assert_eq!(results.len(), expected_hits);
        }
        durations.sort_unstable();
        eprintln!("Managed search, 1,000 sessions: p95 {:?}, max {:?}", durations[18], durations[19]);
        assert!(durations[18] <= std::time::Duration::from_secs(1));
    }

    #[test]
    fn fts_query_escapes() {
        assert_eq!(fts_query("  a \"b\" ").unwrap(), "\"a\" \"b\"");
        assert!(fts_query("   ").is_none());
    }
}
