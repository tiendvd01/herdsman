# Implementation Plan: Điều hướng và phản hồi giao diện nhất quán

**Branch**: `027-ui-accessibility-consistency` (Spec Kit identifier) | **Date**: 2026-11-23 | **Spec**: [spec.md](spec.md)

## Summary

Standardize keyboard and assistive-technology behavior for tabs, Command Palette and three choice groups. Make copy feedback reflect the clipboard result. Align right-panel empty states with Files.

## Technical Context

- **Stack**: TypeScript, React, Vite/Tauri, Tailwind v4, shadcn/ui New York with Radix and Lucide.
- **Dependencies**: Reuse TanStack Query, existing Zustand stores and shared UI components. Introduce the individually scoped Radix Tabs and Radio Group primitives through local shadcn wrappers.
- **Storage and APIs**: Existing client selection and draft state. No new persisted fields or API contracts.
- **Testing**: Vitest and Testing Library, Chromium with the dev mock, and desktop VoiceOver validation.
- **Platform**: Herdsman desktop on macOS first and Linux second.
- **Scope**: Workspace tabs, right panel, Command Palette, Theme, Working directory, Search scope and code-copy feedback. Keep editor, terminal and session lifecycles intact.
- **Performance**: Keep current search debounce and stale-response gating. Keyboard movement uses the already rendered entries and issues no extra searches.

## Constitution Check

| Principle | Pre-research and post-design outcome |
|---|---|
| I. Agent independence | Pass. Focus and selection run in the frontend. Ordinary tab navigation leaves agent processes running. Existing explicit session-close actions retain their behavior. |
| II. Conversation data | Pass. No transcript or event-log changes. File drafts stay in the existing store across tab switches. |
| III. Developer control | Pass. Preserve close confirmations and all permission decisions. Copy only runs on user action. |
| IV. Responsive UI | Pass. Preserve search debounce, conversation rendering and panel refresh behavior. |
| V. Engine compatibility | Pass. No adapter, engine or protocol change. |
| VI. Project organization | Pass. Preserve project, workspace and session scoping. Files stays project-scoped and Git stays workspace-scoped. |
| UI requirements | Pass. Use shared New York components, semantic theme tokens and English app copy. Verify light and dark themes. |

## Project Structure

### Documentation (this feature)

- [Research](research.md)
- [Data model](data-model.md)
- [UI contract](contracts/ui-interactions.md)
- [Quickstart](quickstart.md)

### Source Code (repository root)

- `src/components/ui/` for reusable Tabs and RadioGroup wrappers and existing Button, Empty, Alert and Spinner.
- `src/components/layout/WorkspaceView.tsx`, `src/components/files/FileCloseDialog.tsx` and `src/components/panels/RightPanel.tsx` for selection, keyboard navigation and focus restoration.
- `src/components/command/CommandDialog.tsx` for the existing search and selection flow.
- `src/components/settings/SettingsDialog.tsx`, `src/components/workspace/CreateWorkspaceDialog.tsx` and `src/components/history/HistoryPopover.tsx` for the three choice groups.
- `src/components/conversation/CodeBlock.tsx` for clipboard feedback.
- `tests/unit/` for focused regression coverage.

**Structure Decision**: Keep behavior with its owning view and put only shared primitives in `src/components/ui`.

## Complexity Tracking

No constitution exceptions. Two narrow Radix primitives cover the recurring interactions. The workspace row needs custom close and focus coordination because session and file tabs already have independent storage and confirmation flows.
