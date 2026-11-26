//! spec 071: MCP servers managed by Herdsman, enabled per project and handed to new Claude sessions.
//! spec 072: servers Claude loads by itself can be turned off per project; the session gets their
//! names as a deny list (`mcp-denied.json`), so no Claude config file is ever edited.
//!
//! Definitions live in SQLite; env and header values live in the Keychain (`secrets.rs`). At launch
//! the selected servers are written to a 0600 file in the session folder that the sidecar reads and
//! deletes right away, so secrets never travel through argv (visible in `hc ls`) or logs.
use crate::{
    error::{AppError, AppResult},
    secrets::SecretStore,
    state::AppState,
    store,
};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
    sync::Arc,
};

const SELECTION: &str = "mcp-selection.json";
const LAUNCH: &str = "mcp-servers.json";
const DENIED: &str = "mcp-denied.json";
const NATIVE_CONFLICT: &str = "Claude already loads a server with this name";

#[derive(Clone, Debug)]
struct Server {
    id: String,
    name: String,
    transport: String,
    command: Option<String>,
    args: Vec<String>,
    url: Option<String>,
    env_keys: Vec<String>,
    header_keys: Vec<String>,
}

#[derive(Serialize)]
pub struct KeyState {
    key: String,
    set: bool,
}

#[derive(Serialize)]
pub struct ServerView {
    id: String,
    name: String,
    transport: String,
    command: Option<String>,
    args: Vec<String>,
    url: Option<String>,
    env: Vec<KeyState>,
    headers: Vec<KeyState>,
    enabled: bool,
    conflict: Option<String>,
}

#[derive(Clone, Serialize, Debug, PartialEq)]
pub struct NativeServer {
    name: String,
    transport: String,
    scope: String,
    source: String,
    enabled: bool,
}

#[derive(Serialize)]
pub struct Catalog {
    servers: Vec<ServerView>,
    native: Vec<NativeServer>,
}

#[derive(Deserialize, Clone)]
pub struct KeyInput {
    key: String,
    #[serde(default)]
    value: Option<String>,
}

#[derive(Deserialize, Clone)]
pub struct ServerInput {
    #[serde(default)]
    id: Option<String>,
    name: String,
    transport: String,
    #[serde(default)]
    command: Option<String>,
    #[serde(default)]
    args: Vec<String>,
    #[serde(default)]
    url: Option<String>,
    #[serde(default)]
    env: Vec<KeyInput>,
    #[serde(default)]
    headers: Vec<KeyInput>,
}

#[derive(Serialize)]
pub struct RemoveImpact {
    affected_projects: Vec<String>,
}

fn invalid(message: impl Into<String>) -> AppError {
    AppError::new("mcp_invalid", message)
}

fn account(id: &str, kind: &str, key: &str) -> String {
    format!("{id}/{kind}/{key}")
}

fn valid_name(name: &str) -> bool {
    (1..=64).contains(&name.len()) && name.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}

/// Checks the input and returns it with fields that do not apply to its transport cleared.
fn validate(mut input: ServerInput, existing: Option<&Server>) -> AppResult<ServerInput> {
    input.name = input.name.trim().to_owned();
    if !valid_name(&input.name) {
        return Err(invalid("Name must be 1-64 letters, digits, - or _"));
    }
    match input.transport.as_str() {
        "stdio" => {
            let command = input.command.as_deref().map(str::trim).unwrap_or_default();
            if command.is_empty() {
                return Err(invalid("Command is required"));
            }
            input.command = Some(command.to_owned());
            input.url = None;
            input.headers.clear();
        }
        "http" | "sse" => {
            let url = input.url.as_deref().map(str::trim).unwrap_or_default();
            if !(url.starts_with("http://") || url.starts_with("https://")) || url.len() <= "https://".len() {
                return Err(invalid("URL must start with http:// or https://"));
            }
            input.url = Some(url.to_owned());
            input.command = None;
            input.args.clear();
            input.env.clear();
        }
        _ => return Err(invalid("Transport must be stdio, http or sse")),
    }
    for (kind, label, rows, known) in [
        ("env", "Environment variable", &mut input.env, existing.map(|s| &s.env_keys)),
        ("header", "Header", &mut input.headers, existing.map(|s| &s.header_keys)),
    ] {
        let mut seen = HashSet::new();
        for row in rows.iter_mut() {
            row.key = row.key.trim().to_owned();
            if row.key.is_empty() || row.key.contains('/') {
                return Err(invalid(format!("{label} names must not be empty")));
            }
            let lower = if kind == "header" { row.key.to_ascii_lowercase() } else { row.key.clone() };
            if !seen.insert(lower) {
                return Err(invalid(format!("{label} {} is listed twice", row.key)));
            }
            let has_value = row.value.as_deref().is_some_and(|v| !v.is_empty());
            if !has_value && !known.is_some_and(|keys| keys.contains(&row.key)) {
                return Err(invalid(format!("Enter a value for {}", row.key)));
            }
        }
    }
    Ok(input)
}

