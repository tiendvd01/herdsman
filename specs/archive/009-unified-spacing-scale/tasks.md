---
description: "Task list: Thống nhất bộ khoảng cách (spacing) trong app"
---

# Tasks: Thống nhất bộ khoảng cách (spacing) trong app

**Input**: Design documents from `/specs/009-unified-spacing-scale/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/spacing-scale.md, quickstart.md

**Tests**: spec yêu cầu bước kiểm tra tự động (FR-010, US3) → có test `spacingScale`. Viết trước, chạy đỏ, rồi sửa tới khi xanh.

**Organization**: theo user story; quy tắc đổi giá trị ở bảng D2 của research.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Chụp ảnh "trước" sidebar + một workspace có hội thoại (sáng/tối, 1280×720) từ `http://localhost:1420/?mock` vào scratchpad để so SC-005

## Phase 2: Foundational

- [X] T002 Tạo `src/lib/spacing.ts`: `SPACING_STEPS` (8 bậc `0.5, 1, 1.5, 2, 3, 4, 6, 8`, mỗi bậc có `px = step × 4` và `role` theo bảng D1), `SPACING_EXCEPTIONS` (`src/lib/platform.ts` `pl-[84px]` — đèn giao thông macOS; `src/components/layout/Sidebar.tsx` `ml-[15px]` — đường cây dưới tâm mũi tên project; `reason` không được rỗng), `isAllowedSpacing(value)` (`'0'` và bậc trong bộ → true, còn lại kể cả `px` và `[...]` → false), kèm comment đầu file mô tả quy tắc căn hàng R1–R4 của data-model.md

**Checkpoint**: bộ khoảng cách có một chỗ duy nhất (FR-009).

## Phase 3: User Story 1 - Các nút cùng cột thẳng hàng trong sidebar (P1) 🎯 MVP

**Goal**: mép phải nút "+" dòng "Projects", nút "+"/"…" của project và nút menu workspace trùng nhau.

**Independent Test**: quickstart.md mục "Bằng mắt" bước 2–3: đo `right` của các nút → bằng nhau ở sidebar hẹp nhất và rộng nhất.

- [X] T003 [US1] Bỏ `pr-0.5` ở dòng tiêu đề "Projects" (giữ `pl-2`) trong `src/components/layout/Sidebar.tsx`
- [X] T004 [P] [US1] Đổi nút menu biến thể sidebar `right-0.5` → `right-0` trong `src/components/workspace/WorkspaceMenu.tsx`
- [X] T005 [US1] Trong `src/components/layout/Sidebar.tsx`: `group-hover:pr-7` và `group-has-[[data-state=open]]:pr-7` → `pr-8`; `gap-px` → `gap-0.5`; nút tìm kiếm `pl-2.5` → `pl-2`
- [X] T006 [US1] Playwright `?mock`: đo bounding box `right` của nút "New project", các nút "New workspace in …", nút "Options for workspace …" (hover) ở chiều rộng sidebar mặc định, nhỏ nhất, lớn nhất; chênh lệch phải là 0

## Phase 4: User Story 2 - Một bộ khoảng cách chung cho toàn app (P1)

**Goal**: mọi token padding/margin/gap/space thuộc bộ chung (trừ ngoại lệ).

**Independent Test**: `pnpm test -- spacingScale` xanh; ảnh chụp không vỡ bố cục.

