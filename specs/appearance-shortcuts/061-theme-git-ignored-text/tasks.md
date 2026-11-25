# Tasks — Theme Git-Ignored Text

- [x] T001 Register the theme role in `src/theme/roles.ts` and resolve missing cached colors in `src/lib/theme.ts` (FR-001, FR-003, FR-004).
- [x] T002 [US1] Apply the theme color to ignored names in `src/components/files/FileTree.tsx` (FR-001, FR-002, FR-005).
- [x] T003 [US1] Verify contrast, cache compatibility and tree presentation in `tests/unit/themeBuiltin.test.ts`, `tests/unit/themeSelection.test.tsx` and `tests/unit/fileTreeSearch.test.tsx`.

Verification passed with 277 tests and type checking. A browser preview confirmed that Light, Dark and One Dark Pro recolor the ignored file while the folder stays expanded and the file stays selected. The human identification exercise was not run.