fn row_to_server(row: &rusqlite::Row) -> rusqlite::Result<Server> {
    let list = |i: usize| -> rusqlite::Result<Vec<String>> {
        let raw: String = row.get(i)?;
        Ok(serde_json::from_str(&raw).unwrap_or_default())
    };
    Ok(Server {
        id: row.get(0)?,
        name: row.get(1)?,
        transport: row.get(2)?,
        command: row.get(3)?,
        args: list(4)?,
        url: row.get(5)?,
        env_keys: list(6)?,
        header_keys: list(7)?,
    })
}

const COLUMNS: &str = "id, name, transport, command, args, url, env_keys, header_keys";

fn all_servers(db: &Connection) -> AppResult<Vec<Server>> {
    let mut stmt = db.prepare(&format!("SELECT {COLUMNS} FROM mcp_servers ORDER BY name COLLATE NOCASE"))?;
    let rows = stmt.query_map([], row_to_server)?.collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

fn server_get(db: &Connection, id: &str) -> AppResult<Option<Server>> {
    Ok(db
        .query_row(&format!("SELECT {COLUMNS} FROM mcp_servers WHERE id=?1"), [id], row_to_server)
        .optional()?)
}

fn enabled_ids(db: &Connection, project_id: &str) -> AppResult<HashSet<String>> {
    let mut stmt = db.prepare("SELECT server_id FROM project_mcp_servers WHERE project_id=?1")?;
    let ids = stmt.query_map([project_id], |row| row.get(0))?.collect::<Result<HashSet<String>, _>>()?;
    Ok(ids)
}

fn disabled_names(db: &Connection, project_id: &str) -> AppResult<Vec<String>> {
    let mut stmt = db.prepare("SELECT server_name FROM project_mcp_disabled WHERE project_id=?1 ORDER BY server_name")?;
    let names = stmt.query_map([project_id], |row| row.get(0))?.collect::<Result<Vec<String>, _>>()?;
    Ok(names)
}

fn claude_json() -> Option<PathBuf> {
    std::env::var_os("CLAUDE_CONFIG_DIR")
        .map(|dir| PathBuf::from(dir).join(".claude.json"))
        .or_else(|| std::env::var_os("HOME").map(|home| PathBuf::from(home).join(".claude.json")))
}

fn read_json(path: &Path) -> Option<Value> {
    serde_json::from_str(&fs::read_to_string(path).ok()?).ok()
}

fn collect(into: &mut Vec<NativeServer>, servers: Option<&Value>, scope: &str, source: &Path) {
    let Some(map) = servers.and_then(Value::as_object) else { return };
    for (name, config) in map {
        let transport = config
            .get("type")
            .and_then(Value::as_str)
            .unwrap_or(if config.get("url").is_some() { "http" } else { "stdio" });
        into.push(NativeServer {
            name: name.clone(),
            transport: transport.to_owned(),
            scope: scope.to_owned(),
            source: source.to_string_lossy().into_owned(),
            enabled: true,
        });
    }
}

/// MCP servers Claude loads by itself for `cwd`: the repo's `.mcp.json` and `~/.claude.json`
/// (local and user scope). Only names and transports are read, never env or header values.
fn native_servers(cwd: &Path, claude_json: Option<&Path>) -> Vec<NativeServer> {
    let root = crate::project_skills::git_path(cwd, "--show-toplevel").unwrap_or_else(|| cwd.to_path_buf());
    let mut out = Vec::new();
    let project_file = root.join(".mcp.json");
    if let Some(value) = read_json(&project_file) {
        collect(&mut out, value.get("mcpServers"), "project", &project_file);
    }
    if let Some(path) = claude_json {
        if let Some(value) = read_json(path) {
            let projects = value.get("projects");
            let mut keys = vec![root.to_string_lossy().into_owned()];
            let cwd_key = cwd.to_string_lossy().into_owned();
            if !keys.contains(&cwd_key) {
                keys.push(cwd_key);
            }
            for key in keys {
                collect(&mut out, projects.and_then(|p| p.get(&key)).and_then(|p| p.get("mcpServers")), "local", path);
            }
            collect(&mut out, value.get("mcpServers"), "user", path);
        }
    }
    let mut seen = HashSet::new();
    out.retain(|server| seen.insert((server.name.clone(), server.scope.clone())));
    out
}

fn view(server: Server, enabled: bool, native: &HashSet<&str>) -> ServerView {
    let keys = |keys: Vec<String>| keys.into_iter().map(|key| KeyState { key, set: true }).collect();
    ServerView {
        conflict: native.contains(server.name.as_str()).then(|| NATIVE_CONFLICT.to_owned()),
        id: server.id,
        name: server.name,
        transport: server.transport,
        command: server.command,
        args: server.args,
        url: server.url,
        env: keys(server.env_keys),
        headers: keys(server.header_keys),
        enabled,
    }
}

async fn blocking<T: Send + 'static>(run: impl FnOnce() -> AppResult<T> + Send + 'static) -> AppResult<T> {
    tokio::task::spawn_blocking(run)
        .await
        .map_err(|_| AppError::new("mcp", "Could not update MCP servers"))?
}

