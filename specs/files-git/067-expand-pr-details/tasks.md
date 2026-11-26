# Tasks: Mở rộng trang chi tiết Pull Request

## Phase 1: Setup

- [X] T001 Xác nhận kế hoạch, hợp đồng và checklist trong `specs/files-git/067-expand-pr-details/`.

## Phase 2: Foundational

- [X] T002 Thêm lệnh đọc chi tiết theo phạm vi và kiểm tra quyền trong `src-tauri/src/pull_requests/detail.rs` và `src-tauri/src/lib.rs`.

## Phase 3: CI theo từng bước (US1)

- [X] T003 [US1] Đọc checks, workflow, attempt, jobs và bước trong `src-tauri/src/pull_requests/detail.rs`.
- [X] T004 [US1] Hiển thị timeline, disclosure và cập nhật tiến độ trong `src/components/layout/PullRequestActivity.tsx` và `src/components/layout/PullRequestDetails.tsx`.

## Phase 4: Bình luận review (US2)

- [X] T005 [US2] Phân trang review và thread, hiển thị phản hồi và trạng thái trong `src-tauri/src/pull_requests/detail.rs` và `src/components/layout/PullRequestActivity.tsx`.

## Phase 5: Mô tả và điều hướng (US3)

- [X] T006 [US3] Đọc Markdown an toàn và giữ nguyên ngữ cảnh điều hướng trong `src/components/layout/PullRequestActivity.tsx` và `src/components/layout/PullRequests.tsx`.

## Final Phase: Validation

- [X] T007 Kiểm thử luồng chính và dữ liệu cũ trong `tests/unit/pullRequests.test.tsx` và `src-tauri/src/pull_requests/detail.rs`.
- [X] T008 Chạy build, kiểm thử và kiểm tra giao diện theo `specs/files-git/067-expand-pr-details/quickstart.md`.

T002 mở khóa các US. CI và review đọc dữ liệu độc lập. Tích hợp các thành phần trong chi tiết chung, rồi xác minh.
