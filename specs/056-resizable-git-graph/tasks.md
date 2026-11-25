# Tasks: Resizable Git Graph

## Phase 1: Setup

- [x] T001 Review the existing Git tab and shared resize handle in src/components.

## Phase 2: Foundation

- [x] T002 Add the workspace history command and query contract in src-tauri/src and src/lib.

## Phase 3: User Story 1

Goal and independent check — Open Git with a merge commit, then switch workspace and check the graph and existing Changes actions.

- [x] T003 [US1] Render commit lanes and workspace states in src/components/panels.
- [x] T004 [P] [US1] Check Git history and merge ordering in src-tauri/src/git.rs.

## Phase 4: User Story 2

Goal and independent check — Drag in both directions and confirm the split bounds and independent scroll.

- [x] T005 [US2] Wire the shared resize handle and bounded layout in src/components/panels/RightPanel.tsx.
- [x] T006 [US2] Cover workspace switching and splitter behavior in tests/unit/gitFiles.test.tsx.

## Final Phase: Verification

- [x] T007 Run frontend and Rust checks documented in specs/056-resizable-git-graph/quickstart.md.

## Dependencies and execution

T001 precedes T002. T003 and T004 can proceed independently after T002. T005 integrates the panes, then T006 verifies both stories. T007 checks the integrated feature. A read-only graph is the first usable increment, followed by resizing.
