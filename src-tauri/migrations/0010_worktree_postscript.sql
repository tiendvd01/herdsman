CREATE TABLE project_postscripts (
    project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    command TEXT NOT NULL
);

CREATE TABLE workspace_postscripts (
    workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed', 'interrupted')),
    stdout TEXT NOT NULL DEFAULT '',
    stderr TEXT NOT NULL DEFAULT '',
    error TEXT
);
