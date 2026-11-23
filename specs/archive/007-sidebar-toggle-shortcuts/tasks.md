---
description: "Task list: phím tắt ẩn/hiện hai sidebar"
---

# Tasks: Phím tắt ẩn/hiện hai sidebar

**Input**: Design documents from `/specs/007-sidebar-toggle-shortcuts/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sidebar-shortcuts.md, quickstart.md

**Tests**: Plan có `tests/unit/sidebarShortcuts.test.ts`.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

Không cần.

---

## Phase 2: Foundational

- [X] T001 Tạo `src/lib/sidebarShortcuts.ts` theo contracts/sidebar-shortcuts.md: `SidebarSide`, `SHORTCUT_LABEL` (macOS `'⌘B'`/`'⌘R'`, nơi khác `'Ctrl+B'`/`'Ctrl+R'`, dựa `IS_MAC` từ `src/lib/platform.ts`), `matchSidebarShortcut(e, { isMac, dialogOpen })` (nhận `e.code` `KeyB`/`KeyR`, fallback `e.key`; macOS cần `metaKey && !ctrlKey`, nơi khác `ctrlKey && !metaKey`; `null` nếu `shiftKey`, `altKey`, `repeat`, hoặc `dialogOpen`), `isDialogOpen()` (`useUiStore.getState().cmdOpen` hoặc có `[role="dialog"]`, `[role="alertdialog"]` với `data-state="open"` trong DOM), `toggleSidebar(side)` (ghi nhớ activeElement có nằm trong `aside` của cột đó không — sidebar trái là `aside` đầu trong AppShell, side panel là `aside[aria-label="Side panel"]`; đổi `sidebarOpen`/`rightOpen`; nếu focus nằm trong cột vừa ẩn thì `requestAnimationFrame` → focus `textarea[id^="composer-"]` không disabled, không có thì `main`), và `installSidebarShortcuts()` gắn `keydown` capture trên `window`, khi khớp thì `preventDefault()` + `stopPropagation()` + `toggleSidebar`, trả hàm gỡ

---

## Phase 3: User Story 1 - ⌘B sidebar trái (P1) 🎯 MVP

**Independent Test**: quickstart 1, 3, 6.

- [X] T002 [P] [US1] Test `tests/unit/sidebarShortcuts.test.ts`: `matchSidebarShortcut` — ⌘B → `'left'` (mac), Ctrl+B → `'left'` (non-mac), Ctrl+B trên mac → null, ⌘⇧B / ⌘⌥B → null, repeat → null, dialogOpen → null; `installSidebarShortcuts` — dispatch ⌘B trên một `<textarea>` có giá trị "hello" → `sidebarOpen` đảo, `defaultPrevented === true`, textarea vẫn "hello"
- [X] T003 [US1] Sửa `src/components/layout/AppShell.tsx`: `useEffect(() => installSidebarShortcuts(), [])`; thêm `tabIndex={-1}` và `outline-none` cho `<main>`; đánh dấu `aside` trái bằng `aria-label="Sidebar"` trong `src/components/layout/Sidebar.tsx` nếu chưa có để `toggleSidebar` tìm được

---

## Phase 4: User Story 2 - ⌘R side panel phải (P1)

**Independent Test**: quickstart 2.

- [X] T004 [P] [US2] Bổ sung test: ⌘R → `'right'`; dispatch ⌘R → `rightOpen` đảo, `defaultPrevented` (không tải lại), `rightTab` và `rightWidth` không đổi; khi có `[role="dialog"]` trong DOM → không đổi gì

---

## Phase 5: User Story 3 - Hiện phím tắt (P2)

**Independent Test**: quickstart 7.

- [X] T005 [P] [US3] Sửa `src/components/layout/WorkspaceView.tsx`: tooltip của `SidebarToggle` và `RightPanelToggle` hiện nhãn cũ + `<Kbd>` với `SHORTCUT_LABEL.left` / `.right` (Kbd từ `@/components/ui/button`); `aria-keyshortcuts` trên nút (`Meta+B`/`Control+B`, `Meta+R`/`Control+R`)
- [X] T006 [P] [US3] Sửa `src/components/command/CommandDialog.tsx`: thêm lệnh `sidebarOpen ? 'Hide sidebar' : 'Show sidebar'` (icon `PanelLeft`, `kbd: SHORTCUT_LABEL.left`, run `ui.setSidebarOpen(!sidebarOpen)`) và thêm `kbd: SHORTCUT_LABEL.right` cho lệnh side panel có sẵn

---

## Phase 6: Polish

- [X] T007 `pnpm typecheck` và `pnpm test`
- [X] T008 Kiểm bằng Playwright trên `?mock` theo quickstart.md (⌘B/⌘R, không reload, giữ nội dung ô nhập, dialog mở, tooltip, palette; chụp light/dark)

## Dependencies

- T001 → mọi task. T002, T004 cùng file test nên làm tuần tự; T005, T006 song song với test.
- US1 và US2 dùng chung T001/T003; US3 độc lập.

## Implementation Strategy

MVP = T001 + T003 (cả hai phím chạy được). Sau đó US3 (hiển thị) và Polish.
