# Tasks: Xem output shell của Claude khi lệnh đang chạy

## Phase 1: Setup

- [X] T001 Verify the installed Claude SDK can return foreground shell output and record evidence in `specs/051-live-claude-shell-output/research.md`.

## Phase 2: Foundations

- [X] T002 Define additive shell events in `src/lib/types.ts` and `specs/051-live-claude-shell-output/contracts/shell-output.md`.

## Phase 3: US1 — Follow shell output

Independent test: expand the card for a command that prints, pauses and fails. Verify the early line and final error.

- [X] T003 [US1] Read and publish Bash task output and status without changing permissions in `sidecar/src/engines/claude.mjs` and `sidecar/src/engines/claude-shell.mjs`.
- [X] T004 [US1] Reduce events by tool ID and render live output, status and fallback text in `src/stores/useSessionStore.ts` and `src/components/conversation/ToolCard.tsx`.

## Phase 4: US2 — Return to output after disconnect

Independent test: reconnect during the command and replay output produced while disconnected.

- [X] T005 [US2] Test real Claude socket reconnect, replay and output timing in `sidecar/test/smoke.claude.test.mjs`.
- [X] T006 [US2] Exercise lifecycle, truncation and legacy replay in `tests/unit/sessionStore.test.ts` `tests/unit/toolCard.test.tsx` and `sidecar/test/claude-shell.contract.test.mjs`.

## Final phase

- [X] T007 Verify test suites and record validation in `specs/051-live-claude-shell-output/quickstart.md`.

## Dependencies and delivery

T001 → T002 → T003/T004 → T005/T006 → T007. Once the event contract is fixed, the producer and consumer can be developed independently. The smoke and deterministic test files can also be developed independently. Ship US1 with US2 using the same append-only event path.
