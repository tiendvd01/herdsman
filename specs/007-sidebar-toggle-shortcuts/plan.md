# Implementation Plan: Phím tắt ẩn/hiện hai sidebar

**Branch**: `007-sidebar-toggle-shortcuts` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-sidebar-toggle-shortcuts/spec.md`

## Summary

⌘B ẩn/hiện sidebar trái, ⌘R ẩn/hiện side panel phải (Ctrl ngoài macOS). Một module `sidebarShortcuts.ts` có hàm thuần nhận diện phím và một listener `keydown` ở capture phase gắn từ `AppShell`, chặn hành vi mặc định (chèn ký tự, ⌘R tải lại), bỏ qua khi có hộp thoại mở hoặc phím lặp, và chuyển focus về ô nhập khi cột đang có focus bị ẩn. Tooltip header và command palette hiện phím tắt. Chỉ đổi frontend, dùng lại `sidebarOpen` / `rightOpen` đã có.

## Technical Context

**Language/Version**: TypeScript 5.8

**Primary Dependencies**: React 18, Zustand, Radix Tooltip/Dialog — không thêm dependency

**Storage**: không đổi (dùng `sidebarOpen`, `rightOpen` đã persist trong `useUiStore`)

**Testing**: Vitest + Testing Library (jsdom); Playwright trên `http://localhost:1420/?mock`

**Target Platform**: macOS desktop (Tauri 2), sau đó Linux

**Project Type**: desktop-app

**Performance Goals**: ẩn/hiện trong cùng frame với lần nhấn phím (SC-002)

**Constraints**: ⌘R không tải lại trang; không chèn ký tự vào ô đang focus; không chạy khi có dialog

**Scale/Scope**: 1 module mới, sửa `AppShell`, `WorkspaceView` (tooltip), `CommandDialog` (lệnh palette), 1 file test

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Đánh giá |
|---|---|
| I. Agent sống độc lập với app | Đạt. Chỉ đổi giao diện; app tắt không ảnh hưởng agent. |
| II. Không mất dữ liệu hội thoại | Đạt. Chặn ⌘R tải lại; nội dung đang gõ giữ nguyên (FR-004). |
| III. Developer nắm quyền kiểm soát | Không ảnh hưởng; phím tắt không chạy khi hộp thoại (gồm hộp duyệt quyền) đang mở. |
| IV. Hiển thị giàu thông tin nhưng không chậm | Không ảnh hưởng. |
| V. Tương thích hệ sinh thái | Không ảnh hưởng. |
| VI. Giữ đơn giản | Đạt. Không store mới, không dependency mới. |

Không có vi phạm. **Re-check sau Phase 1**: giữ nguyên.

## Project Structure

### Documentation (this feature)

```text
specs/007-sidebar-toggle-shortcuts/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/sidebar-shortcuts.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── lib/sidebarShortcuts.ts             # mới: matchSidebarShortcut, installSidebarShortcuts, SHORTCUT_LABEL
└── components/
    ├── layout/AppShell.tsx             # gắn installSidebarShortcuts; <main tabIndex=-1> làm chỗ nhận focus dự phòng
    ├── layout/WorkspaceView.tsx        # tooltip SidebarToggle / RightPanelToggle kèm phím tắt
    └── command/CommandDialog.tsx       # lệnh "Hide/Show sidebar" (⌘B); thêm kbd ⌘R cho lệnh side panel

tests/unit/sidebarShortcuts.test.ts     # mới
```

**Structure Decision**: Frontend dưới `src/`, test dưới `tests/unit/`. Không chạm `src-tauri/`, `sidecar/`.

## Complexity Tracking

Không có.
