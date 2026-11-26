-- spec 071: MCP servers managed by Herdsman, enabled per project. Secret values live in the Keychain.
CREATE TABLE mcp_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    transport TEXT NOT NULL CHECK (transport IN ('stdio', 'http', 'sse')),
    command TEXT,
    args TEXT NOT NULL DEFAULT '[]',
    url TEXT,
    env_keys TEXT NOT NULL DEFAULT '[]',
    header_keys TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE project_mcp_servers (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, server_id)
);
