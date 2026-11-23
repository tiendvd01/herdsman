# Tasks: Settings — Appearance

**Input**: [plan.md](plan.md), [spec.md](spec.md), [data-model.md](data-model.md), [contracts/ui.md](contracts/ui.md)

## Phase 1: Foundational

- [X] T001 [P] Tạo `src/lib/fonts.ts`: `UI_FONTS`, `CODE_FONTS` (`{ id, label, family, bundled }`, mặc định `geist` / `geist-mono`), `fontStack(kind, id)` (id lạ → mặc định; stack kết thúc bằng Geist/Geist Mono + generic), `isFontAvailable(family)` đo canvas (R3), `availableFonts(kind)`
- [X] T002 Mở rộng `src/stores/useUiStore.ts`: `uiFont` (default `'geist'`), `codeFont` (default `'geist-mono'`), `settingsOpen` (transient) + setters; persist `uiFont`, `codeFont`; version 3 (v2 đã dùng cho zoom của spec 006), `migrateUi` điền mặc định khi `version < 3`

## Phase 2: User Story 1 — Mở Settings (P1)

**Independent test**: bấm bánh răng ở footer sidebar / ⌘, → dialog Settings với mục Appearance; Esc đóng.

- [X] T003 [US1] Tạo `src/components/settings/SettingsDialog.tsx`: Radix Dialog rộng ~720px, nav trái (Appearance, `aria-current="page"`), vùng nội dung phải, đóng bằng Esc / Close / overlay; điều khiển bằng `settingsOpen`
- [X] T004 [US1] Mount `SettingsDialog` cạnh `CommandDialog` trong `src/App.tsx`
- [X] T005 [US1] Thêm nút icon Settings (`aria-label="Settings"`, tooltip "Settings ⌘,") vào hàng `HcStatus` ở `src/components/layout/Sidebar.tsx`
- [X] T006 [US1] Thêm ⌘, → `setSettingsOpen(true)` và lệnh "Open settings" trong `src/components/command/CommandDialog.tsx`

## Phase 3: User Story 2 — Theme trong Settings (P1)

**Independent test**: chọn Dark trong Settings → app tối; header không còn nút theme; ⌘⇧L vẫn chạy.

- [X] T007 [US2] Thêm nhóm Theme (`role="radiogroup" aria-label="Theme"`, System/Light/Dark kèm icon Monitor/Sun/Moon) vào `src/components/settings/SettingsDialog.tsx`
- [X] T008 [US2] Bỏ `ThemeToggle` (component, import `cycleTheme`, icon không dùng) khỏi `src/components/layout/WorkspaceView.tsx`

## Phase 4: User Story 3 — Font giao diện & font code (P2)

**Independent test**: chọn Code font Menlo → code block đổi font; reload vẫn giữ; Reset → Geist Mono.

- [X] T009 [US3] Trong `src/lib/theme.ts` thêm `useAppearanceEffect()` (theme + set `--font-sans` / `--font-mono` trên `document.documentElement.style`) và `currentFontSans()`; thay chỗ gọi `useThemeEffect`
- [X] T010 [US3] Thêm `FontPicker` (DropdownMenu radio, mỗi mục render bằng chính font; `aria-label` "Interface font" / "Code font"; nút Reset khi khác mặc định) vào `src/components/settings/SettingsDialog.tsx`
- [X] T011 [P] [US3] `src/components/conversation/Mermaid.tsx` và `Chart.tsx` dùng `currentFontSans()` thay chuỗi Geist cố định; Mermaid khoá cache/initialize theo font

## Phase 5: Polish

- [X] T012 [P] Test `tests/unit/fonts.test.ts`: `fontStack` id lạ → mặc định, stack chứa fallback; `migrateUi` v2 → v3
- [X] T013 [P] Test `tests/unit/settingsDialog.test.tsx`: mở dialog, chọn theme đổi store, đổi font set biến CSS, Reset
- [X] T014 [P] Cập nhật `specs/business-requirement/BR-001.md` §3.1/§3.2: theme và font đổi trong Settings → Appearance
- [X] T015 Chạy `pnpm typecheck && pnpm test`; kiểm UI bằng `?mock` + Playwright theo [quickstart.md](quickstart.md)

## Dependencies

T001, T002 → mọi story. US1 (T003–T006) → US2 (T007) và US3 (T010) vì cùng file dialog. T008, T009, T011 độc lập. Polish sau cùng.

## Strategy

MVP = Phase 1 + US1 + US2 (đúng yêu cầu chuyển toggle vào Settings), rồi US3.

## Phase 6: Feedback — nhiều font hơn

- [X] T016 Lệnh Tauri `font_families` (crate `core-text`, chỉ macOS) trong `src-tauri/src/commands.rs`, đăng ký ở `src-tauri/src/lib.rs`, test Rust `font_tests`
- [X] T017 `src/lib/fonts.ts`: id `family:<tên>`, `isMonospace`, `fontChoices`, `sameFont`; `api.fontFamilies` + `useFontFamilies`; mock trong `src/lib/devMock.ts`
- [X] T018 `FontPicker` trong `src/components/settings/SettingsDialog.tsx` thành popover có ô tìm kiếm + listbox cuộn; bỏ dòng preview; test cập nhật
