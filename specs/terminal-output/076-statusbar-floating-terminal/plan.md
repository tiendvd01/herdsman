# Implementation Plan — Status bar và terminal nổi

**Branch** `master` | **Date** 2026-11-26 | **Spec** [spec.md](spec.md)

## Summary

Move the existing hc connection indicator to an app-wide footer and add a keyboard-accessible Terminal action. Render a draggable panel with an interactive shell backed by hc and numbered tabs and a New terminal button in the panel header. Reuse the workspace terminal renderer and attachment transport.

## Technical Context

- **Language and platform**. TypeScript and Rust in the existing Tauri desktop app. macOS first.
- **Dependencies**. Existing React, TanStack Query, xterm, portable-pty, and hc runtime.
- **Storage**. hc labels identify sessions. hc owns shell state and retained output.
- **Testing**. Vitest, native hc contract test, and desktop smoke.
- **Scope and performance**. One status bar and one floating panel with a selectable list of shells. A user can open it from the main window in one action.

## Constitution Check

| Principle | Design check |
| --- | --- |
| I. Independent runtime | Shell runs in hc. Closing the viewer or app drops only the attachment. Restart resolves the same live shell. |
| II. Conversation history | No change to agent logs or transcripts. |
| III. User control | Opening attaches an interactive prompt. Explicit keyboard input runs shell commands. Agent permissions stay on their existing path. |
| IV. Rich display | Reuse the existing streaming terminal renderer and retained output. |
| V. Existing ecosystem | Use native hc labels and its existing CLI contract. |
| VI. Organization | Context determines initial directory. The shell adds no project, workspace, or agent session. |

The design passes before and after design review. The bar uses semantic theme colors and English text. Light and dark review is part of the quickstart.

## Project Structure

- `src/components/layout/{AppShell,Sidebar,StatusBar}.tsx` mounts the global footer and removes the old status placement.
- `src/components/terminal/{WorkspaceTerminal,FloatingTerminalPanel}.tsx` and `src/lib/api.ts` share the terminal renderer and list and attach sessions.
- `src-tauri/src/{workspace_terminal,lib}.rs` manages session creation, lookup, and attachment ownership.
- `tests/unit/statusBar.test.tsx` and the Rust terminal contract cover the entry point and hc lifecycle.
- [Research](research.md), [data model](data-model.md), [contract](contracts/floating-terminal.md), and [quickstart](quickstart.md) record design and verification.

## Complexity Tracking

The panel uses the existing attachment transport. Session discovery uses labels and includes live shells created by the previous native-window implementation. No migration or dependency is required.
