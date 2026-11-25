# Git Graph Validation

1. Run `pnpm tauri dev` and select a workspace with a merge commit.
2. Open Git and verify the initial split and both merge connections.
3. Drag the divider up and down, then repeat using the arrow keys. Verify each pane scrolls independently and Changes can still open a diff.
4. Switch to a workspace with a different HEAD. Check that its history replaces the previous history.
5. Check a workspace without Git, a repository without commits and a detached HEAD.

Automated checks use `pnpm test`, `pnpm typecheck` and `cargo test --manifest-path src-tauri/Cargo.toml git::tests`.

Verified with the browser mock in Chrome. The panes started at equal heights, the merge row showed two edges, and dragging changed the pane heights in both directions. Each pane had its own scroll container. Rust tests exercised actual Git repositories and a detached worktree.
