# Tasks — Inspect Commit Changes

## Foundation

- [x] T001 Implement historical change and diff reads in `src-tauri/src/git.rs` and register them in `src-tauri/src/commands.rs` and `src-tauri/src/lib.rs` (FR-003, FR-005, FR-006).

## User Story 1 — Expand commits

- [x] T002 [US1] Add loading, empty, error and file rows to `src/components/panels/GitHistoryRows.tsx` with workspace wiring in `src/components/panels/RightPanel.tsx` and calls in `src/lib/api.ts` (FR-001, FR-002, FR-005).

## User Story 2 — Open file diffs

- [x] T003 [US2] Extend diff tab identity in `src/stores/useFileStore.ts` and render historical patches in `src/components/files/FileChanges.tsx` (FR-003, FR-004, FR-006).

## Verification

- [x] T004 Verify Git comparisons and tab interactions in `src-tauri/src/git.rs` and `tests/unit/gitFiles.test.tsx`, update `specs/technical.md` and run the quickstart checks.

Verified with 267 frontend tests, type checking, 8 Git tests, and a browser preview in Light and Dark. Browser checks covered keyboard expansion, continuous lanes, historical diff tabs, and reactivation without duplicates.
