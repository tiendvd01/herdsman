# Tasks — Status bar và terminal nổi

**Input** [Spec](spec.md), [plan](plan.md), [research](research.md), and [contract](contracts/floating-terminal.md).

## Phase 1 — Setup

- [x] T001 Confirm hc event status and existing native terminal contracts in `src/lib/events.ts` and `src-tauri/src/workspace_terminal.rs`.

## Phase 2 — Foundation

- [x] T002 Scope shared attachment IDs to their calling window and release viewers when their panel unmounts in `src-tauri/src/workspace_terminal.rs` and `src-tauri/src/lib.rs`.

## Phase 3 — User Story 1

**Goal**. The global footer shows the current hc connection state. Check the footer on multiple screens with sidebar hidden and while hc reconnects.

- [x] T003 [US1] Move the connection label and existing diagnostics from `src/components/layout/Sidebar.tsx` to `src/components/layout/StatusBar.tsx` and mount the footer in `src/components/layout/AppShell.tsx`.

## Phase 4 — User Story 2

**Goal**. The Terminal control toggles the numbered index and draggable panel. Users can create or reopen shells.

- [x] T004 [US2] Validate shell ownership, directory selection, reattachment and window isolation in `src-tauri/src/workspace_terminal.rs`. Validate the footer action and its failure feedback in `tests/unit/statusBar.test.tsx`.
- [x] T005 [US2] List and create labeled hc shells in `src-tauri/src/workspace_terminal.rs`. Register commands in `src-tauri/src/lib.rs`.
- [x] T006 [US2] Use the shared renderer in `src/components/terminal/WorkspaceTerminal.tsx` and implement header dragging in `src/components/terminal/FloatingTerminalPanel.tsx`.
- [x] T007 [US2] Wire the status bar toggle, numbered index and launch context in `src/components/layout/AppShell.tsx`, `src/components/layout/StatusBar.tsx`, and `src/lib/api.ts`.

## Phase 5 — Verification

- [x] T008 Run frontend and native contract tests, then verify desktop behavior against `specs/terminal-output/076-statusbar-floating-terminal/quickstart.md`.
- [x] T009 Record implemented behavior and link the feature in `specs/README.md` and `specs/terminal-output/076-statusbar-floating-terminal/spec.md`.

## Dependencies and execution

T001 precedes T002 and T003. T002 precedes T005 and T006. T004 defines the contract for T005–T007. The footer can be developed independently of the native shell work. US1 is the first usable increment, and US2 completes the feature.
