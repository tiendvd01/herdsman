# Tasks: Workspace session picker and terminal

## Phase 1 - Setup and foundation

- [x] T001 Add the terminal Fit addon in `package.json` and PTY support in `src-tauri/Cargo.toml`.
- [x] T002 Add workspace-scoped terminal creation, listing, and cleanup in `src-tauri/src/workspace_terminal.rs` and register commands in `src-tauri/src/lib.rs`.

## Phase 2 - User Story 1

- [x] T003 [US1] Compose the plus menu in `src/components/layout/WorkspaceView.tsx` using the shared dropdown and existing agent action.
- [x] T004 [US1] Verify the picker and keyboard behavior in `tests/unit/workspaceTerminal.test.tsx`.

## Phase 3 - User Story 2

- [x] T005 [US2] Bridge input, output, resize, and view-only detach in `src-tauri/src/workspace_terminal.rs` and `src/lib/api.ts`.
- [x] T006 [US2] Add the xterm viewer in `src/components/terminal/WorkspaceTerminal.tsx` and workspace tabs in `src/components/layout/WorkspaceView.tsx`.
- [x] T007 [US2] Verify lifecycle and isolation with an hc contract in `src-tauri/src/workspace_terminal.rs`.

## Phase 4 - Validation

- [x] T008 Run project checks and record the terminal contract and desktop validation coverage in `specs/terminal-output/046-workspace-terminal/quickstart.md`.
