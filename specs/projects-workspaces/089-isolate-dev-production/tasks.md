# Tasks: Cô lập môi trường dev và production

## Phase 1 — Setup

- [X] T001 Verify existing test commands and ignore patterns in `package.json`, `.gitignore` and `src-tauri/Cargo.toml`.

## Phase 2 — Foundational

- [X] T002 Define environment identity, startup data routing and legacy compatibility tests in `src-tauri/src/environment.rs`, `src-tauri/src/lib.rs` and `src-tauri/src/state.rs`. FR-003, FR-007, FR-008.

## Phase 3 — US1 (P1)

**Independent test**. Launch both variants in either order and read the environment shown in their windows.

- [X] T003 [P] [US1] Apply the dev launch overlay from `package.json`, `scripts/tauri.mjs`, `scripts/tauri-dev-macos.mjs` and `src-tauri/tauri.dev.conf.json`. FR-001, FR-002.
- [X] T004 [US1] Render the status label from `app_info` in `src-tauri/src/commands/settings.rs`, `src/lib/types.ts`, `src/lib/devMock.ts` and `src/components/layout/StatusBar.tsx`. FR-002.
- [X] T005 [US1] Separate dev worktree placement and automatic discovery or removal in `src-tauri/src/commands/workspaces.rs` and `src-tauri/src/environment.rs`. FR-005.

## Phase 4 — US2 (P1)

**Independent test**. From both profiles exercise test settings and terminal traffic, then reconnect only to the owner after restarting the app.

- [X] T006 [P] [US2] Scope keyring entries in `src-tauri/src/secrets.rs` and app startup in `src-tauri/src/lib.rs`. FR-003.
- [X] T007 [US2] Scope hc launch, lists, snapshot reconciliation, terminal attach/stop, task output and notifications in `src-tauri/src/agent.rs`, `src-tauri/src/workspace_terminal.rs`, `src-tauri/src/project_codegraph.rs`, `src-tauri/src/hc_output.rs`, `src-tauri/src/commands/` and `src/lib/events.ts`. FR-004, FR-006.
- [X] T008 [US2] Verify runtime, restart and startup failure behavior in Rust regression tests and `quickstart.md`. FR-004, FR-006, FR-007.

## Phase 5 — US3 (P1)

**Independent test**. Reopen legacy production state twice after dev initialization while preserving existing runtime identity.

- [X] T009 [US3] Verify legacy profile and hc recovery without migration or duplication in `src-tauri/src/environment.rs` and `src-tauri/src/agent.rs`. FR-008.

## Final Phase — Validation

- [X] T010 Update developer entry point notes in `README.md` and run Rust, sidecar and frontend suites from `quickstart.md`. SC-001–SC-005.
- [X] T011 Run the macOS two-app validation and record results in `quickstart.md`. SC-001–SC-005.

## Dependencies and implementation strategy

T001 and T002 establish defaults. US1 provides the working two-window launch, and US2 and US3 complete safe concurrent use. Launcher changes and Keychain code can be prepared independently once the environment identifiers are fixed. Validate all scenarios before marking desktop smoke testing complete.
