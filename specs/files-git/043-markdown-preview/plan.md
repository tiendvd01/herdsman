# Implementation Plan: Xem trước và tải tệp Markdown

## Summary

Add source/preview switching and native Markdown copy export to the existing workspace file tab. Use the Rich Conversation Markdown component for formatting and fallback behavior.

## Technical Context

React, TypeScript, CodeMirror, shadcn Button, Tauri/Rust, and the installed dialog plugin and tempfile crate. The file store already owns the on-disk baseline and current draft. Vitest covers the tab and Rust tests cover filesystem behavior. Desktop support follows the existing macOS and Linux targets.

## Constitution Check

- I–III. Preview/export are local file actions. Closing the app during preview leaves existing agent processes, transcript data, reconnect behavior and tool permissions independent of this UI.
- IV. Use the sanitized, themed conversation renderer and its lazy diagrams and charts. Provide source fallback per failing block.
- V–VI. Retain the existing session and workspace structure and command boundaries.
- UI uses existing themed controls and English labels. No additional store, dependency or persistence schema is needed.

## Project Structure

- `src/components/files/FileEditor.tsx` provides controls and renders preview from the draft.
- `src/components/conversation/Markdown.tsx` provides shared rich formatting and fallback.
- `src/lib/api.ts`, `src-tauri/src/commands.rs`, `src-tauri/src/project_files.rs` and `src-tauri/src/lib.rs` connect the user-initiated export to the native save dialog and atomic file write.
- `tests/unit/fileMarkdownPreview.test.tsx` and project file unit tests cover regressions.

The post-design constitution check passes with the same boundaries.
