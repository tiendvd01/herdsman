# Tasks: Phân biệt loại thông báo PR

## Phase 1 — Setup

- [X] T001 Đối chiếu các sự kiện hiện có trong `src-tauri/src/pull_requests.rs` với spec.

## Phase 2 — Foundational

Tái sử dụng dữ liệu thông báo, badge và toast hiện có.

## Phase 3 — User Story 1 (P1)

**Independent test**: Cùng một sự kiện dùng cùng loại trong danh sách và toast. Đánh dấu đọc hoặc chưa đọc giữ nguyên loại.

- [X] T002 [US1] Phân biệt review yêu cầu thay đổi trong `src-tauri/src/pull_requests.rs` (FR-001).
- [X] T003 [US1] Hiển thị badge chung trong `src/components/layout/PullRequests.tsx` và `src/components/ui/toast.tsx` (FR-001–003).
- [X] T004 [US1] Kiểm tra bản đồ sự kiện, phân loại trong toast và điều hướng trong `tests/unit/pullRequests.test.tsx` và `src-tauri/src/pull_requests.rs`.

## Final Phase — Validation

- [X] T005 Chạy các kiểm tra trong `specs/files-git/075-classify-pr-notifications/quickstart.md`.

## Dependencies

T001 → T002 → T003 → T004 → T005. Có thể chạy frontend, typecheck và Rust song song. User Story 1 là MVP.
