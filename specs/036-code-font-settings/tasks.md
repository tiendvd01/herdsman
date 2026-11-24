# Tasks — Code font size

- [x] T001 [US1] Thêm bộ chọn cỡ code vào `src/components/settings/SettingsDialog.tsx`.
- [x] T002 [US1] Áp dụng cỡ riêng cho code và editor qua `src/styles/globals.css` và `src/components/files/FileEditor.tsx`.
- [x] T003 [US2] Lưu và khôi phục cỡ riêng trong `src/stores/useUiStore.ts` và `src/main.tsx`.
- [x] T004 [US2] Kiểm thử chọn, khôi phục và đặt lại trong `tests/unit/settingsDialog.test.tsx`.
- [x] T005 Chạy suite, typecheck, build production và kiểm tra CSS trong trình duyệt.

209 kiểm thử, typecheck và build đều đạt. Chrome headless xác nhận CSS production ở 10, 18 và 24 px trong hai theme, cùng hành vi Default. Kiểm thử khôi phục dùng Zustand trong môi trường test.
