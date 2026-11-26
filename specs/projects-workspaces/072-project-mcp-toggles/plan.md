# Implementation Plan: Bật tắt mọi MCP server theo project

**Branch**: `master` (nhánh hiện tại) | **Date**: 2026-11-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/projects-workspaces/072-project-mcp-toggles/spec.md`

## Summary

Mở rộng spec 071: server Claude tự nạp (`.mcp.json`, local và user scope trong `~/.claude.json`) có công tắc theo project, mặc định bật. Herdsman lưu tên server đã tắt cho từng project trong SQLite. Khi tạo session Claude mới, Herdsman ghi danh sách tên này vào thư mục session, và sidecar đưa nó vào flag settings của Agent SDK dưới dạng `deniedMcpServers`. Claude bỏ qua các server đó mà không cần sửa file cấu hình. Đã thử trực tiếp trên SDK 0.3.329 (xem [research.md](./research.md)).

## Technical Context

**Language/Version**: Rust 2021 (Tauri 2), Node 22 ESM (sidecar), TypeScript 5 + React 19

**Primary Dependencies**: `@anthropic-ai/claude-agent-sdk` 0.3.329 (option `settings`), rusqlite, TanStack Query, shadcn `Switch`

**Storage**: SQLite, migration mới `0009_mcp_native_disabled.sql`. Lựa chọn của session lưu ở file `mcp-denied.json` trong thư mục session.

**Testing**: `cargo test` (mcp.rs), `node --test` (sidecar contract), Vitest + Testing Library (mcpView), Playwright trên `?mock` để xem UI

**Target Platform**: macOS desktop

**Project Type**: desktop-app (Tauri + sidecar Node)

**Performance Goals**: Bật tắt phản hồi ngay (một lệnh SQLite). Tạo session không chậm hơn đáng kể (đọc thêm một file nhỏ).

**Constraints**: Không ghi `.mcp.json` hay `~/.claude.json`. Tên server không phải bí mật nên được phép đi qua file thường. Không cấp lại cho session đang chạy.

**Scale/Scope**: Vài chục server mỗi project.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Đánh giá |
|------------|----------|
| I. Agent sống độc lập với app | Đạt. Danh sách chặn nằm trong thư mục session và được sidecar đọc lúc khởi động hoặc resume, không phụ thuộc app đang mở. |
| II. Không mất dữ liệu hội thoại | Đạt. Không đụng event log hay transcript `~/.claude`. |
| III. Developer nắm quyền kiểm soát | Đạt. Người dùng chủ động bật tắt, và luồng quyền tool giữ nguyên. |
| IV. Hiển thị giàu thông tin | Không ảnh hưởng. |
| V. Tương thích hệ sinh thái | Đạt. Dùng option có sẵn của Agent SDK (`settings.deniedMcpServers`), không sửa engine. `claude --resume` ngoài Herdsman vẫn chạy, nhưng nạp theo cấu hình gốc (đã ghi trong Assumptions của spec). |
| VI. Project → Workspace → Session | Đạt. Lựa chọn gắn với project, không thêm khái niệm tổ chức mới. |

Sau Phase 1, mọi nguyên tắc vẫn đạt và không có vi phạm cần ghi vào Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/projects-workspaces/072-project-mcp-toggles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/native-toggle.md
└── tasks.md
```

### Source Code (repository root)

```text
src-tauri/
├── migrations/0009_mcp_native_disabled.sql   # bảng mới
├── src/store.rs                              # đăng ký migration
├── src/mcp.rs                                # catalog trả enabled, lệnh mcp_native_toggle, ghi mcp-denied.json
├── src/agent.rs                              # truyền --mcp-denied-file cho sidecar
└── src/lib.rs                                # đăng ký lệnh
sidecar/
├── src/index.mjs                             # đọc --mcp-denied-file
├── src/engines/claude.mjs                    # options.settings.deniedMcpServers
└── test/mcp.contract.test.mjs                # kiểm tra option được truyền
src/
├── lib/api.ts, lib/devMock.ts                # kiểu + lệnh mới, dữ liệu mock
└── components/settings/ProjectMcpSection.tsx # Switch cho mục "Loaded by Claude"
tests/unit/mcpView.test.tsx                   # bật tắt server Claude tự nạp
```

**Structure Decision**: Giữ nguyên cấu trúc của spec 071. Mọi logic MCP vẫn nằm trong `src-tauri/src/mcp.rs`.

## Complexity Tracking

Không có vi phạm.
