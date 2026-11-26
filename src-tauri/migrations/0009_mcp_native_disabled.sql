-- spec 072: MCP servers Claude loads by itself (.mcp.json, ~/.claude.json) that a project turned off.
-- A row means off; no row means on. Keyed by server name because Claude denies servers by name.
CREATE TABLE project_mcp_disabled (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    server_name TEXT NOT NULL,
    PRIMARY KEY (project_id, server_name)
);
