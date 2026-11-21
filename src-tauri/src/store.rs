//! SQLite: projects, workspaces, sessions, settings, chỉ mục tìm kiếm (data-model.md).
use crate::error::{AppError, AppResult};
use rusqlite::{params, Connection, OptionalExtension, Row};
use serde::Serialize;
use std::path::Path;

const MIGRATIONS: &[&str] = &[
    include_str!("../migrations/0001_init.sql"),
    include_str!("../migrations/0002_auto_mode.sql"),
    include_str!("../migrations/0003_drop_issue_ref.sql"),
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
    let mut st = c.prepare("SELECT id, name, path, sort, created_at FROM projects ORDER BY sort, created_at")?;
    let rows = st.query_map([], project_row)?.collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

pub fn project_get(c: &Connection, id: &str) -> AppResult<Project> {
    Ok(c.query_row("SELECT id, name, path, sort, created_at FROM projects WHERE id = ?1", [id], project_row)?)
}

pub fn project_add(c: &Connection, name: &str, path: &str) -> AppResult<Project> {
    let exists: Option<String> = c.query_row("SELECT id FROM projects WHERE path = ?1", [path], |r| r.get(0)).optional()?;
    if exists.is_some() {
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
    c.execute("DELETE FROM message_fts WHERE project_id = ?1", [id])?;
    c.execute("DELETE FROM projects WHERE id = ?1", [id])?;
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
    pub worktree_removed: bool,
    pub created_at: i64,
}

const WS_COLS: &str = "id, project_id, name, dir_kind, work_dir, branch, base_branch, archived_at, worktree_removed, created_at";

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
    })
}

pub fn workspace_list(c: &Connection, project_id: Option<&str>, include_archived: bool) -> AppResult<Vec<Workspace>> {
    let sql = format!(
        "SELECT {WS_COLS} FROM workspaces WHERE (?1 IS NULL OR project_id = ?1) AND (?2 OR archived_at IS NULL) ORDER BY created_at DESC"
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
    c.execute("UPDATE workspaces SET archived_at = ?2 WHERE id = ?1", params![id, at])?;
    if let Some(r) = worktree_removed {
        c.execute("UPDATE workspaces SET worktree_removed = ?2 WHERE id = ?1", params![id, r as i64])?;
    }
    workspace_get(c, id)
}

pub fn workspace_delete(c: &Connection, id: &str) -> AppResult<()> {
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
    })
}

pub fn session_insert(c: &Connection, workspace_id: &str, engine: &str, mode: &str) -> AppResult<Session> {
    let id = new_id();
    let now = now_ms();
    c.execute(
        "INSERT INTO sessions (id, workspace_id, engine, permission_mode, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
        params![id, workspace_id, engine, mode, now],
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
    let Some(q) = fts_query(query) else { return Ok(vec![]) };
    let mut st = c.prepare(
        "SELECT f.session_id, f.seq, snippet(message_fts, 5, '[[', ']]', '…', 12),
                w.id, w.name, w.archived_at IS NOT NULL, p.id, p.name, s.title
         FROM message_fts f
         JOIN sessions s ON s.id = f.session_id
         JOIN workspaces w ON w.id = s.workspace_id
         JOIN projects p ON p.id = w.project_id
         WHERE message_fts MATCH ?1 AND (?2 IS NULL OR f.workspace_id = ?2)
         ORDER BY rank LIMIT ?3",
    )?;
    let rows = st
        .query_map(params![q, workspace_id, limit], |r| {
            Ok(SearchHit {
                session_id: r.get(0)?,
                seq: r.get::<_, String>(1).map(|s| s.parse().unwrap_or(0)).or_else(|_| r.get::<_, i64>(1))?,
                snippet: r.get(2)?,
                workspace_id: r.get(3)?,
                workspace_name: r.get(4)?,
                workspace_archived: r.get(5)?,
                project_id: r.get(6)?,
                project_name: r.get(7)?,
                session_title: r.get(8)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
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
        let s = session_insert(c, &w.id, "echo", "ask").unwrap();
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
        workspace_delete(&c, &w.id).unwrap();
        assert_eq!(search(&c, "OAuth", None, 10).unwrap().len(), 0);
        assert_eq!(session_all(&c).unwrap().len(), 0, "xoá workspace xoá session");
    }

    #[test]
    fn fts_query_escapes() {
        assert_eq!(fts_query("  a \"b\" ").unwrap(), "\"a\" \"b\"");
        assert!(fts_query("   ").is_none());
    }
}
