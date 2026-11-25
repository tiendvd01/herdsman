# Implementation Plan: Xem output shell của Claude khi lệnh đang chạy

**Branch**: `master` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

## Summary

Reuse the existing Bash card and session event log. The Claude adapter reads output from running shell tasks through the installed SDK.

## Technical Context

Node sidecar, the installed Claude Agent SDK 0.3.329, Tauri JSON event forwarding, Zustand and React. Test with Node contract tests, Vitest and the real Claude SDK.

## Constitution Check

| Principle | Design and validation |
| --- | --- |
| I. Independent agent | Poll in the existing sidecar. Simulate app exit by disconnecting and reconnecting a socket subscriber while the shell continues. |
| II. Conversation history | Append changed snapshots to the existing event log. Replay uses the same reducer. Old events remain readable. |
| III. User control | Keep native permission handling. Start display only on a Claude shell task event. Exercise permission before shell start. |
| IV. UI throughput | Poll at 500 ms and emit only changes. Keep the existing virtualized row and theme tokens. Render output as text. |
| V. Engine compatibility | Use SDK task output and normalized events. Preserve CLI and other adapters. |
| VI. Organization | Associate output with its existing session and tool call. |

The design satisfies the six principles. It requires no new dependency, process, storage system or permission mode.

## Project Structure

- `sidecar/src/engines/claude.mjs` and `sidecar/src/engines/claude-shell.mjs` collect shell snapshots and lifecycle.
- `src/lib/types.ts`, `src/stores/useSessionStore.ts` and `src/components/conversation/ToolCard.tsx` display and replay shell state.
- [Research](research.md), [Data model](data-model.md), [Event contract](contracts/shell-output.md), [Quickstart](quickstart.md).
