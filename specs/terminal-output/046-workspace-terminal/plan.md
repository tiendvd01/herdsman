# Implementation Plan: Workspace session picker and terminal

**Branch**: `master` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

## Summary

Compose a dropdown on the workspace plus button. Open the configured shell in the workspace via hc, and attach xterm.js to it through a local Rust PTY running the hc attach client.

## Technical Context

- React, TypeScript, shadcn/ui, Tauri 2 and Rust. Use the project's installed xterm.js with its Fit addon.
- Target macOS and Linux. Terminal ownership lives in hc labels. SQLite continues to store agent conversations.
- Verify the menu in Vitest and the terminal contract against hc 0.1.22 in an isolated core.

## Constitution Check

- I and V. hc owns all shells and existing agents. Detaching or restarting Herdsman ends the viewer and leaves the shell running.
- II and III. Agent persistence, permission and shutdown paths remain as before.
- IV. Output streams as bytes to xterm.js. UI uses English labels, semantic theme tokens and existing shadcn controls.
- VI. Terminal tabs belong to the existing workspace and use its work directory. Agent conversation records keep their existing meaning.

## Project Structure

- `src/components/layout/WorkspaceView.tsx` hosts the picker and tabs.
- `src/components/terminal/WorkspaceTerminal.tsx` renders and manages the terminal viewer.
- `src-tauri/src/workspace_terminal.rs` implements terminal lifecycle and PTY attachments.
- `src/lib/api.ts` exposes typed desktop commands.

## Complexity Tracking

One PTY library gives the existing hc CLI a controlling terminal and supplies native resize on macOS and Linux. hc continues to own the actual shell.
