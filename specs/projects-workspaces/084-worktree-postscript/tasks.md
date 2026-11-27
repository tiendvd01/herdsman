# Tasks — Worktree Postscript

## Phase 1 — Setup

- [x] T001 Verify project dependencies and ignore rules in `.gitignore`.

## Phase 2 — Foundation

- [x] T002 Add owner-scoped records in `src-tauri/migrations/0010_worktree_postscript.sql` and register in `src-tauri/src/store.rs`.

## Phase 3 — US1 Automatic preparation

Create worktrees for both branch types with a configured marker command.

- [x] T003 [US1] Test run identity, isolation, working directory and output in `src-tauri/src/worktree_postscript.rs`.
- [x] T004 [US1] Implement asynchronous execution and trigger after successful creation in `src-tauri/src/commands/workspaces.rs` and `src-tauri/src/worktree_postscript.rs`.

## Phase 4 — US2 Project settings

Save distinct project commands and clear one without affecting the other.

- [x] T005 [US2] Add project configuration commands and settings editor in `src-tauri/src/lib.rs`, `src/lib/api.ts`, `src/components/layout/Sidebar.tsx` and `src/components/project/WorktreePostscriptDialog.tsx`.

## Phase 5 — US3 Run feedback

Use a long-running failing command and reopen during a separate run to verify failure and interruption.

- [x] T006 [US3] Restore interrupted status and expose run details in `src-tauri/src/lib.rs` and `src-tauri/src/worktree_postscript.rs`.
- [x] T007 [US3] Show accessible status and output in `src/components/workspace/WorktreePostscriptStatus.tsx` and `src/components/layout/WorkspaceView.tsx`.

## Final phase — Verification

- [x] T008 Run automated regression checks described in `specs/projects-workspaces/084-worktree-postscript/quickstart.md`.

- [ ] T009 Run desktop visual and usability acceptance checks in `specs/projects-workspaces/084-worktree-postscript/quickstart.md`.

## Dependencies and implementation strategy

T001 → T002 → T003 → T004. After T004, UI for configuration and feedback can be developed independently once the desktop contract is set. US1 is the execution MVP, with configuration and feedback completing the delivered workflow. T008 follows all implementation tasks.
