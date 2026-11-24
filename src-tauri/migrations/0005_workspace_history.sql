BEGIN;
ALTER TABLE workspaces ADD COLUMN deleted_at INTEGER;
DROP INDEX workspaces_branch;
CREATE UNIQUE INDEX workspaces_branch ON workspaces(project_id, branch)
  WHERE dir_kind = 'worktree' AND deleted_at IS NULL;
COMMIT;
