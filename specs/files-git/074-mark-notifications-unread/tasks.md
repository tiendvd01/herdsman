# Tasks: Đánh dấu tất cả thông báo PR là chưa đọc

## Phase 1 — Setup

- [X] T001 Xác nhận khóa snapshot, khóa thao tác và bộ đếm trong `src-tauri/src/pull_requests.rs` và `src/components/layout/PullRequests.tsx`.

## Phase 2 — Foundational

Dùng lại snapshot, transaction và UI components hiện có.

## Phase 3 — User Story 1 (P1)

**Independent test**: Đánh dấu trong một project rồi trong All projects. So sánh trạng thái và cả hai bộ đếm.

- [X] T002 [US1] Lưu thay đổi theo tài khoản trong một giao dịch và đăng ký lệnh trong `src-tauri/src/pull_requests.rs` và `src-tauri/src/lib.rs` (FR-002–004).
- [X] T003 [US1] Thêm nút, xử lý lưu thành công/thất bại và cập nhật bộ đếm trong `src/components/layout/PullRequests.tsx` (FR-001–004).
- [X] T004 [US1] Kiểm tra phạm vi, khả năng thử lại, persistence và rollback trong `tests/unit/pullRequests.test.tsx` và `src-tauri/src/pull_requests.rs`.

## Final Phase — Validation

- [X] T005 Chạy kiểm tra theo `specs/files-git/074-mark-notifications-unread/quickstart.md` và cập nhật trạng thái đặc tả.

## Dependencies & Execution Order

T001 → T002 → T003 → T004 → T005. Các nhóm kiểm tra frontend và Rust có thể chạy song song. User Story 1 là MVP.
