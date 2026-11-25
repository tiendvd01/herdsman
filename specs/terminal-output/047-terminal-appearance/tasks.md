# Tasks: Terminal Appearance

## Setup

- [x] T001 Confirm existing font picker, persistence and terminal fit behavior in `src/components/settings/SettingsDialog.tsx` and `src/components/terminal/WorkspaceTerminal.tsx`.

## User Story 1

- [x] T002 [US1] Add the themed inset around the measured viewport in `src/components/terminal/WorkspaceTerminal.tsx`.

## User Story 2

- [x] T003 [US2] Use the persisted Code font preference and its fallback in `src/stores/useUiStore.ts` and `src/lib/fonts.ts`.
- [x] T004 [US2] Describe terminal coverage in the existing Code font setting in `src/components/settings/SettingsDialog.tsx`.
- [x] T005 [US2] Apply font changes and refit the live instance in `src/components/terminal/WorkspaceTerminal.tsx`.
- [x] T006 [US2] Verify preference, reset and live update in `tests/unit/settingsDialog.test.tsx` and `tests/unit/terminalAppearance.test.tsx`.

## Validation

- [x] T007 Run tests and build, and record validation in `specs/terminal-output/047-terminal-appearance/quickstart.md`.
