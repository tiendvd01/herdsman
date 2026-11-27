# Implementation Plan — Worktree Postscript

**Branch** — master · **Spec** — [Worktree Postscript](spec.md)

## Summary

Store the project command and workspace run state in SQLite. Start the command after checkout, workspace and initial session creation succeed. Show run state and output in the workspace with project settings in the sidebar menu.

## Technical Context

Rust/Tauri, Tokio and SQLite on the desktop. React, TypeScript and TanStack Query on the frontend. macOS is the primary platform. Reuse the existing process, query and dialog primitives.

## Constitution Check

- I–II. Postscript uses its own process and storage. Agent lifetime and session history stay independent of the app's postscript task.
- III. Only a locally saved user command runs. No repository discovery or agent invocation.
- IV. Run asynchronously and poll only while active. Bound captured output. Verify accessible status labels and shared theme tokens in light and dark mode.
- V. Keep existing engine and hc protocols.
- VI. Configuration belongs to a project and results belong to a workspace.

The design passes the six checks without new dependencies.

## Project Structure

- Backend lifecycle in `src-tauri/src/commands/workspaces.rs` with runner and persistence in `src-tauri/src/worktree_postscript.rs`.
- Schema in `src-tauri/migrations/0010_worktree_postscript.sql`.
- Tauri bindings in `src/lib/api.ts`. Project dialog in `src/components/project/WorktreePostscriptDialog.tsx`. Status in `src/components/workspace/WorktreePostscriptStatus.tsx`.

## Validation

See [quickstart](quickstart.md) for automatic checks and desktop acceptance scenarios.
