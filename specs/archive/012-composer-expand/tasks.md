---

description: "Task list for 012 composer expand"
---

# Tasks: Nút mở rộng ô chat để soạn text dài

**Input**: specs/012-composer-expand/ (plan.md, spec.md, research.md, data-model.md, quickstart.md)

**Tests**: tests/unit/composerExpand.test.tsx (toggle, giữ nội dung, Esc, gửi thu nhỏ).

## Phase 1: Setup

Không cần.

## Phase 2: Foundational

- [x] T001 Thêm state `expanded` + reset theo `session.id` + hàm `toggleExpanded()` (focus lại textarea) trong src/components/composer/Composer.tsx

## Phase 3: User Story 1 — Mở rộng ô chat (P1) 🎯 MVP

**Goal**: bấm nút → ô chat cao ~65vh, giữ nội dung, thanh công cụ luôn hiện; gửi xong thu nhỏ.
**Independent Test**: gõ nhiều dòng, bấm Expand → textarea cao lên, text còn nguyên.

- [x] T002 [US1] Thêm nút `Maximize2`/`Minimize2` (Tooltip, `aria-label`, `aria-pressed`, `disabled`) sau nút Paperclip trong src/components/composer/Composer.tsx
- [x] T003 [US1] Đổi class textarea theo `expanded` (`h-[65vh] shrink` + wrapper `min-h-0 shrink` vs `max-h-60 field-sizing-content`) trong src/components/composer/Composer.tsx
- [x] T004 [US1] `send()` gọi `setExpanded(false)` khi gửi thành công trong src/components/composer/Composer.tsx

## Phase 4: User Story 2 — Thu nhỏ lại (P1)

**Goal**: bấm lại nút hoặc Esc để thu nhỏ; Esc khi mở rộng không interrupt.
**Independent Test**: mở rộng → Esc → thu nhỏ, `sessionInterrupt` không được gọi.

- [x] T005 [US2] Nhánh Escape: sau nhánh slash, `expanded` → thu nhỏ, rồi mới tới interrupt trong src/components/composer/Composer.tsx
- [x] T006 [P] [US2] Viết tests/unit/composerExpand.test.tsx: toggle đổi nhãn + aria-pressed, giữ text, Esc thu nhỏ không interrupt khi đang working, Esc ở chế độ thường vẫn interrupt, gửi thành công thu nhỏ, disabled khi ô chat disabled

## Phase 5: Polish

- [x] T007 [P] Bổ sung "mở rộng ô chat để soạn text dài" vào dòng F4 specs/business-requirement/BR-001.md
- [x] T008 Chạy `pnpm test` và `pnpm typecheck`
- [x] T009 Kiểm tra bằng mắt theo specs/012-composer-expand/quickstart.md (`?mock` + Playwright)

## Dependencies

- T001 → T002–T005 (cùng file, tuần tự). T006 cần T001–T005 để pass. T007 độc lập.

## Implementation Strategy

MVP = T001–T004; sau đó T005–T006; cuối cùng Polish.
