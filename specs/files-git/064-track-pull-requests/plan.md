# Implementation Plan: Theo dõi pull request theo project

**Branch**: `master` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Summary

Add a dedicated Pull Requests screen with independent project and content filters, plus an unread count on the left rail. Refresh GitHub data for registered projects in the desktop app and reconcile updates into a persistent account-scoped inbox.

## Technical Context

- React, TypeScript, TanStack Query, Tauri and Rust on macOS and Linux.
- Use the authenticated GitHub CLI and each local project's GitHub origin.
- Persist one snapshot per account and repository in the existing SQLite settings store.
- Refresh every minute while the app runs. Validate using Rust tests, Vitest, typecheck and the desktop quickstart.

## Constitution Check

I–V: PR refresh is desktop data fetching. It leaves agent processes, permissions, engine integration and conversation history independent. Closing the app stops polling and reopening reconciles available changes. Render GitHub text as plain text and let the CLI manage credentials. VI: Associate PR data with existing projects and share fetches for identical origins. Reuse shadcn controls and theme tokens with English interface copy. Design recheck passed.

## Project Structure

- `src-tauri/src/pull_requests.rs` handles discovery, GitHub reads, reconciliation and command validation.
- `src-tauri/src/lib.rs` registers commands.
- `src/components/layout/PullRequests.tsx` and `AppShell.tsx` provide the left rail, inbox and dedicated view. The workspace shell stays mounted while hidden to preserve its session state.
- [research.md](research.md), [data-model.md](data-model.md), [contracts](contracts/) and [quickstart.md](quickstart.md) describe design and validation.

## Complexity Tracking

The persisted per-repository snapshot is necessary to deduplicate updates and keep read state after a restart. Existing SQLite settings and the authenticated CLI avoid a new service or credential store.
