# Implementation Plan: Acknowledge agent completion

**Branch** — master · **Date** — 2026-11-24 · [Spec](spec.md)

## Summary

Keep completion on the session tab until the result is viewed. A new completion in the visible session of a focused window is viewed automatically. Persist the identity of the viewed completion using the existing UI preferences store.

## Technical Context

React, Zustand and TanStack Query render session tabs. Rust/Tauri supplies live status and session history. The existing event log provides the stable completion sequence. Validate with Vitest and Rust checks.

## Constitution Check

- Agent lifetime and terminal control stay independent of the presentation state.
- Use the existing append-only log to recover the latest completion. Keep transcript and replay cursors intact.
- Acknowledgement changes the tab indicator. Permissions, notifications, and engine controls continue to use their existing runtime status.
- Use the existing shared StatusDot and theme tokens in both themes.
- Keep the session history response backward compatible by adding an optional field.
- Check reload with viewed and unseen completions and verify the completion event and tab activation paths.

## Project Structure

- Backend completion recovery in src-tauri/src/agent.rs and src-tauri/src/commands.rs.
- Shared session types and live event handling in src/lib.
- Persist viewed completions in src/stores/useUiStore.ts and wire activation in src/components/layout/WorkspaceView.tsx.
- Regression coverage in tests/unit/lastSessionClose.test.tsx and tests/unit/completionNotification.test.tsx.

## Phase 0 and Phase 1

See [research](research.md), [data model](data-model.md), [interface](contracts/session-completion.md), and [validation](quickstart.md). Post-design review found no constitution exceptions.
