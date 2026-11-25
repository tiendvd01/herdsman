# Data Model

- Workspace identifies its local working directory, including linked worktrees.
- Commit contains a full ID, abbreviated ID, subject and ordered parent IDs.
- History contains commits in topological order and indicates whether older commits were omitted. A null result represents a non-Git workspace.
- The split ratio starts at one half and is constrained by the available height and pane headers.
