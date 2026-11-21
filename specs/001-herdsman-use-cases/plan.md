# Implementation Plan: Herdsman — GUI quản lý agent theo Project → Workspace → Session

**Branch**: `001-herdsman-use-cases` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-herdsman-use-cases/spec.md`

## Summary

Herdsman là app desktop Tauri 2 hiển thị hội thoại agent (Claude qua Agent SDK, Codex qua `codex app-server`) dạng GUI, tổ chức theo Project → Workspace → Session. Mỗi session là một sidecar `herdsman-agent` (Node) chạy trong terminal của `hc`, nên agent sống độc lập với app. App nối sidecar qua Unix socket và phát lại từ event log NDJSON. Workspace có thư mục làm việc riêng (thư mục project hoặc `git worktree`). Duyệt quyền qua `canUseTool` với 3 chế độ. Giao diện dùng shadcn/ui minimal. Kiến trúc nền theo [technical.md](../technical.md); phần bổ sung (workspace, worktree, chế độ quyền, FTS, shadcn) ở [research.md](./research.md).

## Technical Context

**Language/Version**: Rust (stable, edition 2021); TypeScript 5.x; Node 20 (đóng gói kèm app cho sidecar)

**Primary Dependencies**: Tauri 2 (+ plugin notification, dialog); tokio, serde, sqlx (SQLite); React 18, Zustand (immer, subscribeWithSelector), TanStack Query, TanStack Virtual; Tailwind CSS v4 + shadcn/ui (Radix, lucide-react, Geist); react-markdown + remark-gfm + rehype-sanitize, Shiki, mermaid (worker), vega-embed, KaTeX, @codemirror/merge, xterm.js; `@anthropic-ai/claude-agent-sdk` (phiên bản cố định); `hc` ≥ 0.1.21

**Storage**: SQLite (projects, workspaces, sessions, accounts, FTS5 `message_fts`); event log NDJSON theo session; transcript gốc của engine (chỉ đọc); Keychain cho API key

**Testing**: cargo test; node --test + smoke test Agent SDK; Vitest + Testing Library; WebdriverIO + tauri-driver (Linux) cho E2E; kịch bản thủ công ở [quickstart.md](./quickstart.md) trên macOS

**Target Platform**: macOS (Apple Silicon) trước, Linux sau

**Project Type**: desktop-app (Tauri: Rust backend + WebView frontend) + sidecar Node

**Performance Goals**: stream trễ ≤200 ms; trạng thái ≤1 s; thông báo ≤2 s; mở app với 10 session <5 s; tìm kiếm <1 s / 1.000 session; ≥60 fps khi cuộn 5.000+ message (SC-006 → SC-010)

**Constraints**: agent không bao giờ là tiến trình con của app; không mất event; không auto-allow ngoài chế độ đã chọn; chạy offline (font đóng gói); nội dung agent là không tin cậy

**Scale/Scope**: 1 người dùng, ~10–50 project, hàng trăm workspace, ~1.000 session, hội thoại tới 5.000+ message; 12 user story, ~15 màn hình/panel

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Kiểm tra | Kết quả |
|---|---|---|
| I. Agent sống độc lập với app | Sidecar và background task chạy bằng `terminal.run` + `outlive_parent`; app tự nối lại qua label + socket; mọi tính năng mới đã trả lời "app tắt giữa chừng thì sao" (worktree: tạo/xoá đồng bộ, không ảnh hưởng tiến trình; xoá project: kill qua `hc` chứ không qua app) | ✅ |
| II. Không mất dữ liệu | Event log append-only, `seq` không reset; app phát lại từ `last_seen_seq`; không sửa/xoá transcript gốc (kể cả khi xoá workspace/project); giao thức có `proto` | ✅ |
| III. Developer kiểm soát agent | Mọi tool cần quyền qua `canUseTool`; 3 chế độ là `permissionMode` người dùng chọn rõ, `bypass` cần xác nhận + badge; request không hết hạn; interrupt/Log/kill luôn có; trạng thái + thông báo | ✅ |
| IV. Hiển thị giàu nhưng không chậm | Render đủ loại nội dung; delta chỉ re-render message đang chạy; virtual list; Mermaid/chart lazy + fallback source; rehype-sanitize | ✅ |
| V. Tương thích, không thay engine | Agent SDK + codex app-server qua adapter; UI chỉ biết `AgentEvent`; label `hc`, `hc send`, `claude --resume`; cố định phiên bản SDK + smoke test | ✅ (OSC 7501 còn rủi ro, xem R10) |
| VI. Project → Workspace → Session | Đúng ba tầng; worktree gắn workspace; không có space; Mods/remote/cloud ngoài phạm vi | ✅ |

**Sau Phase 1**: data-model và contracts giữ nguyên các điểm trên (session.cwd = workspace.work_dir; xoá chỉ đụng dữ liệu app). Không có vi phạm → không cần Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-herdsman-use-cases/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── sidecar-socket.md
│   ├── tauri-commands.md
│   └── hc-integration.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src-tauri/                     # Rust backend (crate herdsman)
├── src/
│   ├── main.rs
│   ├── commands/              # Tauri commands theo contracts/tauri-commands.md
│   │   ├── project.rs  workspace.rs  session.rs  task.rs  search.rs  settings.rs
│   ├── hc_client/             # JSON-RPC tới hc, types sinh từ hc schema
│   ├── agent_client/          # socket tới sidecar, replay + batch event
│   ├── store/                 # sqlx SQLite, migrations, FTS5
│   ├── git/                   # git worktree qua CLI
│   └── notify.rs
├── migrations/
└── tests/                     # integration: hc, socket contract, persistence

sidecar/                       # herdsman-agent (Node), port từ devdy/sidecar
├── src/
│   ├── index.mjs              # entry, đọc args, mở socket
│   ├── engines/claude.mjs     # Agent SDK, canUseTool, permissionMode
│   ├── engines/codex.mjs      # codex app-server adapter
│   ├── eventlog.mjs  socket.mjs  osc.mjs  stdin.mjs
└── test/                      # contract + smoke test SDK

src/                           # Frontend React + TS
├── components/
│   ├── ui/                    # shadcn/ui
│   ├── layout/                # Sidebar, WorkspaceBar, SessionTabs, RightPanel
│   ├── conversation/          # MessageList, Markdown, Mermaid, Chart, ToolCard, Diff
│   ├── composer/              # ô nhập, ảnh, slash
│   ├── permission/            # PermissionDialog, ModeSwitcher
│   ├── workspace/             # CreateWorkspaceDialog, Archive/Delete
│   ├── history/               # HistoryPopover, Search
│   └── panels/                # Agents, BackgroundTasks, Files, Log (xterm)
├── stores/                    # useProjectStore, useSessionStore, usePermissionStore, useStatusStore
├── lib/                       # invoke wrappers, types sinh từ Rust
└── styles/                    # Tailwind, token zinc Light/Dark, Geist
tests/
├── unit/                      # Vitest
└── e2e/                       # WebdriverIO + tauri-driver
```

**Structure Decision**: Một repo, ba phần: `src-tauri/` (Rust backend), `sidecar/` (Node, đóng gói làm resource của Tauri), `src/` (frontend). Đây là cấu trúc chuẩn của Tauri 2, cộng thêm sidecar theo D3/D6 của technical.md.

## Phasing (theo ưu tiên story)

| Giai đoạn | Story | Ghi chú |
|---|---|---|
| PoC | – | OSC 7501, sidecar trong `hc` nối lại socket, `hc send` nhiều dòng |
| MVP (P1) | US4 → US5 → US1 → US3 → US2 | Project, workspace (thư mục project), session Claude, render, quyền 3 chế độ, persistence |
| P2 | US6, US7, US8, US9 | Trạng thái/thông báo, worktree + archive/xoá, lịch sử/FTS, Log |
| P3 | US10, US11, US12 + Codex | Background task, cây agent, tương thích, adapter Codex |

## Tài liệu liên quan

- `specs/technical.md` đã cập nhật khớp plan (D8–D10, §4.3–4.6, §5.1b) ngày 2026-11-21.

## Complexity Tracking

Không có vi phạm constitution.
