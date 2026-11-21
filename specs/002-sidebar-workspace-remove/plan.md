# Implementation Plan: Xoá / archive workspace ngay từ sidebar

**Branch**: `002-sidebar-workspace-remove` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-sidebar-workspace-remove/spec.md`

## Summary

Thêm nút menu "⋯" (Rename / Archive / Delete workspace) vào từng dòng workspace trong sidebar. Backend đã có đủ lệnh (`workspace_rename`, `workspace_archive`, `workspace_delete`, `workspace_dirty_check`) và đã dừng session trước khi archive/xoá, nên thay đổi chỉ nằm ở frontend: tách `WorkspaceMenu` để dùng chung giữa header và sidebar, sửa lỗi bỏ chọn workspace sai (luôn bỏ chọn kể cả khi thao tác trên workspace không đang mở), và nói rõ session đang chạy sẽ dừng trong hộp xác nhận xoá.

## Technical Context

**Language/Version**: TypeScript 5.8 (frontend); Rust 2021 (backend, không đổi)

**Primary Dependencies**: React 18, Radix DropdownMenu/AlertDialog, TanStack Query, Zustand

**Storage**: SQLite qua backend hiện có; không đổi schema

**Testing**: Vitest + Testing Library (jsdom); kiểm giao diện bằng Playwright trên `http://localhost:1420/?mock`

**Target Platform**: macOS desktop (Tauri 2)

**Project Type**: desktop-app

**Performance Goals**: workspace biến khỏi sidebar trong ≤ 1 giây sau xác nhận (SC-004)

**Constraints**: không thêm lệnh backend; không đổi hành vi menu ở header

**Scale/Scope**: 1 component dùng chung, 2 chỗ gắn (header, sidebar), 1 test mới

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Đánh giá |
|---|---|
| I. Agent sống độc lập với app | Đạt. Không đổi cách chạy agent. Archive/xoá vẫn qua backend, backend dừng session trong `hc` trước khi bỏ workspace (FR-008). Nếu app tắt giữa chừng thì thao tác chưa gửi đi không có tác dụng; thao tác đã gửi do backend làm trọn. |
| II. Không mất dữ liệu hội thoại | Đạt. Xoá vẫn chỉ sau hộp xác nhận; archive giữ lịch sử; transcript gốc không đụng tới. |
| III. Developer nắm quyền kiểm soát | Đạt. Mọi thao tác phá huỷ có hộp xác nhận; cảnh báo file chưa commit giữ nguyên (FR-008c spec 001). |
| IV. Hiển thị giàu thông tin nhưng không chậm | Không ảnh hưởng. |
| V. Tương thích hệ sinh thái | Không ảnh hưởng. |
| VI. Project → Workspace → Session | Đạt. Không thêm khái niệm; chỉ thêm chỗ thao tác. |

Không có vi phạm → bỏ trống Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-sidebar-workspace-remove/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── sidebar-workspace-menu.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── workspace/WorkspaceMenu.tsx   # tách trigger; bỏ chọn chỉ khi là workspace đang mở; nhãn a11y
│   └── layout/
│       ├── Sidebar.tsx               # gắn menu vào dòng workspace (hiện khi hover/focus)
│       └── WorkspaceView.tsx         # header dùng WorkspaceMenu như cũ
└── lib/devMock.ts                    # mock workspace_archive/delete/rename/dirty_check để thử trên ?mock

tests/unit/
└── workspaceMenu.test.tsx            # mới: menu có đủ mục; không bỏ chọn workspace khác
```

**Structure Decision**: Frontend React hiện có dưới `src/`, test dưới `tests/unit/`. Không chạm `src-tauri/` hay `sidecar/`.

## Complexity Tracking

Không có.