#[tauri::command]
pub async fn mcp_catalog(st: tauri::State<'_, Arc<AppState>>, project_id: String) -> AppResult<Catalog> {
    let (project, servers, enabled, disabled) = {
        let db = st.db.lock();
        let project = store::project_get(&db, &project_id)?;
        (project, all_servers(&db)?, enabled_ids(&db, &project_id)?, disabled_names(&db, &project_id)?)
    };
    let mut native = blocking(move || Ok(native_servers(Path::new(&project.path), claude_json().as_deref()))).await?;
    for server in &mut native {
        server.enabled = !disabled.contains(&server.name);
    }
    let names: HashSet<&str> = native.iter().map(|server| server.name.as_str()).collect();
    let servers = servers
        .into_iter()
        .map(|server| {
            let on = enabled.contains(&server.id);
            view(server, on, &names)
        })
        .collect();
    Ok(Catalog { servers, native })
}

fn save(db: &Connection, secrets: &dyn SecretStore, input: ServerInput) -> AppResult<String> {
    let existing = match &input.id {
        Some(id) => Some(server_get(db, id)?.ok_or_else(|| AppError::new("not_found", "This MCP server was removed"))?),
        None => None,
    };
    let input = validate(input, existing.as_ref())?;
    let id = existing.as_ref().map(|s| s.id.clone()).unwrap_or_else(|| ulid::Ulid::new().to_string().to_lowercase());
    let taken: Option<String> = db
        .query_row("SELECT id FROM mcp_servers WHERE name=?1 AND id<>?2", params![input.name, id], |row| row.get(0))
        .optional()?;
    if taken.is_some() {
        return Err(AppError::new("mcp_duplicate", format!("An MCP server named {} already exists", input.name)));
    }
    for (kind, rows) in [("env", &input.env), ("header", &input.headers)] {
        for row in rows {
            if let Some(value) = row.value.as_deref().filter(|v| !v.is_empty()) {
                secrets.set(&account(&id, kind, &row.key), value)?;
            }
        }
    }
    let env_keys: Vec<&str> = input.env.iter().map(|row| row.key.as_str()).collect();
    let header_keys: Vec<&str> = input.headers.iter().map(|row| row.key.as_str()).collect();
    let now = store::now_ms();
    db.execute(
        "INSERT INTO mcp_servers (id, name, transport, command, args, url, env_keys, header_keys, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)
         ON CONFLICT(id) DO UPDATE SET name=excluded.name, transport=excluded.transport, command=excluded.command,
           args=excluded.args, url=excluded.url, env_keys=excluded.env_keys, header_keys=excluded.header_keys,
           updated_at=excluded.updated_at",
        params![
            id,
            input.name,
            input.transport,
            input.command,
            serde_json::to_string(&input.args)?,
            input.url,
            serde_json::to_string(&env_keys)?,
            serde_json::to_string(&header_keys)?,
            now,
        ],
    )?;
    if let Some(old) = existing {
        for (kind, old_keys, new_keys) in [("env", &old.env_keys, &env_keys), ("header", &old.header_keys, &header_keys)] {
            for key in old_keys.iter().filter(|key| !new_keys.contains(&key.as_str())) {
                let _ = secrets.delete(&account(&id, kind, key));
            }
        }
    }
    Ok(id)
}