- [X] T007 [P] [US2] `src/components/ui/button.tsx` size `sm` `px-2.5` → `px-3`; `src/components/ui/input.tsx` `px-2.5` → `px-3`; `src/components/ui/tooltip.tsx` `px-2.5` → `px-2`
- [X] T008 [P] [US2] `src/components/panels/RightPanel.tsx`: dòng 42 `p-[3px]` → `p-0.5`; dòng 56 `px-2.5` → `px-3`; dòng 161, 199 `gap-3.5`/`pl-3.5` → `gap-3`/`pl-3`; dòng 254 `py-2.5` → `py-2`; dòng 364 `gap-2.5` → `gap-2`; dòng 412 `px-3.5` → `px-3`
- [X] T009 [P] [US2] `src/components/history/HistoryPopover.tsx`: `p-[3px]` → `p-0.5`; `px-2.5` (dòng 56, 81) → `px-3` nếu là đệm ô nhập/nút, `px-2` nếu là mục trong tablist; `gap-2.5` → `gap-2`
- [X] T010 [P] [US2] `src/components/conversation/`: `Chart.tsx` `p-5` → `p-4`; `Mermaid.tsx` `pt-5` → `pt-4`, `py-2.5` → `py-2`; `MessageList.tsx` bong bóng người dùng `px-3.5 py-2.5` → `px-3 py-2`; `ToolCard.tsx` `py-2.5` (dòng 83, 88) → `py-2`; `EmptySession.tsx` `py-12` → `py-8`
- [X] T011 [P] [US2] `src/components/command/CommandDialog.tsx` `gap-2.5` → `gap-2`; `src/components/layout/WorkspaceView.tsx` `px-2.5` → `px-3`; `src/components/project/DeleteProjectDialog.tsx` `p-2.5` → `p-3`; `src/components/workspace/WorkspaceMenu.tsx` dòng 112 `p-2.5` → `p-3`
- [X] T012 [US2] Kiểm tra ba header (sidebar `h-14`, `WorkspaceView` `min-h-14`, `RightPanel` `min-h-14`) có `bottom` bằng nhau bằng Playwright (SC-004); sửa nếu lệch

## Phase 5: User Story 3 - Giữ thống nhất khi thêm giao diện mới (P2)

**Goal**: thêm giá trị ngoài bộ thì test đỏ, chỉ ra `file:dòng token`.

**Independent Test**: thêm tạm `px-2.5` vào một className → `pnpm test -- spacingScale` đỏ; bỏ đi → xanh.

- [X] T013 [US3] Viết `tests/unit/spacingScale.test.ts` theo `contracts/spacing-scale.md`: quét `src/**/*.{ts,tsx}`, regex bắt token có tiền tố variant `xxx:` và dấu `-` cho các tiền tố `p px py pt pr pb pl ps pe m mx my mt mr mb ml ms me gap gap-x gap-y space-x space-y`; bỏ qua `auto` cho margin; lỗi liệt kê `path:line token`; thêm test riêng: mỗi `SPACING_EXCEPTIONS` phải còn được dùng trong file của nó; test đơn vị `isAllowedSpacing` (`'0'`, `'2'` true; `'2.5'`, `'px'`, `'[3px]'` false); `SPACING_STEPS.length <= 8`
- [X] T014 [US3] Chạy `pnpm test -- spacingScale`, sửa nốt token còn sót (nếu có) cho tới khi xanh; thử thêm/bỏ `px-2.5` để xác nhận test bắt được

## Phase 6: Polish

- [X] T015 `pnpm typecheck` và `pnpm test` toàn bộ xanh
- [X] T016 Chụp ảnh "sau" như T001, so sánh: không vỡ bố cục, số hàng workspace / dòng hội thoại thấy được chênh ≤ ±10% (SC-005); kiểm tra hộp thoại tạo workspace, ⌘K, tab side panel ở cả sáng/tối

## Dependencies & Execution Order

- T002 trước T013 (test import `src/lib/spacing.ts`).
- US1 (T003–T006) và US2 (T007–T012) độc lập nhau; T003 và T005 cùng file nên tuần tự.
- T013–T014 sau US1, US2 để test xanh; có thể viết T013 sớm để thấy danh sách đỏ.
- Polish sau cùng.

## Parallel Example

```text
US2: T007, T008, T009, T010, T011 cùng chạy (khác file).
US1: T004 song song với T003/T005.
```

## Implementation Strategy

MVP = US1 (sửa đúng lỗi lệch trong ảnh). Sau đó US2 dọn toàn app, US3 khoá lại bằng test.
