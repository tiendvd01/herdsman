---

description: "Task list for 013 composer expand resize"
---

# Tasks: Resize ô chat ở chế độ mở rộng, mặc định 300px

**Input**: specs/013-composer-expand-resize/ (plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md)

**Tests**: tests/unit/layout.test.ts, tests/unit/resizeHandle.test.tsx, tests/unit/composerExpand.test.tsx (đã có; cập nhật), tests/unit/composerResize.test.tsx (mới).

## Phase 1: Setup

Không cần (không thêm dependency, không thêm thư mục).

## Phase 2: Foundational (chặn mọi story)

- [x] T001 Trong src/lib/layout.ts thêm `COMPOSER = { min: 120, max: 1200, def: 300 } as const satisfies WidthLimits` và hàm thuần `effectiveComposerHeight(saved: unknown, viewportHeight: number): number` = `clampWidth(saved, COMPOSER)` rồi kẹp trên bởi `max(COMPOSER.min, floor(0.8 * viewportHeight))`
- [x] T002 Trong src/stores/useUiStore.ts thêm `composerHeight: number` (default `COMPOSER.def` = 300), `setComposerHeight(px)` kẹp bằng `clampWidth(px, COMPOSER)`, thêm vào `partialize`, và kẹp lại `composerHeight: clampWidth(p.composerHeight, COMPOSER)` trong `merge` (không bump version)
- [x] T003 [P] Trong src/lib/useLayoutWidths.ts thêm `useViewportHeight()` (cùng kiểu `useViewportWidth`: `window.innerHeight / currentZoomFactor()`, lắng nghe `resize`, phụ thuộc `zoom`)
- [x] T004 [P] Trong src/components/layout/ResizeHandle.tsx thêm prop `orientation?: 'vertical' | 'horizontal'` (mặc định `'vertical'`, hành vi cũ không đổi). Ngang: `aria-orientation="horizontal"`, `cursor-row-resize`, vùng bắt `absolute inset-x-0 -top-1 h-2`, đường kẻ `h-px w-full`, kéo bằng `clientY` (bù `currentZoomFactor`) với kéo lên = tăng, phím ↑ `+KEY_STEP` / ↓ `-KEY_STEP` / Home = min / End = max / Enter = reset; `side` chỉ áp dụng cho dọc

## Phase 3: User Story 1 — Mở rộng với chiều cao mặc định 300px (P1) 🎯 MVP

**Goal**: bấm mở rộng → textarea cao 300px (kẹp theo cửa sổ thấp).
**Independent Test**: xoá `herdsman-ui`, mở rộng → textarea cao 300px; cửa sổ thấp → thanh công cụ vẫn hiện.

- [x] T005 [US1] Trong src/components/composer/Composer.tsx đọc `composerHeight` từ `useUiStore` và `useViewportHeight()`, thay `h-[65vh]` bằng `style={{ height: effectiveComposerHeight(composerHeight, viewportHeight) }}` khi `expanded` (giữ `shrink`, `min-h-0` của wrapper)
- [x] T006 [P] [US1] Thêm test `effectiveComposerHeight` (300 mặc định; giá trị lạ → 300; kẹp 120; kẹp 80% cửa sổ; cửa sổ rất thấp → 120) trong tests/unit/layout.test.ts
- [x] T007 [US1] Cập nhật tests/unit/composerExpand.test.tsx: khi mở rộng textarea có `style.height` = `300px` (thay kỳ vọng 65vh nếu có)

**Checkpoint**: mở rộng cao 300px, chưa kéo được.

## Phase 4: User Story 2 — Kéo để đổi chiều cao (P1)

**Goal**: khi đang mở rộng, kéo cạnh trên đổi chiều cao trong min..max, giữ nội dung.
**Independent Test**: mở rộng, kéo lên 100px → ~400px; kéo xuống rất thấp → 120px.

- [x] T008 [US2] Trong src/components/composer/Composer.tsx, khi `expanded` render `<ResizeHandle orientation="horizontal" label="Resize editor" value={effective} min={COMPOSER.min} max={max hiệu lực} onChange={setComposerHeight} onReset={() => setComposerHeight(COMPOSER.def)} />` ở cạnh trên khung viền composer (khung `relative`); không render khi chưa mở rộng; không tự gọi `focus`/đổi `value` của textarea để giữ nội dung và con trỏ
- [x] T009 [P] [US2] Thêm test trục ngang trong tests/unit/resizeHandle.test.tsx: `aria-orientation="horizontal"`; kéo lên tăng, xuống giảm, kẹp min/max; ↑/↓/Home/End/Enter; double-click reset; trục dọc cũ không đổi
- [x] T010 [US2] Tạo tests/unit/composerResize.test.tsx: handle chỉ hiện khi mở rộng; kéo đổi chiều cao textarea; nội dung và ảnh đính kèm giữ nguyên sau khi kéo

## Phase 5: User Story 3 — Nhớ chiều cao đã chọn (P2)

**Goal**: chiều cao đã kéo dùng lại cho mọi lần mở rộng sau, kể cả session khác và sau khi mở lại app.
**Independent Test**: kéo 450px, thu nhỏ, mở rộng lại → 450px; reload → vẫn 450px.

- [x] T011 [US3] Thêm vào tests/unit/composerResize.test.tsx: thu nhỏ rồi mở rộng lại giữ chiều cao; đổi `session.id` vẫn giữ; giá trị `composerHeight` hỏng trong localStorage (chuỗi/âm/quá lớn) rơi về 300 hoặc bị kẹp (qua `merge` trong src/stores/useUiStore.ts)
- [x] T012 [US3] Thêm test: cửa sổ thấp lại rồi cao lên thì chiều cao hiệu lực quay về giá trị đã lưu (không ghi đè `composerHeight`) trong tests/unit/composerResize.test.tsx

## Phase 6: Polish

- [x] T013 Chạy `pnpm vitest run` và `pnpm tsc --noEmit` / lint, sửa lỗi
- [x] T014 Kiểm tay theo specs/013-composer-expand-resize/quickstart.md bằng Playwright trên `http://localhost:1420/?mock` (300px mặc định, kéo, nhớ, cửa sổ thấp, hồi quy Esc/gửi của 012)
- [x] T015 Cập nhật dòng "mở rộng ô chat" trong specs/business-requirement/BR-001.md (F4) thêm "kéo đổi chiều cao, mặc định 300px"

## Dependencies

- Foundational (T001–T004) → mọi story. T003, T004 song song với nhau và với T001/T002.
- US1 (T005) cần T001, T002, T003. US2 (T008) cần T004, T005. US3 chỉ thêm test trên hành vi đã có từ T002/T008.
- Polish sau cùng.

## Parallel Example

- Sau T002: chạy song song T003 (useLayoutWidths.ts) và T004 (ResizeHandle.tsx).
- T006 (layout.test.ts) song song với T005; T009 (resizeHandle.test.tsx) song song với T008.

## Implementation Strategy

- **MVP**: Phase 2 + US1 (mở rộng cao 300px). Giao được ngay.
- Tiếp theo US2 (kéo được), rồi US3 (kiểm chứng việc nhớ; phần lưu đã có từ T002).
