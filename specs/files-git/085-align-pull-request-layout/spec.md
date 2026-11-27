# Feature Specification: Đồng bộ bố cục Pull Requests

**Created**: 2026-11-27

**Status**: Draft

**Input**: Đồng bộ bố cục và kiểu hiển thị Pull Requests với Skills và MCP.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chuyển giữa các module với bố cục nhất quán (Priority: P1)

Người dùng chuyển từ Skills hoặc MCP sang Pull Requests và thấy cùng kiểu tiêu đề, lề nội dung và hàng danh sách.

**Independent Test**: Mở lần lượt ba module trong cùng kích thước cửa sổ và so sánh tiêu đề, lề nội dung và nhịp giữa các hàng.

**Acceptance Scenarios**

1. Ba module có tiêu đề cùng chiều cao, cỡ chữ và cách căn lề. Nội dung Pull Requests bắt đầu ở cùng lề ngang.
2. Khi chuyển giữa danh sách, Notifications và chi tiết, Pull Requests dùng cùng lề nội dung, màu nền theo theme và đường phân cách nhẹ như Skills/MCP.
3. Người dùng có thể chọn project, đổi tab, làm mới dữ liệu, mở chi tiết rồi quay lại danh sách và tiếp tục từ vị trí trước đó.

### Edge Cases

- Khi cửa sổ hẹp, tab và các thao tác có thể xuống hàng. Tiêu đề tệp hoặc PR dài vẫn đọc được trong vùng nội dung.
- Khi tải, lỗi hoặc danh sách trống, thông báo xuất hiện trong cùng vùng nội dung của module.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Pull Requests MUST dùng cùng kiểu tiêu đề và lề nội dung như Skills và MCP.
- **FR-002**: Danh sách PR và thông báo MUST dùng hàng phân cách và màu bề mặt theo theme. Các tab và hành động MUST theo kiểu điều khiển dùng chung của ứng dụng.
- **FR-003**: Chi tiết MUST căn theo lề danh sách. Tab, làm mới, chọn project, mở chi tiết và quay lại MUST tiếp tục hoạt động cùng hành vi bàn phím và khôi phục vị trí.
- **FR-004**: Giao diện MUST dùng được ở kích thước cửa sổ hẹp và trong theme sáng, tối.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 3/3 module dùng cùng chiều cao và cách đặt tiêu đề, cùng lề ngang nội dung ở một kích thước cửa sổ.
- **SC-002**: Cả danh sách, Notifications và chi tiết đều nằm trên cùng lề ở hai theme. Luồng chọn project, xem chi tiết và quay lại hoàn thành được bằng bàn phím.

## Assumptions

- Sidebar chọn project đang dùng chung. Phạm vi thay đổi là cách trình bày vùng nội dung Pull Requests và tiêu đề chung.
