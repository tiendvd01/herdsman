# Implementation Plan — Panel History cho phiên agent

**Branch** — `master` | **Date** — 2026-11-25 | **Spec** — [spec.md](spec.md)

## Summary

Thêm History vào panel bên phải và mở phiên trong vùng hội thoại chính. Tái sử dụng tìm kiếm FTS và transcript Claude, đọc hai nguồn độc lập để một nguồn lỗi vẫn hiển thị được nguồn còn lại.

## Technical Context

- **Language/Version** — Rust và TypeScript của repo
- **Primary Dependencies** — Tauri, React, TanStack Query, shadcn/ui; dùng các dependency hiện có
- **Storage** — SQLite FTS, event log Herdsman và transcript local của Claude Code CLI
- **Testing** — Cargo, Vitest và kịch bản trong [quickstart.md](quickstart.md)
- **Target Platform** — Desktop macOS, sau đó Linux
- **Project Type** — Desktop app
- **Performance Goals** — p95 dưới 1 giây với 1.000 phiên theo kịch bản nghiệm thu
- **Constraints** — Hoạt động local, giữ nguyên transcript gốc và dùng tiếng Anh cho UI
- **Scale/Scope** — Duyệt hoặc tìm ở workspace hiện tại và toàn app

## Constitution Check

Đạt trước và sau thiết kế. I và III giữ luồng xem lịch sử độc lập với tiến trình và quyền của agent. II dùng luồng replay/import hiện có và kiểm tra nội dung gốc sau khi mở lại app. IV dùng Rich Conversation hiện tại và component/theme chung. V tái sử dụng dữ liệu từ engine hiện có. VI giữ Project → Workspace → Session kể cả khi mở phiên CLI qua luồng import.

## Project Structure

### Documentation (this feature)

`specs/history-search/063-session-history-panel/{spec.md,plan.md,research.md,data-model.md,quickstart.md,contracts/,tasks.md}`

### Source Code (repository root)

- `src/components/layout/WorkspaceView.tsx` và `src/components/panels/RightPanel.tsx` quản lý điểm vào History.
- `src/components/history/HistoryPanel.tsx` hiển thị danh sách và thao tác mở phiên.
- `src/lib/{api,types,devMock}.ts` kết nối dữ liệu với UI và browser preview.
- `src-tauri/src/{commands/history,store,claude_history}.rs` phục vụ duyệt và tìm lịch sử.

## Complexity Tracking

Dùng dữ liệu, giao thức và component hiện có. Không có dependency hoặc storage mới.
