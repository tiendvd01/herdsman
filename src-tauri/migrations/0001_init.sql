-- Herdsman schema v1 (data-model.md). SQLite là cache/index; nguồn sự thật về tiến trình là hc,
-- về hội thoại là event log của từng session.
PRAGMA foreign_keys = ON;

CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  path        TEXT NOT NULL UNIQUE,
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE TABLE workspaces (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name              TEXT,
  issue_ref         TEXT,
  dir_kind          TEXT NOT NULL CHECK (dir_kind IN ('project', 'worktree')),
  work_dir          TEXT NOT NULL,
  branch            TEXT,
  base_branch       TEXT,
  archived_at       INTEGER,
  worktree_removed  INTEGER NOT NULL DEFAULT 0,
  created_at        INTEGER NOT NULL
);
CREATE UNIQUE INDEX workspaces_branch ON workspaces(project_id, branch) WHERE dir_kind = 'worktree';

CREATE TABLE accounts (
  id            TEXT PRIMARY KEY,
  label         TEXT NOT NULL,
  engine        TEXT NOT NULL,
  config_dir    TEXT NOT NULL,
  uses_api_key  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE sessions (
  id                 TEXT PRIMARY KEY,
  workspace_id       TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  engine             TEXT NOT NULL CHECK (engine IN ('claude', 'codex', 'echo')),
  account_id         TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  hc_terminal        TEXT,
  title              TEXT,
  status             TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'working', 'blocked', 'done', 'error')),
  permission_mode    TEXT NOT NULL DEFAULT 'ask' CHECK (permission_mode IN ('ask', 'accept_edits', 'bypass')),
  model              TEXT,
  engine_session_id  TEXT,
  last_seen_seq      INTEGER NOT NULL DEFAULT 0,
  indexed_seq        INTEGER NOT NULL DEFAULT 0,
  pinned_tab         INTEGER NOT NULL DEFAULT 1,
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL,
  ended_at           INTEGER
);
CREATE INDEX sessions_workspace ON sessions(workspace_id, updated_at DESC);

CREATE TABLE settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);

CREATE VIRTUAL TABLE message_fts USING fts5(
  session_id UNINDEXED,
  workspace_id UNINDEXED,
  project_id UNINDEXED,
  seq UNINDEXED,
  role UNINDEXED,
  text,
  tokenize = 'unicode61 remove_diacritics 2'
);
