# Feature Specification: Phân biệt loại thông báo PR

**Feature Branch**: `master`

**Created**: 2026-11-26

**Status**: Implemented

**Input**: User description: "Làm chức năng để phân biệt notification nào là warning, approve, info, hoặc là error"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nhận ra loại thông báo PR khi nhìn lướt (Priority: P1)

Là người theo dõi pull request, tôi muốn nhận ra thông báo nào báo lỗi, cần chú ý, xác nhận đã duyệt hoặc chỉ cung cấp thông tin để quyết định mục nào cần mở trước.

**Why this priority**: Bình luận mới, lượt duyệt và lỗi CI đòi hỏi phản ứng khác nhau. Người dùng có thể phân biệt ngay trong danh sách hoặc khi toast xuất hiện.

**Independent Test**: Chuẩn bị thông báo bình luận, approval, yêu cầu review và CI thất bại. Kiểm tra nhãn, biểu tượng và mô tả sự kiện trong `Overview`, `Notifications` và toast của cùng sự kiện.

**Acceptance Scenarios**

1. **Given** danh sách có thông báo thuộc cả bốn loại, **When** tôi xem `Overview` hoặc `Notifications`, **Then** từng mục hiện nhãn và biểu tượng phân loại bên cạnh mô tả cụ thể của sự kiện.
2. **Given** một sự kiện PR mới tạo toast, **When** tôi xem toast và mục tương ứng trong danh sách, **Then** cả hai hiển thị cùng loại và hành động `View` của toast vẫn dẫn tới đúng PR theo quy tắc hiện có.
3. **Given** cảnh báo đang ở trạng thái chưa đọc, **When** tôi dùng `Mark all as read`, rồi dùng `Mark all as unread` trong cùng phạm vi, **Then** dấu `Unread`, số trên tab và chấm ở thanh điều hướng cập nhật theo trạng thái đọc. Nhãn phân loại vẫn là `Warning`.
4. **Given** giao diện dùng theme sáng, tối hoặc thang xám, **When** tôi xem các loại bên cạnh nhau, **Then** nhãn vẫn đọc được và biểu tượng vẫn phân biệt được. Trình đọc màn hình có thể đọc tên loại và mô tả sự kiện.

### Edge Cases

- Thông báo cũ vẫn hiển thị và được phân loại khi loại sự kiện nhận biết được. Nếu sự kiện chỉ ghi nhận một review chung hoặc không đủ thông tin để xác định một loại cụ thể, dùng `Info`.
- Một PR có thể có cả thông báo phê duyệt và lỗi CI. Mỗi thông báo giữ loại của sự kiện đã tạo ra nó, kể cả khi trạng thái hiện tại của PR thay đổi.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Mỗi thông báo PR MUST có đúng một loại theo bảng sau.

  | Loại hiển thị | Sự kiện |
  | --- | --- |
  | `Warning` | Được yêu cầu review, yêu cầu thay đổi được xác định rõ, hoặc cần cập nhật với nhánh đích |
  | `Approved` | Một lượt review phê duyệt PR |
  | `Info` | Bình luận mới, review thông thường, hoặc sự kiện chưa xác định được loại cụ thể |
  | `Error` | Lần chạy CI thất bại |

- **FR-002**: Mục trong `Overview`, `Notifications` và toast của cùng một thông báo MUST dùng cùng nhãn tiếng Anh, biểu tượng riêng và màu theo vai trò. Nhãn MUST đọc được trong theme sáng và tối, và loại MUST nhận biết được bằng nhãn hoặc biểu tượng khi hiển thị thang xám. Trình đọc màn hình MUST đọc được loại và mô tả.
- **FR-003**: Thông báo MUST tiếp tục hiển thị mô tả sự kiện và dẫn tới PR theo hành vi hiện có. Nhãn loại MUST giữ nguyên khi trạng thái đọc hoặc tình trạng hiện tại của PR thay đổi. Dấu `Unread`, số trên tab, chấm thanh điều hướng và các thao tác đánh dấu hàng loạt MUST tiếp tục phản ánh trạng thái đọc theo phạm vi hiện có.

### Key Entities

- **Thông báo PR** — Sự kiện ghi nhận một thay đổi cụ thể của PR, có loại hiển thị và trạng thái đọc độc lập.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% sự kiện trong bảng FR-001 hiển thị đúng loại trong cả hai chế độ xem và trên toast khi toast được phát. Dữ liệu cũ không rõ loại hiển thị `Info`.
- **SC-002**: Trong theme sáng, tối và thang xám, người kiểm thử nhận diện đúng cả bốn loại bằng nhãn hoặc biểu tượng. Trình đọc màn hình đọc được tên loại và mô tả của cả bốn mục mẫu.
- **SC-003**: Trong bộ thử có ít nhất một mục mỗi loại, mở thông báo đưa đến đúng PR. Một lượt đánh dấu đã đọc và một lượt đánh dấu chưa đọc cập nhật đúng các dấu hiệu đọc mà vẫn giữ nguyên cả bốn nhãn loại.

## Assumptions

- Phạm vi là thông báo từ màn Pull Requests và toast của cùng sự kiện, theo [spec 064](../064-track-pull-requests/spec.md) và [spec 066](../066-refine-pull-requests/spec.md).
- Tính năng tập trung vào nhận diện loại ngay khi xem. Thứ tự danh sách, quy tắc phát toast và thao tác đọc tiếp tục theo hành vi hiện có.
