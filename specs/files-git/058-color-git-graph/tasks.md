# Tasks — Git Graph Lane Colors

## Setup and Foundation

- [x] T001 Add five light and dark palette roles in `src/theme/roles.ts`.

## User Story 1 — Trace intersecting commit paths

- [x] T002 [US1] Track color with each active path and apply destination colors to parent edges in `src/components/panels/GitHistoryRows.tsx`.
- [x] T003 [US1] Verify merge continuity, five simultaneous colors and palette overflow in `tests/unit/gitFiles.test.tsx`.

## Verification

- [x] T004 Document the visible change in `specs/technical.md` and run the automated checks in `specs/files-git/058-color-git-graph/quickstart.md`.

All 266 tests and type checking passed. The browser preview verified that each merge edge matched its destination dot in both Light and Dark. The 10-second human review target remains unmeasured.
