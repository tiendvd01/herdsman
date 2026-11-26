---
description: "Task list for 071 — sửa cấp skill và quản lý MCP theo project"
---

# Tasks: Sửa cấp skill và quản lý MCP theo project

**Input**: `specs/projects-workspaces/071-project-skills-mcps/` (plan.md, spec.md, research.md, data-model.md, contracts/mcp-and-launch.md, quickstart.md)

**Tests**: Constitution bắt buộc contract test cho giao thức sidecar và test cho thay đổi persistence, nên mỗi story có test nhắm đúng phần đổi. Chạy test qua `hc`, tuần tự.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Thêm `keyring = { version = "3", features = ["apple-native"] }` vào `[dependencies]` của `src-tauri/Cargo.toml` (kèm comment `# spec 071: MCP secrets in Keychain`) và chạy `cargo check` trong `src-tauri/`
- [X] T002 [P] Tạo `src-tauri/migrations/0008_mcp_servers.sql`: bảng `mcp_servers(id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, transport TEXT NOT NULL CHECK (transport IN ('stdio','http','sse')), command TEXT, args TEXT NOT NULL DEFAULT '[]', url TEXT, env_keys TEXT NOT NULL DEFAULT '[]', header_keys TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)` và `project_mcp_servers(project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE, PRIMARY KEY(project_id, server_id))`; thêm `include_str!("../migrations/0008_mcp_servers.sql")` vào danh sách migration trong `src-tauri/src/store.rs`

## Phase 2: Foundational

- [X] T003 Tạo `src-tauri/src/secrets.rs`: trait `SecretStore: Send + Sync { get(&self, account) -> AppResult<Option<String>>; set(&self, account, value) -> AppResult<()>; delete(&self, account) -> AppResult<()> }`, impl `Keychain` dùng `keyring::Entry::new("app.herdsman.mcp", account)` (lỗi → `AppError::new("keychain", "Could not access the Keychain")`, `NoEntry` → `None`/bỏ qua khi delete), và `MemorySecrets` (HashMap sau `parking_lot::Mutex`) cho test; khai báo `mod secrets;` trong `src-tauri/src/lib.rs` và thêm `secrets: Arc<dyn SecretStore>` vào `AppState` (`src-tauri/src/state.rs`), khởi tạo `Keychain`

**Checkpoint**: app build được, migration chạy, chưa đổi hành vi.

## Phase 3: User Story 1 — Gọi skill đã bật bằng slash command (P1) 🎯 MVP

**Goal**: Skill bật ở project hiện và chạy được từ menu `/` ở mọi session Claude mới, kể cả sau resume.

**Independent Test**: quickstart bước 1–3.

- [X] T004 [P] [US1] Trong `sidecar/src/engines/claude.mjs::mapCommands` thêm trường `plugin` = phần trước dấu `:` cuối của `c.name` khi có `:` (không có thì bỏ trường); cập nhật `SlashCommandInfo` trong `src/lib/types.ts` thêm `plugin?: string`
- [X] T005 [P] [US1] Thêm test vào `sidecar/test/commands.contract.test.mjs`: engine giả trả `supportedCommands()` gồm `{name:'herdsman-project:delivery'}` và `{name:'review', builtin}` → `listCommands()` trả `plugin: 'herdsman-project'` cho mục đầu và không có `plugin` cho mục sau
- [X] T006 [US1] Sửa `src/components/composer/Composer.tsx`: mỗi `SlashItem` có `cmd` (tên đầy đủ, dùng khi chèn/gửi), `label` (`'/' + name.split(':').at(-1)`) và `source?: 'Herdsman'` khi `plugin === 'herdsman-project'`; lọc `typedSlash` bằng `s.cmd.startsWith(text) || s.label.startsWith(text)`; menu hiển thị `label` và Badge `Herdsman` (variant `outline`) cạnh tên; chọn mục vẫn chèn `cmd` đầy đủ; mục từ plugin khác giữ hiển thị tên đầy đủ trong tooltip/description
- [X] T007 [P] [US1] Tạo `tests/unit/composerSlash.test.tsx`: mock `api.sessionListCommands` trả `herdsman-project:delivery` (plugin) và `review` (builtin); gõ `/deliv` → thấy `/delivery` và chữ `Herdsman`; chọn bằng Enter → ô soạn tin thành `/herdsman-project:delivery `; gõ `/herdsman-project:d` cũng khớp
- [X] T008 [US1] Trong `src-tauri/src/agent.rs::spawn_sidecar`: với `s.engine == "claude"`, nếu `project_skills::plugin_path(&st.session_dir(&s.id))` chưa tồn tại thì gọi `project_skills::prepare(st, ws, &s.id).await` và truyền warnings vào `spawn_with_skills`; giữ nguyên plugin đã có (không stage lại)
- [X] T009 [US1] (Không cần đổi: đường này chỉ mở hội thoại Codex) Trong `src-tauri/src/commands/history.rs` (dòng ~359, mở transcript thành session Herdsman mới) đổi `agent::spawn_sidecar` thành `agent::spawn_new_sidecar`, và khi lỗi xoá thêm `project_skills::plugin_path(...)` như `sessions.rs:68`
- [X] T010 [P] [US1] Thêm unit test trong `src-tauri/src/project_skills.rs` (module tests): stage vào session dir, xoá thư mục plugin, gọi lại `stage` → plugin được dựng lại với đúng skill đã bật; gọi khi plugin đã có thì không thay đổi nội dung (logic "chỉ stage khi thiếu" tách thành hàm `ensure_staged(data, cwd, session, config)` để test được)

