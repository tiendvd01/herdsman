# Implementation Plan: Terminal Appearance

**Spec** — [Terminal Appearance](spec.md)

## Summary

Inset the terminal viewport by 8 pixels and use the existing Code font preference. Apply typography to the attached terminal and recalculate its grid.

## Technical Context

React, Zustand persistence, the existing Appearance font picker, and xterm.js with FitAddon. Verify with Vitest and a production build. macOS is the primary desktop target.

## Constitution Check

I–III and V pass. Shell ownership, agent interaction and conversation persistence are outside this view change. IV and VI pass. The inset uses the existing theme background and the settings control follows the existing shadcn Appearance pattern. No new runtime dependency or workspace entity is needed.

## Project Structure

- `src/components/terminal/WorkspaceTerminal.tsx` owns the viewport and applies the font.
- `src/components/settings/SettingsDialog.tsx` documents that Code font applies to workspace terminals.
- `src/stores/useUiStore.ts` and `src/lib/fonts.ts` supply the existing Code font and its fallback.
