# Tasks — Mở chi tiết PR từ thông báo

## Phase 1 — Setup

- [x] T001 Rà luồng notification và chi tiết hiện có theo `plan.md`.

## Phase 2 — User Story 1

- [x] T002 [US1] Cập nhật test cho PR đã rời danh sách, chọn project, đánh dấu đã đọc và quay lại tab trong `tests/unit/pullRequests.test.tsx` (FR-001–004).
- [x] T003 [US1] Bổ sung metadata từ phản hồi detail trong `src-tauri/src/pull_requests/detail.rs` và khai báo kiểu trong `src/components/layout/PullRequestActivity.tsx` (FR-003).
- [x] T004 [US1] Điều hướng trong app và hiển thị dữ liệu chi tiết trong `src/components/layout/PullRequests.tsx` và `src/components/layout/PullRequestDetails.tsx` (FR-001–004).

## Phase 3 — Verification

- [x] T005 Chạy các kiểm tra tự động trong `quickstart.md` và ghi kết quả.

T002 xác nhận hồi quy trước khi sửa. T003 cung cấp metadata cho T004. T005 chạy sau khi triển khai. US1 kiểm thử độc lập qua thông báo của một PR đã merge.

## Verification

- Checklist đặc tả đạt 16/16. Spec, plan và tasks bao phủ FR-001 đến FR-004.
- `pnpm typecheck` đạt.
- `pnpm test` đạt 351 test. Chạy lại riêng Pull Requests sau lần chỉnh cuối đạt 12 test.
- `cargo test --manifest-path src-tauri/Cargo.toml pull_requests` đạt 8 test.
- Quickstart trên desktop với tài khoản GitHub thật chưa chạy.