**Checkpoint**: gõ `/deliv` trong session mới của project có skill bật → chạy được skill.

## Phase 4: User Story 2 — Quản lý MCP server theo project (P2)

**Goal**: Màn MCP riêng; thêm server, bật theo project; session Claude mới nhận server.

**Independent Test**: quickstart bước 4–7.

### Backend

- [X] T011 [US2] Tạo `src-tauri/src/mcp.rs` với kiểu `McpServerView`/`McpServerInput`/`NativeMcpServer` theo `contracts/mcp-and-launch.md` (serde snake_case như các command khác) và hàm `validate(input)`: `name` khớp `^[A-Za-z0-9_-]{1,64}$`; `transport` ∈ `stdio|http|sse`; `stdio` bắt buộc `command` không rỗng; `http`/`sse` bắt buộc `url` scheme `http`/`https`; khóa env/header không rỗng, không trùng; lỗi trả `AppError::new("mcp_invalid", <English message>)` có nêu trường
- [X] T012 [US2] Trong `src-tauri/src/mcp.rs` viết `native_servers(cwd)`: đọc `<git toplevel của cwd>/.mcp.json` → scope `project`, `~/.claude.json` → `mcpServers` (scope `user`) và `projects[<toplevel hoặc cwd>].mcpServers` (scope `local`); chỉ lấy `name`, `transport` (`type` hoặc `stdio` khi có `command`), `scope`, `source`; file thiếu/hỏng → bỏ qua; KHÔNG đọc giá trị env/header
- [X] T013 [US2] Trong `src-tauri/src/mcp.rs` viết các `#[tauri::command]`: `mcp_catalog(projectId)` (servers + `enabled` theo project + `conflict: "Claude already loads a server with this name"` khi trùng tên native, env/header chỉ trả `{key, set}`), `mcp_server_save(server)` (insert/update trong transaction, tên trùng → `mcp_duplicate`; ghi secret có `value` không rỗng vào `st.secrets` account `<id>/env/<KEY>`/`<id>/header/<Name>`, xoá account của khóa bị bỏ), `mcp_project_toggle(projectId, serverId, enabled)`; chạy I/O qua `spawn_blocking` như `project_skills::blocking`; đăng ký trong `src-tauri/src/lib.rs`
- [X] T014 [US2] Trong `src-tauri/src/mcp.rs` viết `prepare_launch(st, ws, sid, fresh: bool) -> Vec<String>`: nếu `fresh` thì lấy server bật cho `ws.project_id`, bỏ server trùng tên native (cảnh báo `"<name>: Claude already loads an MCP server with this name"`) và ghi id vào `sessions/<sid>/mcp-selection.json`; nếu không `fresh` thì đọc file đó (thiếu → không có MCP), bỏ id không còn tồn tại (cảnh báo `"<id>: MCP server was removed"`); dựng `Record<name, {type?, command, args, env} | {type, url, headers}>` với giá trị từ `st.secrets` (thiếu → cảnh báo `"<name>: missing secret <KEY>"` và bỏ server); ghi `sessions/<sid>/mcp-servers.json` với quyền `0o600` (`OpenOptions` + `mode`), trả cảnh báo; cảnh báo không bao giờ chứa giá trị bí mật
- [X] T015 [US2] Trong `src-tauri/src/agent.rs`: `spawn_new_sidecar` gọi `mcp::prepare_launch(.., fresh=true)`, `spawn_sidecar` gọi `fresh=false` (chỉ Claude); gộp cảnh báo với cảnh báo skill; khi file `mcp-servers.json` tồn tại thêm `--mcp-servers-file <path>` vào argv; khi tạo session thất bại xoá `mcp-selection.json` và `mcp-servers.json` cùng chỗ đang xoá plugin trong `commands/sessions.rs`, `commands/workspaces.rs`, `commands/history.rs`
- [X] T016 [P] [US2] Unit test trong `src-tauri/src/mcp.rs` dùng `MemorySecrets` và DB tạm: validate từ chối tên `a b`, stdio thiếu command, url `ftp://`; save rồi catalog không trả giá trị bí mật; `prepare_launch` fresh ghi selection + file 0600 có env đã giải; trùng tên với `.mcp.json` fixture → bị bỏ kèm cảnh báo; resume sau khi xoá server → cảnh báo, không lỗi

