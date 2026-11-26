# Implementation Plan: Sửa cấp skill và quản lý MCP theo project

**Branch**: `master` (Git) | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

**Input**: `specs/projects-workspaces/071-project-skills-mcps/spec.md`
**Spec Kit feature**: `071-project-skills-mcps`

## Summary

**Lỗi skill**: staging plugin và nạp vào SDK đều chạy đúng. SDK báo skill dưới tên `herdsman-project:<skill>`, còn Composer lọc slash bằng `startsWith`, nên gõ `/deliv` không bao giờ ra skill ([research R1](research.md#r1-vì-sao-skill-đã-bật-không-slash-được)). Sửa Composer để khớp và hiện tên ngắn kèm nhãn `Herdsman`, chọn thì chèn tên đầy đủ. Đồng thời stage lại plugin khi thư mục plugin bị mất lúc resume, và stage cho session mở từ History.

**MCP**: thêm màn **MCP** riêng trên thanh điều hướng. Định nghĩa server lưu trong SQLite, giá trị env/header lưu trong Keychain. Khi spawn session Claude, Rust ghi file tạm 0600 chứa các server đã bật, sidecar đọc rồi xoá và đưa vào `options.mcpServers`. Server Claude tự nạp hiện chỉ xem và thắng khi trùng tên.

## Technical Context

- **Language/Version** — Rust 2021, TypeScript/React 18, Node.js theo repo.
- **Primary Dependencies** — Tauri 2, TanStack Query, rusqlite, Claude Agent SDK `0.3.329`. Thêm crate `keyring` (feature `apple-native`) cho Keychain.
- **Storage** — Migration `0008_mcp_servers.sql` (bảng `mcp_servers`, `project_mcp_servers`). Keychain service `app.herdsman.mcp`. Session thêm `mcp-selection.json`.
- **Testing** — Vitest (Composer slash, màn MCP), `cargo test` (validate, catalog, launch file, dọn Keychain qua trait giả), `node --test` cho sidecar (cờ `--mcp-servers-file`, trường `plugin`). Chạy test qua `hc`, tuần tự.
- **Target Platform / Project Type** — App desktop macOS trước; đọc `~/.claude.json` và `.mcp.json` theo đường dẫn tương thích Linux.
- **Performance Goals** — Danh sách slash có skill trong 3 giây sau khi session sẵn sàng (SC-002). Màn MCP tải dưới 1 giây với 20 server.
- **Constraints / Scale** — Không đưa bí mật vào argv, SQLite, event log hay log. Không ghi vào `.mcp.json` hay `~/.claude.json`. Chỉ Claude.

## Constitution Check

| Nguyên tắc | Trước nghiên cứu | Sau thiết kế |
|---|---|---|
| I. Agent sống độc lập với app | Đạt | Sidecar vẫn chạy qua `hc`. File MCP tạm được ghi trước spawn và sidecar tự xoá, app tắt sau khi spawn không ảnh hưởng. Resume dựng lại từ `mcp-selection.json`. |
| II. Không mất dữ liệu hội thoại | Đạt | Không đổi event log. Cảnh báo dùng lại event `project_skills_warning` sẵn có. Trường `plugin` của lệnh là tùy chọn, tương thích ngược. |
| III. Developer kiểm soát agent | Đạt | Tool MCP vẫn qua `canUseTool`. Chỉ cấp server người dùng bật. |
| IV. Hiển thị giàu thông tin nhưng không chậm | Đạt | Lọc slash là thao tác trong bộ nhớ. Màn MCP dùng query theo project. |
| V. Tương thích hệ sinh thái | Đạt | Dùng `plugins` và `mcpServers` chính thức của SDK, không sửa cấu hình Claude. Thêm contract test cho cờ mới. |
| VI. Project → Workspace → Session | Đạt | Lựa chọn MCP thuộc project. Không thêm khái niệm tổ chức mới. |
| Bảo mật credential | Đạt | Giá trị env/header nằm trong Keychain. Chuyển cho sidecar qua file 0600 sống ngắn, không qua argv. |
| Giao diện | Đạt | Dùng component và token theme sẵn có. Mục đang chọn trên rail dùng `secondary`. Switch bật/tắt có nhãn. Badge `Herdsman`/`Claude` và cảnh báo xung đột dùng vai trò màu như màn Skills, có chữ đi kèm. Kiểm tra cả theme sáng và tối. Nhãn tiếng Anh. |

## Project Structure

### Documentation (this feature)

```text
specs/projects-workspaces/071-project-skills-mcps/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/mcp-and-launch.md
└── tasks.md            # /speckit-tasks
```

### Source Code

```text
src-tauri/
├── migrations/0008_mcp_servers.sql        # mới
├── Cargo.toml                             # + keyring
└── src/
    ├── mcp.rs                             # mới: catalog, validate, save/remove/toggle, native discovery, launch file
    ├── secrets.rs                         # mới: trait SecretStore + Keychain impl
    ├── agent.rs                           # spawn: stage khi thiếu plugin, ghi file MCP, cờ --mcp-servers-file
    ├── project_skills.rs                  # prepare dùng lại cho resume khi thiếu plugin
    ├── commands/history.rs                # mở transcript → spawn_new_sidecar
    ├── store.rs                           # include migration 0008
    └── lib.rs                             # đăng ký command mcp_*
sidecar/
├── src/index.mjs                          # cờ --mcp-servers-file
├── src/engines/claude.mjs                 # options.mcpServers, trường plugin, cảnh báo server lỗi
└── test/mcp.contract.test.mjs             # mới
src/
├── stores/useUiStore.ts                   # Screen += 'mcp'
├── components/layout/NavigationRail.tsx   # mục MCP
├── components/layout/AppShell.tsx         # màn MCP dùng chung bộ chọn project
├── components/settings/ProjectMcpSection.tsx   # mới
├── components/settings/McpServerDialog.tsx     # mới
├── components/composer/Composer.tsx       # lọc theo tên ngắn, nhãn Herdsman
├── lib/api.ts, lib/types.ts, lib/devMock.ts
tests/unit/
├── composerSlash.test.tsx                 # mới
└── mcpView.test.tsx                       # mới
specs/technical.md                         # cập nhật launch và lưu trữ
```

**Structure Decision**: Giữ bố cục Tauri + sidecar + React hiện có. MCP tách module `mcp.rs` song song `project_skills.rs`. Phần Keychain tách `secrets.rs` để test được bằng bản giả.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Thêm dependency `keyring` | Constitution yêu cầu credential trong Keychain, repo chưa có lớp Keychain | CLI `security` đưa giá trị vào argv; lưu SQLite vi phạm constitution |
| File tạm `mcp-servers.json` trong dữ liệu session | `hc run` không truyền env, argv lộ trong `hc ls` | Sidecar đọc Keychain trực tiếp cần native module Node |
