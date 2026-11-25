# Tasks: Theme Preview Picker

## Phase 1: Setup

- [x] T001 Review feature specification, UI contract and existing selection behavior in specs/appearance-shortcuts/055-theme-preview-picker/ and src/lib/theme.ts

## Phase 2: Foundational

- [x] T002 Confirm the existing UI store and catalog fallback cover both selection groups in src/stores/useUiStore.ts and src/theme/catalog.ts

## Phase 3: User Story 1 (P1)

Choose an existing palette or either new Dark theme and verify both selections remain independent.

- [x] T003 [P] [US1] Register both dark palettes in src/theme/builtin/ and src/theme/catalog.ts and verify contrast in tests/unit/themeBuiltin.test.ts
- [x] T004 [P] [US1] Replace dropdowns with named preview radios in src/components/settings/SettingsDialog.tsx

## Phase 4: User Story 2 (P2)

Resize the dialog and use the keyboard to navigate both groups and reveal full names.

- [x] T005 [US2] Add responsive columns, visible keyboard focus and full-name tooltips in src/components/settings/SettingsDialog.tsx and src/components/ui/radio-group.tsx

## Final Phase: Verification

- [x] T006 Exercise independent selection, app color application, persistence and fallback in tests/unit/settingsDialog.test.tsx and follow specs/appearance-shortcuts/055-theme-preview-picker/quickstart.md

## Dependencies and strategy

T001 and T002 precede implementation. Palette files and initial cards are independent. T005 builds on T004. T006 verifies both stories after integration. US1 delivers the minimum gallery and palettes, followed by responsive and keyboard validation in US2.

## Verification

All eight requirements map to the implementation and verification tasks. Type checking, the production web build and all 256 unit tests passed. Chromium verified four- and one-column layouts without horizontal scrolling, keyboard selection, full-name tooltip, visible selection, System mode and reload. Custom palette fallback was verified in the Settings test. SC-005 requires a five-person usability study and remains unmeasured.
