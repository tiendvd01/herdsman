# Tasks — Quản lý phím tắt

## Setup

- [X] T001 Xác định luồng đóng và thứ tự tab trong src/components/layout/WorkspaceView.tsx.

## Foundational

- [X] T002 Thêm danh mục, tổ hợp hiệu lực, kiểm tra trùng và lưu local trong src/lib/keyboardShortcuts.ts (FR-002, FR-005–007).

## User Story 1 — Chuyển và đóng tab

- [X] T003 [US1] Điều phối phím và gắn lệnh tab vào src/components/command/CommandDialog.tsx và src/components/layout/WorkspaceView.tsx (FR-003, FR-004, FR-008).
- [X] T004 [US1] Đồng bộ accelerator và nhận lệnh Close Tab từ menu desktop trong src-tauri/src/lib.rs (FR-004, FR-007).

## User Story 2 — Quản lý phím tắt

- [X] T005 [US2] Thêm danh mục, lọc, ghi nhận, khôi phục và thông báo lỗi trong src/components/settings/KeyboardShortcutsSection.tsx (FR-001, FR-005, FR-006).
- [X] T006 [US2] Dùng nhãn hiệu lực trong src/components/command/CommandDialog.tsx, src/components/layout/Sidebar.tsx và src/components/layout/WorkspaceView.tsx (FR-007).

## Validation

- [X] T007 Kiểm tra điều phối, thứ tự tab, lưu và xung đột trong tests/unit/keyboardShortcuts.test.tsx và chạy kiểm thử trình duyệt với dữ liệu mô phỏng theo quickstart.md.

US1 và US2 dùng chung T002. Sau T002, có thể chuẩn bị Settings song song với menu native. US1 có thể kiểm tra độc lập bằng tổ hợp mặc định. US2 kiểm tra bằng thao tác đổi tổ hợp và khởi động lại.