#[tauri::command]
pub async fn mcp_server_save(st: tauri::State<'_, Arc<AppState>>, server: ServerInput) -> AppResult<String> {
    let st = st.inner().clone();
    blocking(move || save(&st.db.lock(), &*st.secrets, server)).await
}

fn remove(db: &Connection, secrets: &dyn SecretStore, id: &str, dry_run: bool) -> AppResult<RemoveImpact> {
    let server = server_get(db, id)?.ok_or_else(|| AppError::new("not_found", "This MCP server was removed"))?;
    let mut stmt = db.prepare(
        "SELECT p.name FROM project_mcp_servers m JOIN projects p ON p.id = m.project_id
         WHERE m.server_id=?1 ORDER BY p.name COLLATE NOCASE",
    )?;
    let affected_projects = stmt.query_map([id], |row| row.get(0))?.collect::<Result<Vec<String>, _>>()?;
    if !dry_run {
        db.execute("DELETE FROM mcp_servers WHERE id=?1", [id])?;
        for (kind, keys) in [("env", &server.env_keys), ("header", &server.header_keys)] {
            for key in keys {
                let _ = secrets.delete(&account(id, kind, key));
            }
        }
    }
    Ok(RemoveImpact { affected_projects })
}

#[tauri::command]
pub async fn mcp_server_remove(
    st: tauri::State<'_, Arc<AppState>>,
    id: String,
    dry_run: bool,
) -> AppResult<RemoveImpact> {
    let st = st.inner().clone();
    blocking(move || remove(&st.db.lock(), &*st.secrets, &id, dry_run)).await
}

fn toggle(db: &Connection, project_id: &str, server_id: &str, enabled: bool) -> AppResult<()> {
    store::project_get(db, project_id)?;
    if server_get(db, server_id)?.is_none() {
        return Err(AppError::new("not_found", "This MCP server was removed"));
    }
    if enabled {
        db.execute(
            "INSERT OR IGNORE INTO project_mcp_servers (project_id, server_id) VALUES (?1, ?2)",
            [project_id, server_id],
        )?;
    } else {
        db.execute(
            "DELETE FROM project_mcp_servers WHERE project_id=?1 AND server_id=?2",
            [project_id, server_id],
        )?;
    }
    Ok(())
}

#[tauri::command]
pub async fn mcp_project_toggle(
    st: tauri::State<'_, Arc<AppState>>,
    project_id: String,
    server_id: String,
    enabled: bool,
) -> AppResult<()> {
    toggle(&st.db.lock(), &project_id, &server_id, enabled)
}

fn native_toggle(db: &Connection, project_id: &str, name: &str, enabled: bool) -> AppResult<()> {
    store::project_get(db, project_id)?;
    if !valid_name(name) {
        return Err(invalid("Name must be 1-64 letters, digits, - or _"));
    }
    if enabled {
        db.execute("DELETE FROM project_mcp_disabled WHERE project_id=?1 AND server_name=?2", [project_id, name])?;
    } else {
        db.execute(
            "INSERT OR IGNORE INTO project_mcp_disabled (project_id, server_name) VALUES (?1, ?2)",
            [project_id, name],
        )?;
    }
    Ok(())
}

