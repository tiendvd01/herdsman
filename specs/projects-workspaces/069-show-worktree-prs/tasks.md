# Tasks: Hiện pull request dưới worktree

## Phase 1: Setup

- [x] T001 Rà soát phạm vi và hợp đồng trong `specs/projects-workspaces/069-show-worktree-prs/contracts/pull-requests.md`.

## Phase 2: Foundational

- [x] T002 Trong `src-tauri/src/pull_requests.rs`, lưu metadata số PR dương, nhánh nguồn và trạng thái tương thích snapshot cũ rồi trả về theo repository và tài khoản. Kiểm tra phạm vi repo, giới hạn 50 PR đã kết thúc và xử lý chuyển trạng thái bằng test Rust.

## Phase 3: User Story 1 (P1) - Xem và mở PR từ worktree

- [x] T003 [US1] Dùng chung snapshot và lệnh mở GitHub trong `src/components/layout/PullRequests.tsx` và `src/components/layout/AppShell.tsx`.
- [x] T004 [US1] Hiện liên kết và trạng thái bên dưới worktree phù hợp trong `src/components/layout/Sidebar.tsx`.
- [x] T005 [US1] Kiểm thử các trạng thái, hàng phù hợp, thao tác mở và lựa chọn workspace trong `tests/unit/commandDialog.test.tsx`.

## Phase 4: Polish & Cross-Cutting Concerns

- [x] T006 Chạy kiểm tra frontend và Rust theo `specs/projects-workspaces/069-show-worktree-prs/quickstart.md`.

## Dependencies & Execution Order

T001 → T002 → T003 → T004 → T005 → T006. Kịch bản kiểm tra độc lập cho US1 nằm trong quickstart.
