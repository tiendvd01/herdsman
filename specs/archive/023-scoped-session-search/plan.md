# Implementation Plan — Scoped session search

**Branch** master  
**Spec** [Feature specification](spec.md)

## Summary

Extend the existing command menu with session scopes and five category filters. Search managed session metadata and indexed conversation text alongside existing Claude history.

## Technical Context

React and TypeScript command dialog, TanStack Query, Zustand navigation and Tauri commands backed by Rust and SQLite FTS5. No new runtime dependency or migration. Verification uses Vitest and Cargo on macOS.

## Constitution Check

- I–II. Search reads the existing store and transcripts. Closing the app leaves agents and event logs intact.
- III. Commands call existing actions with their existing confirmation and permission behavior.
- IV. Cancel pending debounce timers and only display search data for the active query key. Render results as text.
- V. Managed results are engine-independent. Existing legacy Claude history lookup and opening remain available.
- VI. Scope follows Project → Workspace → Session. Archived workspaces can be opened from search while remaining outside the sidebar.

The checks also apply to the final design. The feature uses existing state and indexing.

## Project Structure

- `src-tauri/src/{store,commands,claude_history}.rs` provide scope-aware search and legacy mapping.
- `src/components/command/CommandDialog.tsx` presents scopes, results, and category navigation.
- `src/lib/{api,types,devMock}.ts` share the client contract.
- `src/components/layout/WorkspaceView.tsx` resolves archived destinations.
- `src/stores/useUiStore.ts` tracks recently visited workspaces.
