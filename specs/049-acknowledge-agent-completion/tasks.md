# Tasks: Acknowledge agent completion

## Phase 1 — Setup

- [X] T001 Review the specification and existing status contract in specs/049-acknowledge-agent-completion/plan.md.

## Phase 2 — Foundation

- [X] T002 [P] Expose consistent completion identities from live status and session history in src-tauri/src/agent.rs, src-tauri/src/commands.rs, src/lib/types.ts and src/lib/events.ts.

## Phase 3 — User Story 1 (P1)

**Independent test** — Complete two sessions, activate one, and verify only that tab goes idle.

- [X] T003 [P] [US1] Add regression scenarios in tests/unit/lastSessionClose.test.tsx for activation, reload and subsequent turns.
- [X] T004 [US1] Persist viewed completion identity and apply it to explicit session activation and the tab indicator in src/stores/useUiStore.ts and src/components/layout/WorkspaceView.tsx.

- [X] T006 [US1] Acknowledge fresh completions automatically while the session is visible in the focused window and verify background and startup replay behavior in src/components/layout/WorkspaceView.tsx and tests/unit/lastSessionClose.test.tsx.

## Final Phase — Validation

- [X] T005 Verify regression tests, type checking, backend checks and documentation against specs/049-acknowledge-agent-completion/quickstart.md.

## Dependencies and strategy

T001 precedes T002 and T003, which can proceed independently. T004 follows both. T006 extends T004. T005 verifies the complete MVP for US1, including FR-001–FR-005 and SC-001–SC-003.

## Validation results

- Frontend suite passed 242 tests, including reload, subsequent completions and duplicate delivery. TypeScript checking passed.
- Rust suite passed 33 tests, including Herdr Core integration. Two benchmark tests were ignored by default.
- Native desktop interaction remains a manual verification scenario in the quickstart.
- Active-session follow-up passed the frontend suite, TypeScript checking and all three Rust agent tests.
