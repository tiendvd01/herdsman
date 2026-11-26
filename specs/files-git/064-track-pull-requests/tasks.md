# Tasks: Theo dõi pull request theo project

## Phase 1 — Setup

- [x] T001 Confirm source fields and establish the command contract in `specs/files-git/064-track-pull-requests/contracts/pull-requests.md`.

## Phase 2 — Foundation

- [x] T002 Register the validated, read-only GitHub CLI adapter and account-scoped reconciliation in `src-tauri/src/lib.rs` and `src-tauri/src/pull_requests.rs`.

## Phase 3 — US1, project and role view

Open by keyboard and switch between projects with overlapping PR numbers.

- [x] T003 [US1] Show role groups, project state and validated links in `src/components/layout/PullRequests.tsx` and mount the left rail from `src/components/layout/AppShell.tsx` (FR-001–FR-004, FR-009).

- [x] T008 [US1] Replace the workspace layout with the dedicated PR screen and add project and content selectors in `src/components/layout/AppShell.tsx` and `src/components/layout/PullRequests.tsx` (FR-001, FR-002, FR-011).

## Phase 4 — US2, notifications

Receive two updates across projects and open each notification to verify the badge.

- [x] T004 [US2] Reconcile stable activity and state transitions, preserving deduplication across restarts, in `src-tauri/src/pull_requests.rs` (FR-005–FR-007, FR-010).
- [x] T005 [US2] Poll all projects, render the numeric badge, and route notifications by project in `src/components/layout/PullRequests.tsx` (FR-005–FR-007).

## Phase 5 — US3, review queue

Add, remove and re-request review and verify membership and notifications.

- [x] T006 [US3] Reconcile direct review request lifecycle in `src-tauri/src/pull_requests.rs` and support opening the original PR from `src/components/layout/PullRequests.tsx` (FR-008).

## Final phase — Validation

- [x] T007 Check interrupted refresh, deduplication and unread state in `src-tauri/src/pull_requests.rs` and run the automated checks in `specs/files-git/064-track-pull-requests/quickstart.md`.

## Dependencies and delivery strategy

T001 precedes T002. Deliver US1 after T002, then add independent inbox and review lifecycle checks. The backend activity logic in T004 and badge composition in T005 can proceed independently after agreeing on the command contract. T007 validates the integrated feature.

## Validation status

Build and automated suites passed. GitHub CLI queries were smoke-tested with live read-only data. The desktop walkthrough with live events across two repositories remains unverified.
