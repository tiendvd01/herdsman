# Tasks: Xem trước và tải tệp Markdown

## Phase 1: Setup

- [X] T001 Verify existing controls, renderer and desktop dialog integration in `src/components/files/FileEditor.tsx` and `src-tauri/src/lib.rs`.

## Phase 2: Foundation

- [X] T002 Verify the existing draft flow in `src/stores/useFileStore.ts` and the formatting and fallback behavior in `src/components/conversation/Markdown.tsx`.

## Phase 3: User Story 1 - Preview (P1)

Independent check: Open a Markdown file, edit a heading, preview rich content, and return to Source with the draft intact.

- [X] T003 [US1] Cover preview eligibility, draft content, formatting, fallback and safe rendering in `tests/unit/fileMarkdownPreview.test.tsx` and `tests/unit/render.test.tsx`.
- [X] T004 [US1] Add source/preview switching and empty state in `src/components/files/FileEditor.tsx`, and ensure per-block fallback in `src/components/conversation/Markdown.tsx` as needed.

## Phase 4: User Story 2 - Download (P2)

Independent check: Save a preview snapshot to a different directory and compare the copy, then check cancellation and failed writes.

- [X] T005 [P] [US2] Cover copy content and source protection in `src-tauri/src/project_files.rs`.
- [X] T006 [P] [US2] Cover export invocation and retry in `tests/unit/fileMarkdownPreview.test.tsx`.
- [X] T007 [US2] Implement staged copy and native save dialog in `src-tauri/src/project_files.rs`, `src-tauri/src/commands.rs` and `src-tauri/src/lib.rs`.
- [X] T008 [US2] Add the Download action through `src/lib/api.ts` and `src/components/files/FileEditor.tsx`.

## Final Phase: Validation

- [X] T009 Update `specs/technical.md` and run automated checks documented in `specs/files-git/043-markdown-preview/quickstart.md`.

## Dependencies & Execution Order

T001–T002 precede US1. US2 adds an action to US1's preview. The Rust filesystem tests and UI export tests can be written in parallel because their files are independent. T009 follows integration.

## Implementation Strategy

Deliver US1 as the preview MVP, then add US2 using the same draft snapshot. Verify from the existing file tab entry point.

## Follow-up Acceptance

- [X] T010 Add and run browser integration coverage for rendered Mermaid and chart SVG in `tests/integration/markdown-preview.cjs`.
- [X] T011 Verify agent reconnect with preview open and record desktop acceptance in `specs/files-git/043-markdown-preview/quickstart.md`.
- [X] T012 Verify native overwrite confirmation and cancellation on macOS and record results in `specs/files-git/043-markdown-preview/quickstart.md`.
- [ ] T013 Run the native overwrite and cancellation scenario on a Linux desktop using `specs/files-git/043-markdown-preview/quickstart.md`.
- [ ] T014 Record SC-004 results from five participants using `specs/files-git/043-markdown-preview/quickstart.md`.
