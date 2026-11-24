BEGIN;
CREATE TABLE sessions_new (
  id                 TEXT PRIMARY KEY,
  workspace_id       TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  engine             TEXT NOT NULL CHECK (engine IN ('claude', 'codex', 'echo')),
  account_id         TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  hc_terminal        TEXT,
  title              TEXT,
  status             TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'working', 'blocked', 'done', 'error')),
  permission_mode    TEXT NOT NULL DEFAULT 'auto' CHECK (permission_mode IN ('ask', 'accept_edits', 'auto', 'bypass') OR (engine = 'codex' AND permission_mode = 'custom')),
  model              TEXT,
  engine_session_id  TEXT,
  last_seen_seq      INTEGER NOT NULL DEFAULT 0,
  indexed_seq        INTEGER NOT NULL DEFAULT 0,
  pinned_tab         INTEGER NOT NULL DEFAULT 1,
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL,
  ended_at           INTEGER
);
INSERT INTO sessions_new SELECT id, workspace_id, engine, account_id, hc_terminal, title, status, permission_mode, model,
  engine_session_id, last_seen_seq, indexed_seq, pinned_tab, created_at, updated_at, ended_at FROM sessions;
DROP TABLE sessions;
ALTER TABLE sessions_new RENAME TO sessions;
CREATE INDEX sessions_workspace ON sessions(workspace_id, updated_at DESC);
COMMIT;
