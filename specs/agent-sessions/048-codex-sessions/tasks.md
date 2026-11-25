# Tasks: Session Codex trong Herdsman

## Setup and Foundation

- [X] T001 Verify installed protocol schemas and engine lifecycle in `sidecar/src/index.mjs` and `src-tauri/src/agent.rs`.

## US1 — Create and use a session

- [X] T002 [US1] Add App Server transport and turn streaming in `sidecar/src/engines/codex.mjs`.
- [X] T003 [US1] Validate runtime and enable Codex in `src-tauri/src/commands.rs` and `src/components/layout/WorkspaceView.tsx`.

## US2 — Open a CLI session

- [X] T004 [US2] Discover compatible threads, link sessions and replay history in `sidecar/src/engines/codex.mjs` and `src-tauri/src/commands.rs`.
- [X] T005 [US2] Expose thread selection in `src/components/layout/WorkspaceView.tsx` and `src/lib/api.ts`.

## US3 — Approvals and recovery

- [X] T006 [US3] Route approvals, file diffs and interrupt via `sidecar/src/engines/codex.mjs` and the shared conversation UI.
- [X] T007 [US3] Verify protocol behavior and reconnect in `sidecar/test/codex.contract.test.mjs`, the existing Rust flow suite and the macOS desktop checks in `specs/agent-sessions/048-codex-sessions/quickstart.md`.

## Validation

- [X] T008 Run automated suites and document live acceptance in `specs/agent-sessions/048-codex-sessions/quickstart.md`.

T001 precedes T002/T003. T004 precedes T005. T006 uses the transport from T002. T007 and T008 verify the integrated behavior.