/// spec 072: turns a server Claude loads by itself on or off for one project. Only Herdsman's
/// database changes; `.mcp.json` and `~/.claude.json` stay as they are.
#[tauri::command]
pub async fn mcp_native_toggle(
    st: tauri::State<'_, Arc<AppState>>,
    project_id: String,
    name: String,
    enabled: bool,
) -> AppResult<()> {
    native_toggle(&st.db.lock(), &project_id, &name, enabled)
}

pub fn denied_path(session_dir: &Path) -> PathBuf {
    session_dir.join(DENIED)
}

pub fn launch_path(session_dir: &Path) -> PathBuf {
    session_dir.join(LAUNCH)
}

/// Selection made when the session is created (`fresh`), or the one saved then (resume).
fn launch_servers(
    db: &Connection,
    project_id: &str,
    session: &Path,
    native: &HashSet<String>,
    fresh: bool,
    warnings: &mut Vec<String>,
) -> AppResult<Vec<Server>> {
    if fresh {
        let enabled = enabled_ids(db, project_id)?;
        let mut keep = Vec::new();
        for server in all_servers(db)?.into_iter().filter(|s| enabled.contains(&s.id)) {
            if native.contains(&server.name) {
                warnings.push(format!("{}: Claude already loads an MCP server with this name", server.name));
            } else {
                keep.push(server);
            }
        }
        if !keep.is_empty() {
            fs::create_dir_all(session)?;
            let ids: Vec<&str> = keep.iter().map(|s| s.id.as_str()).collect();
            fs::write(session.join(SELECTION), serde_json::to_string(&ids)?)?;
        }
        return Ok(keep);
    }
    let Ok(raw) = fs::read_to_string(session.join(SELECTION)) else { return Ok(Vec::new()) };
    let ids: Vec<String> = serde_json::from_str(&raw).unwrap_or_default();
    let mut out = Vec::new();
    for id in ids {
        match server_get(db, &id)? {
            Some(server) => out.push(server),
            None => warnings.push("An MCP server chosen for this session was removed".into()),
        }
    }
    Ok(out)
}

fn launch_config(servers: &[Server], secrets: &dyn SecretStore, warnings: &mut Vec<String>) -> Map<String, Value> {
    let mut out = Map::new();
    'server: for server in servers {
        let mut values = [Map::new(), Map::new()];
        for (slot, kind, keys) in [(0, "env", &server.env_keys), (1, "header", &server.header_keys)] {
            for key in keys {
                match secrets.get(&account(&server.id, kind, key)) {
                    Ok(Some(value)) => {
                        values[slot].insert(key.clone(), Value::String(value));
                    }
                    Ok(None) => {
                        warnings.push(format!("{}: missing value for {key}", server.name));
                        continue 'server;
                    }
                    Err(error) => {
                        warnings.push(format!("{}: {}", server.name, error.message));
                        continue 'server;
                    }
                }
            }
        }
        let [env, headers] = values;
        let config = match server.transport.as_str() {
            "stdio" => json!({ "type": "stdio", "command": server.command, "args": server.args, "env": env }),
            transport => json!({ "type": transport, "url": server.url, "headers": headers }),
        };
        out.insert(server.name.clone(), config);
    }
    out
}

