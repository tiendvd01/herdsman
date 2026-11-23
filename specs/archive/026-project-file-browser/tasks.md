# Tasks: Duyệt file project

## Phase 1 — Setup

- [X] T001 Verify CodeMirror and TanStack Virtual dependencies in `package.json`.

## Phase 2 — Foundation

- [X] T002 Implement scoped filesystem commands and registration in `src-tauri/src/project_files.rs`, `src-tauri/src/commands.rs` and `src-tauri/src/lib.rs`.
- [X] T003 Add typed command wrappers in `src/lib/api.ts`.

## Phase 3 — US1 Browse and edit

Open a nested text file, edit it, save and reopen to verify content.

- [X] T004 [US1] Integrate a themed virtual Files tree in `src/components/files/FileTree.tsx` and `src/components/panels/RightPanel.tsx`.
- [X] T005 [US1] Build the CodeMirror editor and preserve drafts in `src/components/files/FileEditor.tsx` and `src/stores/useFileStore.ts`.
- [X] T006 [US1] Handle dirty close and app quit in `src/components/files/FileCloseDialog.tsx` and `src/components/layout/AppShell.tsx`.

## Phase 4 — US2 Reuse file tabs

Select one path repeatedly and verify one tab with the same draft.

- [X] T007 [US2] Integrate file-tab identity, activation and closing in `src/components/layout/WorkspaceView.tsx` and `src/stores/useFileStore.ts`.

## Phase 5 — US3 Git

Open Git in the right panel and view an uncommitted diff.

- [X] T008 [P] [US3] Rename the panel in `src/components/panels/RightPanel.tsx`.

## Phase 6 — Validation

- [X] T009 Validate Files, tab reuse, saving, and Git using browser smoke and automated checks from `specs/026-project-file-browser/quickstart.md`.

Production build, 205 frontend tests, 17 Rust tests and the Chromium smoke passed. The desktop quit flow was exercised with mocked Tauri events. Native macOS interaction remains a manual check.

## Dependencies and delivery

T001 → T002 → T003 → T004/T005 → T006/T007 → T009. T008 is independent. Deliver US1 and US2 together as the file editing MVP, then verify Git.
