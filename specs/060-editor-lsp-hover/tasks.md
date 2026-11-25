# Tasks — Editor LSP Hover

- [x] T001 Implement local LSP transport and editor commands in `src-tauri/src/editor_lsp.rs`, `src-tauri/src/commands.rs`, and `src-tauri/src/lib.rs` (FR-002, FR-003, FR-004).
- [x] T002 [US1] Wire CodeMirror hover and draft synchronization in `src/components/files/editorHover.ts`, `src/components/files/FileEditor.tsx` and `src/lib/api.ts` (FR-001, FR-002, FR-003, FR-005).
- [x] T003 [US2] Present unavailable and recovery states in `src/components/files/FileEditor.tsx` (FR-004, FR-005).
- [x] T004 Verify the transport and editor behavior and document the dependency in `specs/technical.md`.

Verification passed with 271 frontend tests, type checking and two Rust LSP tests, including a live TypeScript Language Server. The live test checked the imported signature and a changed type from the unsaved buffer. The formal 20-hover latency sample was not run.