fn write_private(path: &Path, contents: &str) -> AppResult<()> {
    use std::io::Write;
    let mut options = fs::OpenOptions::new();
    options.write(true).create(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    options.open(path)?.write_all(contents.as_bytes())?;
    Ok(())
}

fn prepare_in(
    db: &Connection,
    secrets: &dyn SecretStore,
    project_id: &str,
    work_dir: &Path,
    session: &Path,
    fresh: bool,
    claude_json: Option<&Path>,
) -> AppResult<Vec<String>> {
    let file = launch_path(session);
    let _ = fs::remove_file(&file);
    let mut warnings = Vec::new();
    let native: HashSet<String> = if fresh {
        native_servers(work_dir, claude_json).into_iter().map(|s| s.name).collect()
    } else {
        HashSet::new()
    };
    if fresh {
        // Kept for resume, like the selection; names are not secret, so the sidecar never deletes it.
        let denied = denied_path(session);
        let names = disabled_names(db, project_id)?;
        if names.is_empty() {
            let _ = fs::remove_file(&denied);
        } else {
            fs::create_dir_all(session)?;
            fs::write(&denied, serde_json::to_string(&names)?)?;
        }
    }
    let servers = launch_servers(db, project_id, session, &native, fresh, &mut warnings)?;
    let config = launch_config(&servers, secrets, &mut warnings);
    if !config.is_empty() {
        write_private(&file, &Value::Object(config).to_string())?;
    }
    Ok(warnings)
}

/// Writes the MCP launch file for a Claude session. Never fails the launch: problems come back as
/// warnings, which never contain secret values.
pub fn prepare_launch(st: &AppState, ws: &store::Workspace, sid: &str, fresh: bool) -> Vec<String> {
    let result = prepare_in(
        &st.db.lock(),
        &*st.secrets,
        &ws.project_id,
        Path::new(&ws.work_dir),
        &st.session_dir(sid),
        fresh,
        claude_json().as_deref(),
    );
    result.unwrap_or_else(|error| vec![format!("Could not attach MCP servers: {}", error.message)])
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::secrets::MemorySecrets;

    fn input(name: &str, transport: &str) -> ServerInput {
        ServerInput {
            id: None,
            name: name.into(),
            transport: transport.into(),
            command: Some("npx".into()),
            args: vec!["-y".into(), "server".into()],
            url: Some("https://example.test/mcp".into()),
            env: vec![],
            headers: vec![],
        }
    }

    fn key(key: &str, value: Option<&str>) -> KeyInput {
        KeyInput { key: key.into(), value: value.map(Into::into) }
    }

    fn db_with_project(dir: &Path) -> (Connection, String) {
        let db = store::open(&dir.join("herdsman.db")).unwrap();
        let project = dir.join("project");
        fs::create_dir_all(&project).unwrap();
        let id = store::project_add(&db, "project", project.to_str().unwrap()).unwrap().id;
        (db, id)
    }

    #[test]
    fn validation_rejects_bad_definitions() {
        assert!(validate(input("a b", "stdio"), None).is_err());
        let mut no_command = input("ok", "stdio");
        no_command.command = Some("  ".into());
        assert_eq!(validate(no_command, None).err().unwrap().code, "mcp_invalid");
        let mut ftp = input("ok", "http");
        ftp.url = Some("ftp://example.test".into());
        assert!(validate(ftp, None).is_err());
        let mut missing = input("ok", "stdio");
        missing.env = vec![key("TOKEN", None)];
        assert!(validate(missing, None).err().unwrap().message.contains("TOKEN"));
        let http = validate(input("ok", "http"), None).unwrap();
        assert!(http.command.is_none() && http.args.is_empty());
    }

    #[test]
    fn secrets_stay_out_of_the_database_and_launch_uses_them() {
        let temp = tempfile::tempdir().unwrap();
        let (db, project) = db_with_project(temp.path());
        let secrets = MemorySecrets::default();
        let mut server = input("tools", "stdio");
        server.env = vec![key("API_TOKEN", Some("s3cr3t-value"))];
        let id = save(&db, &secrets, server.clone()).unwrap();
        assert_eq!(save(&db, &secrets, server).unwrap_err().code, "mcp_duplicate");
        let dump: String = db
            .query_row("SELECT env_keys || args || name FROM mcp_servers WHERE id=?1", [&id], |r| r.get(0))
            .unwrap();
        assert!(!dump.contains("s3cr3t"));
        toggle(&db, &project, &id, true).unwrap();

        let session = temp.path().join("session");
        let work = temp.path().join("project");
        let warnings = prepare_in(&db, &secrets, &project, &work, &session, true, None).unwrap();
        assert!(warnings.is_empty(), "{warnings:?}");
        let file = launch_path(&session);
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            assert_eq!(fs::metadata(&file).unwrap().permissions().mode() & 0o777, 0o600);
        }
        let launched: Value = serde_json::from_str(&fs::read_to_string(&file).unwrap()).unwrap();
        assert_eq!(launched["tools"]["command"], "npx");
        assert_eq!(launched["tools"]["env"]["API_TOKEN"], "s3cr3t-value");

        // Editing with an empty value keeps the stored secret.
        let mut edit = input("tools", "stdio");
        edit.id = Some(id.clone());
        edit.command = Some("node".into());
        edit.env = vec![key("API_TOKEN", Some(""))];
        save(&db, &secrets, edit).unwrap();
        fs::remove_file(&file).unwrap();
        prepare_in(&db, &secrets, &project, &work, &session, false, None).unwrap();
        let resumed: Value = serde_json::from_str(&fs::read_to_string(&file).unwrap()).unwrap();
        assert_eq!(resumed["tools"]["command"], "node");
        assert_eq!(resumed["tools"]["env"]["API_TOKEN"], "s3cr3t-value");

        // Removing lists the project, deletes the secret, and resume warns without failing.
        assert_eq!(remove(&db, &secrets, &id, true).unwrap().affected_projects, vec!["project".to_string()]);
        assert_eq!(secrets.len(), 1);
        remove(&db, &secrets, &id, false).unwrap();
        assert_eq!(secrets.len(), 0);
        let warnings = prepare_in(&db, &secrets, &project, &work, &session, false, None).unwrap();
        assert_eq!(warnings.len(), 1);
        assert!(!launch_path(&session).exists());
    }

    #[test]
    fn disabled_native_servers_reach_new_sessions_and_survive_resume() {
        let temp = tempfile::tempdir().unwrap();
        let (db, project) = db_with_project(temp.path());
        let secrets = MemorySecrets::default();
        let work = temp.path().join("project");
        let session = temp.path().join("session");

        assert_eq!(native_toggle(&db, &project, "bad name", false).unwrap_err().code, "mcp_invalid");
        assert_eq!(native_toggle(&db, "missing", "codegraph", false).unwrap_err().code, "not_found");
        prepare_in(&db, &secrets, &project, &work, &session, true, None).unwrap();
        assert!(!denied_path(&session).exists());

        native_toggle(&db, &project, "codegraph", false).unwrap();
        native_toggle(&db, &project, "codegraph", false).unwrap();
        native_toggle(&db, &project, "alpha", false).unwrap();
        assert_eq!(disabled_names(&db, &project).unwrap(), vec!["alpha", "codegraph"]);
        prepare_in(&db, &secrets, &project, &work, &session, true, None).unwrap();
        let read = || -> Vec<String> { serde_json::from_str(&fs::read_to_string(denied_path(&session)).unwrap()).unwrap() };
        assert_eq!(read(), vec!["alpha", "codegraph"]);

        // Resume keeps what the session was created with, whatever the project says now.
        native_toggle(&db, &project, "codegraph", true).unwrap();
        native_toggle(&db, &project, "codegraph", true).unwrap();
        prepare_in(&db, &secrets, &project, &work, &session, false, None).unwrap();
        assert_eq!(read(), vec!["alpha", "codegraph"]);

        native_toggle(&db, &project, "alpha", true).unwrap();
        prepare_in(&db, &secrets, &project, &work, &session, true, None).unwrap();
        assert!(!denied_path(&session).exists());
    }

    #[test]
    fn native_servers_win_over_herdsman_servers_with_the_same_name() {
        let temp = tempfile::tempdir().unwrap();
        let (db, project) = db_with_project(temp.path());
        let work = temp.path().join("project");
        fs::write(work.join(".mcp.json"), r#"{"mcpServers":{"tools":{"command":"x","env":{"K":"v"}}}}"#).unwrap();
        let claude = temp.path().join(".claude.json");
        fs::write(&claude, r#"{"mcpServers":{"remote":{"type":"http","url":"https://x"}}}"#).unwrap();
        let native = native_servers(&work, Some(&claude));
        assert_eq!(native.len(), 2);
        assert_eq!((native[0].scope.as_str(), native[0].transport.as_str()), ("project", "stdio"));
        assert_eq!((native[1].scope.as_str(), native[1].transport.as_str()), ("user", "http"));

        let secrets = MemorySecrets::default();
        let id = save(&db, &secrets, input("tools", "stdio")).unwrap();
        toggle(&db, &project, &id, true).unwrap();
        let session = temp.path().join("session");
        let warnings = prepare_in(&db, &secrets, &project, &work, &session, true, Some(&claude)).unwrap();
        assert_eq!(warnings.len(), 1);
        assert!(warnings[0].starts_with("tools:"));
        assert!(!launch_path(&session).exists());
    }
}
