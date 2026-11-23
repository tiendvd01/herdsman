---
description: "Task list: kéo đổi độ rộng hai sidebar"
---

# Tasks: Kéo đổi độ rộng hai sidebar

**Input**: Design documents from `/specs/004-resizable-sidebars/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/resize-handle.md, quickstart.md

**Tests**: Plan có 2 file test unit (`tests/unit/layout.test.ts`, `tests/unit/resizeHandle.test.tsx`) nên có task test.

**Organization**: Theo user story. US1 và US2 cùng P1 nhưng tách phase để test độc lập.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

Không cần: không thêm dependency, cấu trúc dự án đã có.

---

## Phase 2: Foundational (chặn mọi story)

- [X] T001 [P] Tạo `src/lib/layout.ts`: hằng số `LEFT = { min: 200, max: 480, def: 256 }`, `RIGHT = { min: 280, max: 720, def: 340, wide: 560 }`, `MAIN_MIN = 400`, `KEY_STEP = 16`; hàm `clampWidth(px, { min, max, def })` (không phải số hữu hạn → `def`; làm tròn; kẹp [min, max]); hàm `layoutWidths({ left, right, leftOpen, rightOpen, viewport })` trả `{ left, right, leftMax, rightMax }` theo contracts/resize-handle.md (sidebar đóng = 0px; thiếu chỗ cho `MAIN_MIN` thì co `right` trước tới `RIGHT.min`, rồi `left` tới `LEFT.min`; `leftMax`/`rightMax` = max chừa `MAIN_MIN`, không dưới min)
- [X] T002 Sửa `src/stores/useUiStore.ts`: thêm `sidebarWidth` (mặc định 256) và `rightWidth` (mặc định 340), action `setSidebarWidth`/`setRightWidth` luôn qua `clampWidth`; bỏ `rightWide`/`setRightWide`; persist `partialize` lưu hai trường mới; `version: 1` và `migrate` v0→v1: `rightWidth = rightWide ? 560 : 340`, `sidebarWidth = 256`, xoá `rightWide`; `merge` kẹp giá trị đọc được bằng `clampWidth` (dữ liệu hỏng → mặc định)
- [X] T003 [P] Tạo `src/components/layout/ResizeHandle.tsx` theo contracts/resize-handle.md: props `side, label, value, min, max, onChange, onReset`; `role="separator"`, `aria-orientation="vertical"`, `aria-label`, `aria-valuenow/min/max`, `tabIndex=0`, không có `data-tauri-drag-region`; `absolute inset-y-0` đè lên border (vùng bắt chuột ~8px, vạch 1px giữa, đổi màu `bg-primary/40` khi hover/focus/kéo), `cursor-col-resize`, `z-20`; pointerdown → `setPointerCapture`, ghi `startX`/`startW`, gắn class `resizing` lên `document.body`; pointermove → tính `startW + dx` (side `'right'`: `startW - dx`), kẹp [min, max], gọi `onChange` qua `requestAnimationFrame` (tối đa 1 lần/frame); pointerup/pointercancel/lostpointercapture → dọn class và rAF; dblclick/Enter → `onReset`; ArrowLeft/ArrowRight ∓/± `KEY_STEP` (đảo chiều khi side `'right'`); Home/End → min/max
- [X] T004 [P] Thêm CSS `body.resizing { cursor: col-resize; user-select: none; }` và `body.resizing * { cursor: col-resize !important; }` vào `src/styles/globals.css`
- [X] T005 Tạo hook `useViewportWidth()` trong `src/lib/useLayoutWidths.ts` (tách khỏi `layout.ts` để tránh vòng import với store) (đọc `window.innerWidth`, cập nhật khi `resize`) và hook `useLayoutWidths()` kết hợp store (`sidebarWidth`, `rightWidth`, `sidebarOpen`, `rightOpen`) với `layoutWidths`

**Checkpoint**: nền tảng xong, typecheck qua (RightPanel sẽ lỗi vì bỏ `rightWide` → sửa ở T009).

---

## Phase 3: User Story 1 - Kéo sidebar trái (P1) 🎯 MVP

**Goal**: Kéo mép phải sidebar trái để đổi độ rộng trong [200, 480].

**Independent Test**: quickstart kịch bản 1, 2.

- [X] T006 [P] [US1] Test `tests/unit/layout.test.ts`: `clampWidth` (NaN → def, kẹp min/max, làm tròn); `layoutWidths` (viewport rộng giữ nguyên; viewport 960 với 480+720 → hội thoại ≥ 400, co right trước; sidebar đóng = 0; `leftMax`/`rightMax`); migrate store v0 `{ rightWide: true }` → `rightWidth` 560
- [X] T007 [P] [US1] Test `tests/unit/resizeHandle.test.tsx`: aria đúng; pointerdown+move+up gọi `onChange` với giá trị kẹp (side left và right đảo chiều; mock `requestAnimationFrame` chạy ngay, mock `setPointerCapture`); body có class `resizing` khi kéo và bị gỡ sau pointerup
- [X] T008 [US1] Sửa `src/components/layout/Sidebar.tsx`: `<aside>` bỏ `w-[256px]`, thêm `relative`, `style={{ width: left }}` từ `useLayoutWidths()`; gắn `<ResizeHandle side="left" label="Resize sidebar" value={left} min={LEFT.min} max={leftMax} onChange={setSidebarWidth} onReset={() => setSidebarWidth(LEFT.def)} />` nằm ở cạnh phải (`-right-1`)

**Checkpoint**: sidebar trái kéo được, vùng hội thoại co theo.

---

## Phase 4: User Story 2 - Kéo side panel phải (P1)

**Goal**: Kéo mép trái side panel trong [280, 720]; nút widen/narrow vẫn chạy.

**Independent Test**: quickstart kịch bản 3, 4.

- [X] T009 [US2] Sửa `src/components/panels/RightPanel.tsx`: bỏ `rightWide`; `<aside>` thêm `relative`, `style={{ width: right }}` từ `useLayoutWidths()`; gắn `<ResizeHandle side="right" label="Resize side panel" ... max={rightMax} onChange={setRightWidth} onReset={() => setRightWidth(RIGHT.def)} />` ở cạnh trái (`-left-1`); nút: `wide = rightWidth > RIGHT.def` → bấm đặt `RIGHT.def` (Narrow) hoặc `RIGHT.wide` (Widen), giữ `aria-label`/`title` cũ
- [X] T010 [P] [US2] Rà mọi chỗ còn dùng `rightWide`/`setRightWide` (`rg rightWide src tests`) và sửa (kể cả `src/lib/devMock.ts`, command palette nếu có)

**Checkpoint**: cả hai sidebar kéo được độc lập.

---

## Phase 5: User Story 3 - Nhớ độ rộng và về mặc định (P2)

**Goal**: Độ rộng giữ qua reload và qua thu gọn/mở lại; nhấp đúp về mặc định.

**Independent Test**: quickstart kịch bản 5, 6, 8.

- [X] T011 [US3] Kiểm `src/stores/useUiStore.ts`: `setSidebarOpen`/`setRightOpen` không đụng độ rộng; độ rộng hiển thị khi cửa sổ hẹp chỉ tính trong `layoutWidths`, không ghi đè `sidebarWidth`/`rightWidth` (FR-006, edge case cửa sổ hẹp)
- [X] T012 [P] [US3] Bổ sung `tests/unit/resizeHandle.test.tsx`: dblclick gọi `onReset`

---

## Phase 6: User Story 4 - Bàn phím (P3)

**Goal**: Focus mép kéo và đổi độ rộng bằng phím.

**Independent Test**: quickstart kịch bản 7.

- [X] T013 [P] [US4] Bổ sung `tests/unit/resizeHandle.test.tsx`: ArrowRight/ArrowLeft ±16 (đảo chiều với side right), Home/End → min/max, Enter → `onReset`

---

## Phase 7: Polish

- [X] T014 Chạy `pnpm typecheck` và `pnpm test`, sửa lỗi
- [X] T015 Kiểm giao diện bằng Playwright trên `http://localhost:1420/?mock` theo quickstart.md (kéo, đo `getBoundingClientRect().width`, cửa sổ 960px, chụp light/dark)

---

## Dependencies & Execution Order

- Phase 2 → mọi story. Trong Phase 2: T001, T003, T004 song song; T002 và T005 cần T001.
- US1 (T008) và US2 (T009–T010) độc lập với nhau sau Phase 2.
- US3, US4 dựa trên ResizeHandle/store đã có; chỉ thêm kiểm tra và test.
- Polish sau cùng.

## Parallel Example

```text
# Phase 2
T001 src/lib/layout.ts  |  T003 src/components/layout/ResizeHandle.tsx  |  T004 src/styles/globals.css
# Sau Phase 2
T006, T007 (tests)  |  T008 (Sidebar)  |  T009 (RightPanel)
```

## Implementation Strategy

- **MVP**: Phase 2 + US1 (sidebar trái kéo được).
- Tiếp US2 (P1, cùng mức ưu tiên) → US3 → US4 → Polish. Mỗi bước kiểm theo quickstart trước khi sang bước sau.
