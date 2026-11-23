# Implementation Plan: Duyệt file project

**Feature**: [spec.md](spec.md)

## Summary

Add a Files view to the right panel, file tabs to the main tab bar, and a CodeMirror editor with explicit save. Rename the existing changes panel to Git.

## Technical Context

Rust/Tauri owns filesystem access. React, TanStack Query and TanStack Virtual render the explorer. Zustand holds open tabs and drafts for the current app lifetime. CodeMirror 6 renders and edits UTF-8 text. Existing Git calls remain in place.

## Constitution Check

I–III and V: file operations run on explicit user action and do not modify agents, transcripts, permissions or engine integrations. VI: every operation resolves the registered project directory. IV: directories load on demand and visible rows are virtualized. All application copy is English. No new background process or persistent state. The in-memory store keeps drafts available across workspace and session navigation and supports close confirmation.

## Project Structure

- Backend: `src-tauri/src/project_files.rs`, `commands.rs`, `lib.rs`.
- Frontend: `src/components/files/`, `src/components/layout/`, `src/stores/useFileStore.ts`, `src/lib/api.ts`.
- Git labels: `src/components/panels/RightPanel.tsx`.

## Design Outputs

[Research](research.md) · [Data model](data-model.md) · [UI and IPC contract](contracts/files.md) · [Quickstart](quickstart.md)
