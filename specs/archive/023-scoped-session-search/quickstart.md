# Validation

Use the app via `pnpm tauri dev` with the project's normal desktop prerequisites. Run `pnpm typecheck`, `pnpm test` and `cargo test --manifest-path src-tauri/Cargo.toml` for automated checks.

- Put a matching session in the current workspace, another workspace in the same project, and a different project. Open ⌘K, search for the term and check 3, 2 and 1 results as scope narrows. Repeat using a title and using message content.
- Archive a workspace with a matching session. Find and open the session via All. Confirm the conversation is visible.
- Visit a workspace, open ⌘K and look for it under Recent workspaces. Check that the five category filters retain search text. Open a matching project, workspace or Appearance item and activate an action via arrow keys and Enter.
- Change queries and scope rapidly, and verify that results match the last selection. While using workspace scope, deselect the workspace. Verify the old session results disappear, the query stays in the field and the search resumes only after choosing an available scope. Check whitespace, no context, no results and Escape.

## Performance and first use

Run the managed search timing check with 1,000 synthetic sessions across three projects.

```sh
cargo test --manifest-path src-tauri/Cargo.toml --lib session_search_latency_on_1000_sessions -- --ignored --nocapture
```

For SC-002, use a test installation with 1,000 sessions across at least three projects. Time 20 separate inputs from the last keypress until the final results or empty state appear. Include title, message and no-match queries, and use all three scopes. At least 19 runs must take no more than 1 second. The managed search timing check measures only the database portion of this flow.

For SC-003, ask 10 first-time testers to find a session in a specified scope and execute one specified command. Record how many complete both tasks without guidance. The target is 9 of 10.

## Implementation verification

- Vitest passed 199 tests, including scope switching, archived result selection, category filtering, keyboard activation and stale-result handling.
- Cargo passed 16 unit tests and 4 integration tests. Scope filtering and deduplication were checked against SQLite.
- The sidecar suite passed 21 tests. The production frontend build passed.
- The interactive desktop walkthrough, the 1,000-session end-to-end timing target and the first-use participant target still require measurement.
