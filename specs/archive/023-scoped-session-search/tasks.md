# Tasks — Scoped session search

## Phase 1 — Setup

- [X] T001 Verify project scripts and existing ignore rules in `package.json` and `.gitignore`.

## Phase 2 — Foundational

- [X] T002 Extend scoped managed and legacy search contracts in `src-tauri/src/commands.rs`, `src/lib/api.ts` and `src/lib/types.ts` (FR-002, FR-003).

## Phase 3 — User Story 1 (P1)

Independent check: a shared term returns 3, 2 and 1 sessions as the scope narrows.

- [X] T003 [US1] Search managed titles and indexed messages with scope and unique session hits in `src-tauri/src/store.rs` (FR-002–004).
- [X] T004 [US1] Apply legacy scope before the cap and preserve exact managed/legacy identity in `src-tauri/src/claude_history.rs` and `src-tauri/src/commands.rs` (FR-003–004).
- [X] T005 [US1] Wire scoped results, latest-query state, errors and opening archived sessions in `src/components/command/CommandDialog.tsx` and `src/components/layout/WorkspaceView.tsx` (FR-002–004, FR-006).

## Phase 4 — User Story 2 (P2)

Independent check: filter by category and use the resulting item to navigate or run an action.

- [X] T006 [US2] Record recent workspace visits in `src/stores/useUiStore.ts` and expose category navigation, search and keyboard activation in `src/components/command/CommandDialog.tsx` (FR-001, FR-005–007).

## Final Phase — Verification

- [X] T007 Validate scope isolation and archive regressions with `src-tauri/src/store.rs`, validate palette interactions under `tests/unit/`, and run checks in `quickstart.md`.
- [X] T008 Update search behavior in `specs/technical.md` and reconcile implementation with the feature spec.

## Dependencies and parallel opportunities

Verification status for T007: automated checks and the managed database benchmark passed. Desktop timing from keystroke to results (SC-002) and the first-use participant check (SC-003) remain unverified.

T001 → T002 → T003 and T004 → T005 → T006 → T007 and T008. Store matching and transcript matching can be developed independently after the shared contract is fixed. UI checks and documentation can be reviewed independently once the menu is wired.

## Implementation strategy

Deliver scoped session lookup first, then add category browsing and action selection. Verify both stories with their independent acceptance flows.
