# Implementation Plan — Inspect Commit Changes

## Summary

Expand commit rows inside Git Graph and open an immutable per-file diff in the existing workspace tab strip.

## Technical Context

React handles one expanded row per workspace view. TanStack Query loads the selected commit on demand. Tauri reads Git objects through the existing CLI integration. No storage migration or dependencies are needed.

## Constitution Check

1. Closing the app leaves agents running. An in-flight history read and its transient UI can be discarded.
2. Conversation data is outside the feature.
3. The feature reads Git objects and requires no agent operation.
4. The history limit stays at 200 commits. File details load for the selected row.
5. Agent engine integration is outside the feature.
6. File changes and tabs use the selected workspace.

Reuse shared buttons, file icons, status colors and diff views in Light and Dark. Use English interface copy.

## Project Structure

- `src-tauri/src/git.rs`, `src-tauri/src/commands.rs` and `src-tauri/src/lib.rs` implement and register read-only queries.
- `src/components/panels/GitHistoryRows.tsx` renders expandable rows and the continued graph.
- `src/stores/useFileStore.ts` and `src/components/files/FileChanges.tsx` extend the shared diff tabs.

## Complexity Tracking

Expansion state belongs to the mounted graph. An optional commit identifier extends the existing diff tab identity. One shared Git command configuration keeps listing and patch comparisons aligned.
