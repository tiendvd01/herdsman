---
description: Tasks for opening files from Rich Conversation
---

# Tasks: Mở tệp từ Rich Conversation

**Input**: Design documents in `specs/044-rich-conversation-file-links/`

## Phase 1: Setup

- [X] T001 Verify existing renderer, tab store, workspace lookup and ignore rules in `src/components/conversation/Markdown.tsx`, `src/stores/useFileStore.ts`, `src-tauri/src/commands.rs` and `.gitignore`.

## Phase 2: Foundational

- [X] T002 Implement the scoped read contract and validate containment in `src-tauri/src/project_files.rs`, `src-tauri/src/commands.rs`, `src-tauri/src/lib.rs`, `src/lib/api.ts` and `src/lib/devMock.ts` (FR-002, FR-004).

## Phase 3: User Story 1 (P1)

**Independent test**: Activate a relative path in a worktree with a similarly named project file, then reopen an existing tab.

- [X] T003 [US1] Add keyboard-accessible links to plain text, inline code and Markdown links in `src/components/conversation/Markdown.tsx` and `src/components/conversation/MessageList.tsx` (FR-001, FR-005, FR-006).
- [X] T004 [US1] Open or reuse the existing tab after reading in `src/stores/useFileStore.ts` (FR-003).

## Phase 4: User Story 2 (P2)

**Independent test**: Activate missing and out-of-workspace paths and check the current conversation and tab.

- [X] T005 [US2] Report a read failure with the shared toast in `src/components/conversation/MessageList.tsx` (FR-004, FR-005).
- [X] T006 [P] [US2] Verify containment and unsupported data in `src-tauri/src/project_files.rs`.
- [X] T007 [P] [US2] Verify activation, draft reuse, renderer isolation and failed reads in `tests/unit/conversationFileLinks.test.tsx`.

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T008 Run automated checks and record desktop validation status in `specs/044-rich-conversation-file-links/quickstart.md` (SC-001 through SC-004).

## Dependencies & Execution Order

Setup → scoped read → P1 → P2 → verification. After renderer and error handling are wired, the Rust and UI regression tests can run independently. P1 is the MVP and P2 completes the failure flow.