### Sidecar

- [X] T017 [US2] Trong `sidecar/src/index.mjs` thêm option `'mcp-servers-file': { type: 'string' }`; nếu có thì `readFileSync` + `JSON.parse`, `unlinkSync` ngay (cả khi parse lỗi), đưa vào `ctx.mcpServers`; lỗi → `emit('project_skills_warning', { message: 'Could not load MCP servers for this session' })`
- [X] T018 [US2] Trong `sidecar/src/engines/claude.mjs::start`: khi `ctx.mcpServers` có khóa thì `options.mcpServers = ctx.mcpServers`; trong `pump` ở `system/init`, với mỗi `msg.mcp_servers` có `status` là `failed` và tên thuộc `ctx.mcpServers` → `ctx.emit('project_skills_warning', { message: \`${name}: MCP server failed to connect\` })`
- [X] T019 [P] [US2] Tạo `sidecar/test/mcp.contract.test.mjs`: (a) engine giả nhận `options.mcpServers` đúng như `ctx.mcpServers`; (b) `startSidecar` với `--mcp-servers-file` → file bị xoá sau khi sidecar khởi động; (c) file JSON hỏng → event `project_skills_warning` và sidecar vẫn chạy; thêm hỗ trợ `mcpServersFile` vào `sidecar/test/helpers.mjs::startSidecar`

### Frontend

- [X] T020 [P] [US2] Thêm kiểu `McpServerView`, `McpServerInput`, `NativeMcpServer`, `McpCatalog` vào `src/lib/api.ts` và các hàm `mcpCatalog`, `mcpServerSave`, `mcpServerRemove`, `mcpProjectToggle`; thêm mock tương ứng trong `src/lib/devMock.ts` (một server stdio có env `API_TOKEN` set, một native `sora-pms` scope `user`) để màn MCP chạy được ở `?mock`
- [X] T021 [US2] Thêm `'mcp'` vào `Screen` trong `src/stores/useUiStore.ts`; thêm mục `{ id: 'mcp', name: 'MCP', Icon: Plug }` ngay sau Skills trong `src/components/layout/NavigationRail.tsx`
- [X] T022 [US2] Trong `src/components/layout/AppShell.tsx` cho `ProjectPickerSidebar` hiển thị khi `screen === 'mcp'` (dùng chung `skillsSelection`/`skillsProjectId`), và render section `MCP` (header `h1#mcp-title`, nội dung `ProjectMcpSection key={projectId}`, thông báo `Add a project in Projects to manage its MCP servers.` khi chưa có project)
- [X] T023 [US2] Tạo `src/components/settings/McpServerDialog.tsx`: dialog Add/Edit gồm Name, Transport (stdio/http/sse), Command + Arguments (một dòng, tách bằng `shell-words` phía client không cần — nhập từng dòng một arg trong Textarea), URL, danh sách Environment variables / Headers (key + value `type="password"`, placeholder `••••` khi đã set và để trống = giữ); lỗi `mcp_invalid`/`mcp_duplicate` hiện dưới form bằng `errMsg`; nhãn tiếng Anh
- [X] T024 [US2] Tạo `src/components/settings/ProjectMcpSection.tsx` theo mẫu `ProjectSkillsSection.tsx`: query `['project-mcp', projectId]`, ô tìm kiếm, nút Refresh và **Add server**; danh sách server Herdsman (tên, transport + command/url, Switch `Enable <name>`, nút Edit, nút Remove; `conflict` hiện dòng chữ cảnh báo màu `text-warning` kèm icon); nhóm "Loaded by Claude" với Badge `Claude project`/`Claude local`/`Claude user` · Read only; dòng `Enabled servers apply to new Claude sessions in this project.`; trạng thái loading/error/empty như màn Skills
- [X] T025 [P] [US2] Tạo `tests/unit/mcpView.test.tsx`: render `ProjectMcpSection` với api mock → thấy server, toggle gọi `mcpProjectToggle(projectId, id, true)`; server native không có Switch; dialog Add gửi đúng `McpServerInput`; giá trị env không xuất hiện trong DOM

