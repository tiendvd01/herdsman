# Desktop Contract

- Project options → Worktree Postscript opens the editor for the current Git project. A blank save clears the command.
- `project_postscript_get(projectId)` returns the command or null. `project_postscript_set(projectId, command)` saves or clears it.
- `workspace_postscript_get(workspaceId)` returns null if there is no run or an object with status, stdout, stderr and optional error.
- The workspace renders the outcome as a text status with expandable details. Setup errors and captured output belong to the workspace that ran the command. Each output stream displays up to 64 KiB, with a truncation marker if needed. Output is saved when the command finishes. Checkout removal waits until the active run finishes.
