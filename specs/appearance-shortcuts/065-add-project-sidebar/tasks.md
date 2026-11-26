# Tasks: Sidebar danh sách project cho Pull Requests và Skills

**Input**: [Spec](spec.md), [Plan](plan.md), [UI contract](contracts/project-sidebar.md)

## Phase 1 - Setup

- [x] T001 Kiểm tra các entry point hiện có trong `src/components/layout/AppShell.tsx` và quy ước giao diện trong `components.json`.

## Phase 2 - Foundational

- [x] T002 Tạo danh sách cuộn có trạng thái chọn, focus, trùng tên, tải, lỗi và trống trong `src/components/layout/ProjectPickerSidebar.tsx`. Dùng thứ tự đã lưu từ `src/lib/useNavigationOrder.ts` và đặt sidebar cạnh toolbar trong `src/components/layout/AppShell.tsx` (FR-001–003, FR-007–008).

## Phase 3 - User Story 1 (P1)

Chọn riêng project hoặc All projects và mở đúng PR từ thông báo.

- [x] T003 [US1] Nối lựa chọn PR vào sidebar trong `src/components/layout/AppShell.tsx`. Dọn bộ chọn cũ, giữ chế độ xem và điều hướng từ thông báo trong `src/components/layout/PullRequests.tsx` (FR-004, FR-006–007).
- [x] T004 [US1] Cập nhật kiểm thử điều hướng và phạm vi PR trong `tests/unit/pullRequests.test.tsx` (SC-001–002).

## Phase 4 - User Story 2 (P1)

Chọn project, tải đúng catalog và áp dụng thay đổi cho đúng project.

- [x] T005 [US2] Nối lựa chọn Skills theo ID trong `src/components/layout/AppShell.tsx` và thu gọn `src/components/settings/ProjectSkillsSection.tsx` thành nội dung theo project đã chọn (FR-005–007).
- [x] T006 [US2] Cập nhật xác nhận phạm vi Skills trong `tests/unit/pullRequests.test.tsx` và `tests/unit/settingsView.test.tsx` (SC-001–002).

## Final Phase - Verification

- [x] T007 Chạy typecheck, bộ test và các bước kiểm tra có thể thực hiện trong `quickstart.md` (SC-001–004).

## Dependencies & Execution Order

T001 → T002 → T003/T005 → T004/T006 → T007. Hai story có thể chỉnh nội dung song song sau T002 nếu tích hợp AppShell tuần tự để tránh sửa trùng. T003–T004 tạo MVP Pull Requests độc lập, sau đó T005–T006 thêm Skills.
