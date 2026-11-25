# Implementation Plan: Resizable Git Graph

## Summary

Add a read-only Git history pane below Changes. Reuse the existing horizontal resize handle. Keep the split ratio while the app is open.

## Technical Context

React and TanStack Query render workspace-scoped history from a Tauri command. Rust reads local history via the existing Git CLI integration. No new dependencies or persistent storage.

## Constitution Check

1. Closing the app leaves agent sessions running.
2. Conversation logs are outside this flow.
3. The graph reads Git history without running agent tools or changing workspace data.
4. History is bounded to 200 commits, with separate scrolling and error states.
5. Agent integrations are outside this flow.
6. History follows the selected workspace and its existing working directory.

The design uses shared controls and theme tokens for light and dark themes. App labels and status messages are English.

## Project Structure

- `src-tauri/src/git.rs` reads Git history and `commands.rs` exposes it.
- `src/lib` defines the query, command and types.
- `src/components/panels` owns the split and graph rendering.
- `tests/unit/gitFiles.test.tsx` covers the Git tab integration.

## Complexity Tracking

The graph computes lanes from Git parent IDs using local component data. The split uses existing pointer and keyboard handling. Neither requires additional dependencies or stores.