**Checkpoint**: thêm server, bật cho A, session mới ở A dùng được tool của server.

## Phase 5: User Story 3 — Sửa và gỡ MCP server (P3)

**Goal**: Sửa định nghĩa và gỡ server an toàn.

**Independent Test**: quickstart bước 8.

- [X] T026 [US3] Trong `src-tauri/src/mcp.rs` viết `mcp_server_remove(id, dryRun)`: `dryRun` trả `{ affected_projects: [tên project] }`; xoá thật thì xoá hàng (cascade `project_mcp_servers`) rồi xoá mọi account Keychain của server; đăng ký trong `src-tauri/src/lib.rs`; test trong module: xoá server xoá luôn secret trong `MemorySecrets`
- [X] T027 [US3] Trong `ProjectMcpSection.tsx` nút Remove gọi `mcpServerRemove(id, true)` rồi mở `ConfirmDialog` (title `Remove MCP server?`, description liệt kê project bị ảnh hưởng hoặc `No projects use this server.`, `confirmLabel="Remove server"`, destructive); xác nhận gọi `mcpServerRemove(id, false)` và invalidate `['project-mcp']`; nút Edit mở `McpServerDialog` với dữ liệu hiện có
- [X] T028 [P] [US3] Bổ sung `tests/unit/mcpView.test.tsx`: Remove hiện tên project bị ảnh hưởng và gọi xoá sau khi xác nhận; Edit để trống value thì input gửi đi không có `value`

## Phase 6: Polish

- [X] T029 [P] Cập nhật `specs/technical.md`: mục launch session Claude (plugin skill, `--mcp-servers-file`, `mcp-selection.json`, Keychain service `app.herdsman.mcp`) và bảng lưu trữ (`mcp_servers`, `project_mcp_servers`)
- [X] T030 [P] Ghi chú vào `specs/projects-workspaces/062-manage-project-skills/spec.md` mục Assumptions: tên slash của skill Herdsman có tiền tố `herdsman-project:` và Composer hiển thị tên ngắn (xem spec 071)
- [X] T031 Chạy qua `hc`, tuần tự: `pnpm vitest run`, `cd sidecar && HERDSMAN_SKIP_SMOKE=1 npm test`, `cd src-tauri && cargo test`; sửa lỗi phát sinh
- [X] T032 Kiểm tra UI bằng Playwright ở `?mock`: màn MCP và menu slash, theme sáng và tối; `rg` giá trị env mẫu trong thư mục dữ liệu và log không có kết quả

## Dependencies & Execution Order

- Phase 1 → Phase 2 → các story.
- **US1** chỉ cần Phase 1–2 (thực tế không cần T001–T003), có thể làm đầu tiên và giao riêng.
- **US2** cần T001–T003. Trong US2: T011 → T012 → T013 → T014 → T015; T017 → T018; T020 → T021 → T022 → T023 → T024.
- **US3** cần T013 và T024.
- Polish sau cùng.

## Parallel Opportunities

- US1: T004, T005, T007, T010 khác file, chạy song song; T006 sau T004 (kiểu), T008/T009 độc lập với phần frontend.
- US2: backend (T011–T016), sidecar (T017–T019), frontend (T020–T025) là ba nhánh song song, chỉ gặp nhau ở kiểm thử tay.

## Implementation Strategy

1. MVP: Phase 3 (US1) — sửa lỗi người dùng đang gặp, giao được ngay.
2. Setup + Foundational rồi US2 (thêm và bật MCP).
3. US3 (sửa, gỡ).
4. Polish, chạy toàn bộ test và kiểm tra UI.
