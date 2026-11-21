---

description: "Task list for 002-sidebar-workspace-remove"
---

# Tasks: Xoá / archive workspace ngay từ sidebar

**Input**: Design documents from `/specs/002-sidebar-workspace-remove/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sidebar-workspace-menu.md

**Tests**: plan.md lists one unit test (`tests/unit/workspaceMenu.test.tsx`) plus a Playwright check on `?mock` (project rule).

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Frontend only: `src/`, `tests/unit/` at repository root. No changes under `src-tauri/` or `sidecar/`.

---

## Phase 1: Setup

- [X] T001 [P] Add in-memory handlers to the dev mock for `workspace_rename` (set `name`), `workspace_archive` (set `archived_at`, hide from `workspace_list`), `workspace_delete` (remove from `WS` and its sessions), and `workspace_dirty_check` (return `{ dirty: true, files: ['README.md'] }` for worktree workspaces); each mutation emits `workspace:changed` in src/lib/devMock.ts

---

## Phase 2: Foundational (blocking)

**Purpose**: One shared menu used by both header and sidebar (research R2, R3).

- [X] T002 Refactor `WorkspaceMenu` to accept `variant: 'header' | 'sidebar'` (header = current ghost icon button; sidebar = `icon-sm` muted button with `opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100`) and `aria-label` `Options for workspace <name ?? 'New workspace'>`; trigger click must `stopPropagation` in src/components/workspace/WorkspaceMenu.tsx
- [X] T003 In `run()` only call `selectWorkspace(ws.project_id, null)` when `useUiStore.getState().workspaceId === ws.id` (FR-004, FR-005) in src/components/workspace/WorkspaceMenu.tsx
- [X] T004 Keep header usage working: render `<WorkspaceMenu ws={ws} variant="header" />` in src/components/layout/WorkspaceView.tsx

**Checkpoint**: header menu behaves as before; the component is ready for the sidebar.

---

## Phase 3: User Story 1 - Xoá workspace từ sidebar (Priority: P1) 🎯 MVP

**Goal**: Delete any workspace from its sidebar row without opening it.

**Independent Test**: With "Fix login OAuth" open, delete "Refactor store" from the sidebar → it disappears; the open workspace is unchanged (quickstart 2–4).

- [X] T005 [US1] Turn each workspace row into a `div.group` holding the select button and a sibling `<WorkspaceMenu ws={w} variant="sidebar" />` placed before the live-session count; no button nested in a button (FR-001, FR-006) in src/components/layout/Sidebar.tsx
- [X] T006 [US1] Update the Delete confirmation copy to "The workspace and its session history are removed from Herdsman. Running sessions will stop. The project folder and the engine’s original transcripts are not deleted." (contract) in src/components/workspace/WorkspaceMenu.tsx
- [X] T007 [P] [US1] Unit test: sidebar menu trigger has the right aria-label; menu lists Rename, Archive, Delete workspace; deleting a workspace that is not open leaves `useUiStore.workspaceId` unchanged (mock `@/lib/api`) in tests/unit/workspaceMenu.test.tsx

**Checkpoint**: US1 works on `?mock`.

---

## Phase 4: User Story 2 - Archive workspace từ sidebar (Priority: P2)

**Goal**: Archive from the same menu; confirmation says running sessions stop.

**Independent Test**: Archive a workspace from the sidebar → it leaves the sidebar; confirmation text mentions running sessions (quickstart 5).

- [X] T008 [US2] Verify Archive item and its confirmation (existing copy already says "Running sessions will stop") work from the sidebar variant; fix any focus/close issues when the dropdown hands off to the dialog in src/components/workspace/WorkspaceMenu.tsx

---

## Phase 5: User Story 3 - Đổi tên workspace từ sidebar (Priority: P3)

**Goal**: Rename from the sidebar menu.

**Independent Test**: Rename from the sidebar → new name in sidebar and breadcrumb (quickstart 6).

- [X] T009 [US3] Verify Rename from the sidebar variant updates sidebar and header (query invalidation of `['workspaces']`) in src/components/workspace/WorkspaceMenu.tsx

---

## Phase 6: Polish & Cross-Cutting

- [X] T010 Run `pnpm typecheck` and `pnpm test`
- [X] T011 Playwright check on `http://localhost:1420/?mock`: hover row shows "⋯", menu open, delete confirmation, row removed, open workspace unchanged; light and dark screenshots (quickstart)

---

## Dependencies & Execution Order

- T001 independent (mock only).
- T002 → T003 → T004 (same file chain, foundational).
- US1 (T005–T007) needs Phase 2. US2 (T008) and US3 (T009) need T005 (menu present in sidebar) but not each other.
- Polish after all stories.

### Parallel Opportunities

- T001 and T002 in parallel (different files).
- T007 (test) in parallel with T005/T006 once T002–T003 are done.

## Implementation Strategy

- **MVP**: Phase 1–3 (sidebar Delete). Then US2, US3 come almost for free from the shared menu; verify and polish.
