# Tasks: Tăng kích thước giao diện ở zoom 100%

## Phase 1 — Setup

- [X] T001 Xác nhận luồng zoom, tùy chọn đã lưu và cấu hình dự án trong src/main.tsx, src/stores/useUiStore.ts và .gitignore.

## Phase 2 — Foundation

- [X] T002 Kiểm tra kép đường Tauri và CSS fallback cùng cách bố cục đọc viewport trong src/lib/uiZoom.ts và src/lib/useLayoutWidths.ts.

## Phase 3 — User Story 1

MVP có thể kiểm tra bằng cách so kích thước 100% mới với 110% cũ ở cùng cỡ cửa sổ.

- [X] T003 [US1] Áp dụng tỷ lệ cơ sở cho cả hai đường hiển thị trong src/lib/uiZoom.ts (FR-001, SC-001).

## Phase 4 — User Story 2

Kiểm tra độc lập bằng phím tắt, nhãn, thay đổi riêng cỡ chữ và khôi phục tùy chọn.

- [X] T004 [US2] Xác minh nhãn, bước, đặt lại và lưu tùy chọn bằng tests/unit/uiZoom.test.ts (FR-002, FR-003, SC-002).

## Phase 5 — Validation

- [X] T005 Điều chỉnh bố cục ở zoom cao trong src/lib/layout.ts, src/components/ui/dialog.tsx và các hộp thoại liên quan. Xác minh khung cửa sổ, Settings, bản nháp, phím tắt và khôi phục tùy chọn trên Chromium theo specs/024-increase-base-ui-scale/quickstart.md (FR-004, SC-003).
- [ ] T006 Xác minh vị trí đọc và agent thật trên bản desktop macOS theo specs/024-increase-base-ui-scale/quickstart.md (FR-004, SC-004).

## Dependencies & Execution Order

T001 → T002 → T003 → T004 → T005 → T006. US1 là MVP. US2 xác minh hành vi sau khi đổi mốc. Ở bước cuối có thể chạy bộ test và kiểm tra giao diện song song.
