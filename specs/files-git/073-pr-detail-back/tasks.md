# Tasks: Quay lại danh sách từ chi tiết PR

## Phase 1 — Setup

- [X] T001 Kiểm tra Button, Tabs và luồng khôi phục danh sách trong `src/components/layout/PullRequests.tsx` và cấu hình ignore trong `.gitignore`.

## Phase 2 — Foundational

Dùng cơ chế điều hướng và trạng thái màn hình hiện có.

## Phase 3 — User Story 1 (P1)

**Independent test**: Mở PR, cuộn tới cuối chi tiết và quay lại bằng một thao tác. Kiểm tra khôi phục danh sách, cuộn và focus.

- [X] T002 [US1] Đưa nút ra ngoài panel cuộn trong `src/components/layout/PullRequests.tsx` và chuyển quyền sở hữu hành động từ `src/components/layout/PullRequestDetails.tsx`, đáp ứng FR-001 đến FR-003.
- [X] T003 [US1] Kiểm tra hồi quy vị trí nút, điều hướng trong lúc tải hoặc tải lỗi và khôi phục danh sách trong `tests/unit/pullRequests.test.tsx`.

## Final Phase — Validation

- [X] T004 Chạy typecheck và các bài kiểm tra trong `tests/unit/pullRequests.test.tsx`. Đối chiếu kết quả với `specs/files-git/073-pr-detail-back/quickstart.md`.

## Dependencies & Execution Order

T001 → T002 → T003 → T004. Các bài kiểm tra typecheck và Vitest có thể chạy song song ở T004. MVP hoàn thành khi User Story 1 hoạt động.
