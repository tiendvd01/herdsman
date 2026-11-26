# Quickstart — Status bar và terminal nổi

Run `pnpm typecheck`, `pnpm test`, and `cargo test --manifest-path src-tauri/Cargo.toml workspace_terminal::tests`.

1. Open the desktop app and select **Terminal**. Verify the panel stays in the main window and the numbered tabs and **+** button appear in the panel header.
2. Select **+** twice. Run a distinct command in each shell and verify selecting **Terminal 1** or **Terminal 2** shows the corresponding prompt and output.
3. Drag the panel header, hide the panel with **Terminal**, and reopen it. Verify the position and selection persist while the main window is open.
4. Start a delayed command, hide the panel or restart the app, then use the index to recover the shell and its output.
5. Check the status bar in both themes, with the sidebar open and collapsed, and while hc disconnects and reconnects.
