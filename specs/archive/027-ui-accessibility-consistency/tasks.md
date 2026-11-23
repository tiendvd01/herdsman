# Tasks: Điều hướng và phản hồi giao diện nhất quán

## Setup and foundation

- [x] T001 Add shared New York Tabs and Radio Group primitives in `src/components/ui/` and `package.json`.

## US1 — Tab navigation

- [x] T002 [US1] Add manual right-panel tabs in `src/components/panels/RightPanel.tsx`.
- [x] T003 [US1] Add mixed tab focus, panel association and close recovery in `src/components/layout/WorkspaceView.tsx`.

## US2 — Palette and choices

- [x] T004 [P] [US2] Expose the current result in `src/components/command/CommandDialog.tsx`.
- [x] T005 [US2] Migrate the choice groups in `src/components/settings/SettingsDialog.tsx`, `src/components/workspace/CreateWorkspaceDialog.tsx` and `src/components/history/HistoryPopover.tsx`.

## US3 — Feedback

- [x] T006 [P] [US3] Report actual clipboard outcomes in `src/components/conversation/CodeBlock.tsx`.
- [x] T007 [US3] Distinguish empty, pending and failed results in `src/components/panels/RightPanel.tsx`.

## Validation

- [x] T008 Verify keyboard, clipboard and query state regressions using `specs/027-ui-accessibility-consistency/quickstart.md`.

## Dependencies

T001 precedes T002 and T005. T003, T004 and T006 can proceed independently. T007 follows T002 to avoid shared-file conflicts. T008 follows all implementation work.

## Validation results

Typecheck, production build and 206 frontend tests passed. Chromium verified keyboard activation and panel association, file draft retention, close/cancel focus, all three radio groups, Git loading and error feedback, and light/dark rendering. Command Palette active-option and clipboard success/failure are covered by unit tests. Desktop VoiceOver remains a manual verification item.
