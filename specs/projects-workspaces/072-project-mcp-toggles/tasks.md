# Tasks: Bật tắt mọi MCP server theo project

**Input**: Design documents from `specs/projects-workspaces/072-project-mcp-toggles/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/native-toggle.md

**Tests**: Có. Theo quickstart.md, mỗi lớp (Rust, sidecar, UI) có test tự động.

## Phase 1: Setup

- [x] T001 Create migration `src-tauri/migrations/0009_mcp_native_disabled.sql` with table `project_mcp_disabled (project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, server_name TEXT NOT NULL, PRIMARY KEY (project_id, server_name))`, and register it after 0008 in the migration list in `src-tauri/src/store.rs`

## Phase 2: Foundational

- [x] T002 Add `disabled_names(db, project_id) -> HashSet<String>` reading `project_mcp_disabled` in `src-tauri/src/mcp.rs`

## Phase 3: User Story 1 - Tắt server Claude tự nạp cho một project (P1) 🎯 MVP

**Goal**: Server Claude tự nạp đã tắt ở project không được nạp vào session Claude mới hoặc session resume của project đó.

**Independent Test**: Tắt một server user scope ở project A, tạo session ở A và B, và chỉ session ở B có server đó (quickstart.md, phần Thủ công).

- [x] T003 [US1] Add `native_toggle(db, project_id, name, enabled)` and Tauri command `mcp_native_toggle(project_id, name, enabled)` in `src-tauri/src/mcp.rs`: check the project exists (`not_found`), validate the name with `valid_name` ("1-64 letters, digits, - or _", else `mcp_invalid`), make it idempotent (INSERT OR IGNORE / DELETE), and register the command in `src-tauri/src/lib.rs`
- [x] T004 [US1] In `src-tauri/src/mcp.rs`, add `DENIED = "mcp-denied.json"` and `pub fn denied_path(session_dir)`. In `prepare_in`, when `fresh`, write the project's disabled names as a sorted JSON `string[]` to that file only when non-empty (remove any stale file otherwise). On resume, leave the file as is
- [x] T005 [US1] In `src-tauri/src/agent.rs`, next to `--mcp-servers-file`, pass `--mcp-denied-file <path>` when `crate::mcp::denied_path(...)` is a file. Do NOT delete it after spawn
- [x] T006 [P] [US1] In `sidecar/src/index.mjs`, add option `'mcp-denied-file'`. Read it without deleting it, and accept a non-empty array of strings as `mcpDenied`. On a read or shape error, emit `project_skills_warning` `Could not load disabled MCP servers for this session`. Put `mcpDenied` on `ctx`
- [x] T007 [P] [US1] In `sidecar/src/engines/claude.mjs`, when `ctx.mcpDenied?.length`, set `options.settings = { deniedMcpServers: ctx.mcpDenied.map((serverName) => ({ serverName })) }`, and document `mcpDenied?: string[]` in the ctx JSDoc
- [x] T008 [US1] Add Rust tests in `src-tauri/src/mcp.rs`: toggle off/on is persisted and idempotent; an invalid name is rejected; a fresh `prepare_in` writes `mcp-denied.json` with the disabled names; a resume keeps the file even after the DB changes; nothing is written when there are no disabled names
- [x] T009 [P] [US1] Add sidecar contract test in `sidecar/test/mcp.contract.test.mjs`: `--mcp-denied-file` turns into `options.settings.deniedMcpServers`, the file stays on disk, and a malformed file emits the warning with no `settings`

## Phase 4: User Story 2 - Thấy rõ server nào session sẽ nhận (P2)

**Goal**: Màn MCP hiện công tắc cho mọi server Claude tự nạp, và trạng thái khớp với thứ session nhận.

**Independent Test**: Mở màn MCP, tắt một server ở mục "Loaded by Claude". Công tắc đổi trạng thái, mọi dòng cùng tên đổi theo, và lựa chọn còn sau khi refresh.

- [x] T010 [US2] In `src-tauri/src/mcp.rs`, add `enabled: bool` to `NativeServer` (false when the name is in `disabled_names`) and fill it in `mcp_catalog`. Update `native_servers` callers and the existing test `native_servers_win_over_herdsman_servers_with_the_same_name`
- [x] T011 [P] [US2] In `src/lib/api.ts`, add `enabled: boolean` to `NativeMcpServer` and `mcpNativeToggle(projectId, name, enabled)` → `invoke<void>('mcp_native_toggle', { projectId, name, enabled })`
- [x] T012 [P] [US2] In `src/lib/devMock.ts`, give native servers in `mcp_catalog` an `enabled` field (one disabled, one name in two scopes), and handle `mcp_native_toggle` in mock state so toggling works in `?mock`
- [x] T013 [US2] In `src/components/settings/ProjectMcpSection.tsx`, replace the "· Read only" badge with a scope badge plus a `Switch` (`aria-label={`Enable ${server.name}`}`, toggling by name). Use a mutation that calls `api.mcpNativeToggle` and refreshes `project-mcp`, surface its error in the existing alert, and update the header comment and the helper text to say the toggles apply to new Claude sessions
- [x] T014 [P] [US2] Add tests in `tests/unit/mcpView.test.tsx`: native rows show a switch reflecting `enabled`; toggling calls `mcp_native_toggle` with the name; a failed toggle shows the error

## Phase 5: Polish

- [x] T015 Run `cargo test mcp`, the sidecar tests and `pnpm vitest run tests/unit/mcpView.test.tsx` through `hc` (one run at a time), plus `pnpm tsc --noEmit`
- [x] T016 Check the UI with Playwright on `http://localhost:1420/?mock` (MCP screen, light and dark) per the project UI-check rule

## Dependencies

- T001 → T002 → US1 (T003–T009) and US2 (T010–T014). US2 needs T003 for the command it calls.
- T006/T007 can run in parallel with the Rust tasks. T009 needs T006 and T007.
- T011 and T012 can run in parallel. T013 needs T011. T014 needs T013.

## Implementation Strategy

MVP = Phase 1–3. Session behaviour is then correct, and the toggle is reachable through the command. Phase 4 adds the visible switch. Phase 5 verifies.
