# Feature Specification: Đánh dấu tất cả thông báo PR là chưa đọc

**Feature Branch**: `master`

**Created**: 2026-11-26

**Status**: Implemented

**Input**: User description: "Làm nút unread all notification"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đánh dấu lại thông báo để xem sau (Priority: P1)

Là người theo dõi PR, tôi muốn đánh dấu tất cả thông báo trong phạm vi đang xem là chưa đọc để có thể xem lại sau.

**Why this priority**: Một lần bấm giúp tôi đưa nhiều thông báo trở lại danh sách cần chú ý.

**Independent Test**: Chuẩn bị thông báo đã đọc và chưa đọc cho hai project. Thử thao tác trong một project rồi lặp lại với `All projects`, đối chiếu trạng thái từng thông báo, bộ đếm trên tab và chấm trên thanh điều hướng.

**Acceptance Scenarios**

1. **Given** tôi đang xem một project có cả thông báo đã đọc và chưa đọc, **When** tôi chọn `Mark all as unread`, **Then** mọi thông báo trong phạm vi project hiện là chưa đọc và bộ đếm cùng chấm thông báo cập nhật theo trạng thái mới.
2. **Given** tôi chọn `All projects`, **When** tôi kích hoạt nút, **Then** mọi thông báo PR mà tài khoản hiện tại có quyền xem được đánh dấu chưa đọc, kể cả những mục ngoài vùng nhìn khi cuộn. Thông báo dùng chung giữa nhiều project chỉ được tính một lần trong tổng.
3. **Given** thao tác thành công, **When** tôi làm mới, mở lại app hoặc đổi tài khoản rồi quay lại, **Then** trạng thái được giữ cho đúng tài khoản. Khi mở riêng một thông báo, thông báo đó lại được đánh dấu đã đọc như hiện tại.
4. **Given** danh sách trống hoặc tất cả đã là chưa đọc, **When** tôi xem khu vực thông báo, **Then** nút bị vô hiệu hóa. Khi thao tác thất bại, danh sách, bộ đếm và chấm thông báo phản ánh trạng thái đã lưu, và thông báo lỗi cho tôi biết có thể thử lại.

5. **Given** phạm vi hiện tại có thông báo chưa đọc, **When** tôi chọn `Mark all as read`, **Then** mọi thông báo trong phạm vi chuyển thành đã đọc. Chấm trên thanh điều hướng biến mất khi không còn thông báo chưa đọc ở bất kỳ project nào.

### Edge Cases

- Thông báo của project khác giữ nguyên trạng thái, ngoại trừ sự kiện dùng chung với project được chọn. Sự kiện dùng chung có một trạng thái đọc duy nhất ở mọi nơi nó xuất hiện.
- Nếu đổi project hoặc tài khoản trong lúc cập nhật, thao tác áp dụng theo phạm vi lúc kích hoạt. Danh sách, bộ đếm và chấm thông báo đang hiển thị phản ánh đúng phạm vi và tài khoản mới.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Khu vực thông báo PR trong `Notifications` và `Overview` MUST có nút `Mark all as unread`, dùng được bằng chuột và bàn phím, có focus rõ ràng trong theme sáng và tối.
- **FR-002**: Một lần kích hoạt MUST chuyển mọi thông báo đã đọc trong phạm vi project đang chọn sang chưa đọc. Với `All projects`, phạm vi gồm mọi thông báo PR mà tài khoản hiện tại có quyền xem. Các project dùng chung một thông báo MUST phản ánh cùng trạng thái.
- **FR-003**: Khi cập nhật thành công, dấu `Unread`, số chưa đọc của `Notifications` và chấm báo có thông báo chưa đọc ở thanh điều hướng MUST phản ánh trạng thái mới. Thao tác MUST giữ nguyên chế độ xem, các mục trong danh sách và đích mở PR. Làm mới, mở lại app hoặc chuyển tài khoản rồi quay lại MUST giữ trạng thái đã lưu cho đúng tài khoản.
- **FR-004**: Nút MUST bị vô hiệu hóa khi không có thông báo đã đọc đủ điều kiện hoặc khi thao tác đang chạy. Khi cập nhật thất bại, giao diện MUST hiển thị trạng thái đã lưu và lỗi để người dùng có thể thử lại.

- **FR-005**: `Overview` và `Notifications` MUST có nút `Mark all as read`. Nút áp dụng cùng phạm vi, cách lưu trạng thái và xử lý lỗi như `Mark all as unread`. Nút bị vô hiệu hóa khi không còn thông báo chưa đọc trong phạm vi hoặc khi một thao tác đánh dấu đang chạy.

### Key Entities

- **Thông báo PR** — Sự kiện gắn với PR, tài khoản và một hoặc nhiều project, có trạng thái đã đọc hoặc chưa đọc.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Với hai project và ít nhất một thông báo dùng chung, một lần bấm cập nhật đúng 100% thông báo thuộc phạm vi thử, đồng thời số trên tab Notifications khớp phạm vi đang xem và chấm trên thanh điều hướng phản ánh mọi project có thông báo chưa đọc.
- **SC-002**: Sau một lần làm mới, một lần mở lại app và một lượt đổi rồi quay lại tài khoản, 100% thông báo đã cập nhật giữ đúng trạng thái đã lưu.
- **SC-003**: Trong cả hai theme, người kiểm thử có thể tìm và kích hoạt nút bằng bàn phím khi có thông báo đã đọc. Trong ca thử thao tác thất bại, người kiểm thử thấy lỗi và có thể thử lại khi nút khả dụng.

## Assumptions

- “Unread all” nghĩa là đánh dấu tất cả thông báo PR trong Herdsman là **chưa đọc**. “Tất cả” theo bộ chọn project hiện tại, với `All projects` dùng để áp dụng cho toàn bộ phạm vi truy cập.
- Thao tác dùng trạng thái đọc của Herdsman theo [spec 064](../064-track-pull-requests/spec.md) và bố cục thông báo theo [spec 066](../066-refine-pull-requests/spec.md).
