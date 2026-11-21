# Tasks: Giao diện gọn hơn và zoom chữ / giao diện

**Input**: Design documents from `/specs/006-ui-compact-zoom/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-zoom.md, quickstart.md

**Tests**: unit test cho logic thuần (bậc zoom, clamp, khớp phím, migrate) + kiểm tra giao diện bằng Playwright trên `?mock`.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Thêm quyền `core:webview:allow-set-webview-zoom` vào `src-tauri/capabilities/default.json`

---

## Phase 2: Foundational

- [X] T002 Tạo `src/lib/uiZoom.ts`: `ZOOM_STEPS = [0.8, 0.9, 1, 1.1, 1.2, 1.35, 1.5]`, `CONTENT_STEP = { min: -2, max: 4, def: 0 }`, `clampZoom` ("giá trị khác → bậc gần nhất; không phải số hữu hạn → 1"), `clampContentStep` ("làm tròn rồi kẹp; không phải số → 0"), `nextZoom(z, dir)`, `applyZoom(z)` (Tauri: `getCurrentWebview().setZoom`, trình duyệt: `document.documentElement.style.zoom`), `applyContentStep(n)` (đặt `--content-step` trên `<html>`), `currentZoomFactor()` cho fallback CSS
- [X] T003 Thêm `zoom`, `contentStep` và 6 hành động `zoomIn/zoomOut/zoomReset/contentBigger/contentSmaller/contentReset` vào `src/stores/useUiStore.ts`; persist version 2, `migrateUi` v1→v2 thêm `zoom = 1`, `contentStep = 0`; `merge` đi qua `clampZoom`/`clampContentStep`; thêm vào `partialize`
- [X] T004 Áp dụng giá trị đã lưu trước render đầu trong `src/main.tsx` (gọi `applyContentStep` rồi `await applyZoom`), và subscribe store để áp dụng mỗi lần đổi

**Checkpoint**: state + áp dụng sẵn sàng.

---

## Phase 3: User Story 1 — Giao diện mặc định gọn hơn (P1) 🎯 MVP

**Goal**: Toàn app nhỏ đi đều, chữ thân 13px, chữ ≥ 11px.

**Independent Test**: Playwright 1440×900 `?mock`: số hàng workspace và số dòng hội thoại tăng ≥ 15% so với ảnh trước; không cắt chữ.

- [X] T005 [US1] Chụp ảnh "trước" (sáng/tối, 1440×900) và đếm số hàng sidebar / dòng hội thoại hiển thị, lưu vào scratchpad
- [X] T006 [US1] Thêm `@theme` thu gọn vào `src/styles/globals.css`: `--spacing: 0.225rem`, `--text-xs: 11px`, `--text-sm: 12.5px`, `--text-base: 14px`, `--text-lg: 16px` (kèm line-height phù hợp); body `font-size: 13px`; `--radius: 5px`; các font-size px trong `.prose-hs` theo bảng research R3
- [X] T007 [US1] Quy đổi `text-[Npx]` trong `src/components/**/*.tsx` theo bảng R3 (20→18, 18→16, 15→14, 14→13, 13→12, 12.5→12, 12→11.5, 11.5→11, 10→11); không đụng px khoảng cách lẻ (phạm vi spec 009)
- [X] T008 [US1] Quy đổi chiều cao/kích thước cố định viết px (`h-[30px]`, `h-[26px]`, `h-[43px]`, `size-[22px]`…) trong `src/components/**/*.tsx`: ×0.9, làm tròn, vùng bấm ≥ 24px
- [X] T009 [US1] Cập nhật giới hạn sidebar trong `src/lib/layout.ts`: `LEFT {min 184, max 440, def 232}`, `RIGHT {min 256, max 660, def 308, wide 504}`; sửa test hiện có nếu dựa trên số cũ (`tests/`)
- [X] T010 [US1] Mermaid: `fontSize` 13 → 12 trong `src/components/conversation/Mermaid.tsx`

**Checkpoint**: US1 kiểm được độc lập.

---

## Phase 4: User Story 2 — Zoom cả giao diện (P1)

**Goal**: ⌘= / ⌘+ / ⌘− / ⌘0 và menu View đổi zoom theo bậc, có chỉ báo.

**Independent Test**: Focus composer, ⌘= ba lần → 135%, nội dung gõ giữ nguyên; ⌘0 → 100%.

- [X] T011 [US2] Tạo `src/lib/zoomShortcuts.ts`: `matchZoomShortcut(e, { isMac })` trả `'in'|'out'|'reset'|'text-in'|'text-out'|'text-reset'|null` theo bảng trong `contracts/ui-zoom.md` (theo `e.code`, cho phép repeat, ⌥ = cỡ chữ, bỏ khi Ctrl trên macOS); `installZoomShortcuts()` listener capture phase `preventDefault`+`stopPropagation`; `listen('ui-zoom')` khi có Tauri
- [X] T012 [US2] Tạo `src/components/layout/ZoomIndicator.tsx`: nổi giữa trên, `role="status"` `aria-live="polite"`, hiện "110%" / "Text 14px", thêm "(max)"/"(min)" tại giới hạn, tự ẩn sau 1,5 s; store tạm `zoomFlash` (không persist) trong `useUiStore`
- [X] T013 [US2] Gắn `installZoomShortcuts` và `<ZoomIndicator />` trong `src/components/layout/AppShell.tsx`
- [X] T014 [US2] Fallback CSS zoom: khi không có Tauri, chia `clientX`/`innerWidth` cho `currentZoomFactor()` ở `src/components/layout/ResizeHandle.tsx` và `src/lib/useLayoutWidths.ts` (Tauri native zoom không cần)
- [X] T015 [US2] Menu macOS trong `src-tauri/src/lib.rs`: `Menu::default`, thêm vào submenu "View" Zoom In (`CmdOrCtrl+=`), Zoom Out (`CmdOrCtrl+-`), Actual Size (`CmdOrCtrl+0`); `on_menu_event` emit `ui-zoom` với `"in"|"out"|"reset"`

---

## Phase 5: User Story 3 — Cỡ chữ nội dung (P2)

**Goal**: ⌥⌘= / ⌥⌘− / ⌥⌘0 chỉ đổi chữ nội dung.

**Independent Test**: ⌥⌘= hai lần → hội thoại, code, Log to lên; sidebar/header không đổi.

- [X] T016 [US3] Thêm vào `src/styles/globals.css`: `:root { --content-step: 0px }`, `.text-content { font-size: calc(13px + var(--content-step)) }`, `.text-content-code { font-size: calc(12px + var(--content-step)) }`; code inline trong `.prose-hs` = `0.92em`; bảng `.prose-hs table` theo em
- [X] T017 [P] [US3] Dùng `text-content` cho `src/components/conversation/Markdown.tsx` và textarea trong `src/components/composer/Composer.tsx`
- [X] T018 [P] [US3] Dùng `text-content-code` cho các `<pre>` trong `src/components/conversation/CodeBlock.tsx`, `ToolCard.tsx`, `Diff.tsx`, `Mermaid.tsx`, `src/components/permission/PermissionCard.tsx`
- [X] T019 [P] [US3] Dùng `text-content-code` cho Files và Log trong `src/components/panels/RightPanel.tsx`

---

## Phase 6: User Story 4 — Nhớ lựa chọn và chỉnh nhanh (P2)

**Goal**: Giữ qua lần mở app; command palette có 6 lệnh.

**Independent Test**: Đặt 120% + cỡ chữ +1, reload → hiện ngay đúng giá trị; ⌘K gõ "zoom" ra lệnh kèm phím.

- [X] T020 [US4] Thêm 6 lệnh (Zoom in/out/Reset zoom, Increase/Decrease/Reset text size) kèm phím và mức hiện tại vào `src/components/command/CommandDialog.tsx`; từ khoá "zoom", "font", "text" tìm ra
- [X] T021 [US4] Unit test `tests/unit/uiZoom.test.ts`: `clampZoom`, `clampContentStep`, `nextZoom` tại giới hạn, `matchZoomShortcut` (⌘=, ⌘⇧=, ⌘−, ⌘0, ⌥⌘=, Ctrl trên macOS → null, repeat cho phép), `migrateUi` v1→v2

---

## Phase 7: Polish

- [X] T022 `pnpm typecheck` và `pnpm test` xanh; `cargo check` trong `src-tauri`
- [X] T023 Playwright `?mock` theo `quickstart.md`: ảnh "sau" sáng/tối ở 100%, 80%, 150%; ⌥⌘= +2; cửa sổ 960px zoom 150% không cuộn ngang; so SC-001 với ảnh T005
- [X] T024 Đánh dấu các task đã xong trong `specs/006-ui-compact-zoom/tasks.md`

---

## Dependencies & Execution Order

- Setup (T001) → Foundational (T002–T004) → US1 / US2 / US3 / US4.
- US1 độc lập với US2–US4 (chỉ CSS/className). US2 cần T002–T004. US3 cần T002–T004 (biến CSS áp dụng qua store). US4 cần US2 + US3 (lệnh gọi cùng hành động).
- Polish sau cùng.

## Parallel Example

- US3: T017, T018, T019 sửa file khác nhau → chạy song song sau T016.
- US1 T007/T008 có thể làm song song với US2 T011–T013 (file khác).

## Implementation Strategy

MVP = Phase 1–3 (giao diện gọn). Sau đó US2 (zoom) — cần cho người thấy quá nhỏ; rồi US3, US4. Kiểm Playwright sau mỗi story.
