# Tasks: Đồng bộ giao diện Git với Files

## Setup

- [X] T001 Kiểm tra luồng file và session hiện có trong src/components/layout/WorkspaceView.tsx.

## Foundation

- [X] T002 Thêm tab diff theo workspace và đường dẫn trong src/stores/useFileStore.ts.

## User Story 1 (P1)

Kiểm tra độc lập bằng cách mở hai diff, chọn lại và đóng khi editor có bản sửa chưa lưu.

- [X] T003 [US1] Tạo nội dung diff và các trạng thái trong src/components/files/FileChanges.tsx.
- [X] T004 [US1] Tích hợp chọn, chuyển và đóng tab trong src/components/layout/WorkspaceView.tsx và kích hoạt từ src/components/panels/RightPanel.tsx.
- [X] T005 [P] [US1] Bảo toàn đường dẫn thực và xử lý diff rỗng trong src-tauri/src/git.rs.

## User Story 2 (P2)

Kiểm tra độc lập bằng cách so sánh danh sách Git và Files và mở diff bằng bàn phím.

- [X] T006 [US2] Dùng chung quy ước biểu tượng, hàng file và panel giữa src/components/files/FileTree.tsx và src/components/panels/RightPanel.tsx.

## Validation

- [X] T007 Kiểm tra hồi quy luồng tab và chạy kiểm tra frontend trong tests/unit/gitFiles.test.tsx.

## Đối chiếu yêu cầu

- FR-001 → T006. FR-002 → T004–T006.
- FR-003 → T004. FR-004 → T002, T004 và T007.
- FR-005 → T003, T005 và T007. FR-006 → T006. FR-007 → T003 và T006.
- SC-001–SC-004 → T007 và các bước trong [cách kiểm tra](quickstart.md).

## Dependencies

T002 trước T003–T004. T005 có thể thực hiện cùng T003 vì dùng file khác. T006 hoàn thiện danh sách trên luồng T004. T007 xác minh cả hai story. MVP gồm US1.
