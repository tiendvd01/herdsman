# Validation

1. Start Herdsman with a running hc 0.1.22 core. In a workspace open the plus menu, dismiss it with Escape, then choose Claude Code.
2. Choose Terminal, run `pwd`, and compare with the workspace working directory. Repeat from a worktree workspace.
3. Start `sleep 60`, switch tabs, return and press Ctrl+C. Run an interactive full-screen program and resize the app.
4. Open two shells. Quit and relaunch Herdsman while both are active. Select the workspace and reconnect to both tabs.
5. Stop one using its tab’s close button once. Check the other still accepts commands. Archive or delete a test workspace and verify its terminals are cleaned up.

## Verification results

- `pnpm test` passed 237 tests. The launcher and existing session-close tests passed again after adding native accessibility activation.
- `cargo test --manifest-path src-tauri/Cargo.toml` passed 33 tests. Two existing benchmarks were ignored. The isolated hc 0.1.22 contract verifies ownership, worktree directory, resize, interrupt, detach, reattach, and stopping one shell independently.
- The production frontend and embedded desktop builds passed. A macOS desktop smoke test opened Terminal from the workspace menu, sent `pwd` through the WebView, restarted the app, selected the same shell, and stopped it from the tab.
