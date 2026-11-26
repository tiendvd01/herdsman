# Feature Specification: Quay lại danh sách từ chi tiết PR

**Feature Branch**: `master`

**Created**: 2026-11-26

**Status**: Implemented

**Input**: User description: "làm nút back cho màn PRs chi tiết để back về danh sách PR"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quay lại danh sách PR (Priority: P1)

Là người đang xem chi tiết một pull request, tôi muốn luôn thấy nút quay lại để tiếp tục duyệt danh sách ngay cả khi đã cuộn xuống phần mô tả hoặc bình luận.

**Why this priority**: Người dùng thường mở nhiều PR liên tiếp. Quay lại đúng vị trí giúp họ tiếp tục từ hàng vừa xem.

**Independent Test**: Mở một PR nằm ngoài vùng nhìn ban đầu của danh sách, cuộn xuống cuối chi tiết rồi dùng `Back to list`. Kiểm tra chế độ xem, phạm vi project, vị trí cuộn và focus sau khi quay lại.

**Acceptance Scenarios**:

1. **Given** tôi mở PR từ danh sách của một project hoặc từ `All projects`, **When** tôi cuộn trong chi tiết rồi bấm `Back to list`, **Then** tôi quay về đúng chế độ xem, phạm vi project và vị trí đọc trước đó, với focus ở hàng PR nếu hàng còn hiển thị.
2. **Given** tôi mở chi tiết từ danh sách thông báo hoặc từ toast, **When** tôi kích hoạt `Back to list`, **Then** tôi về chế độ xem đã chọn thông báo trong project đích hoặc về `Overview` của project đích nếu mở từ toast.
3. **Given** chi tiết đang mở trong theme sáng hoặc tối, **When** tôi dùng bàn phím để đưa focus tới `Back to list` và kích hoạt nút, **Then** nút có chỉ báo focus rõ ràng và danh sách tương ứng xuất hiện.

### Edge Cases

- Nếu hàng đã biến mất khi danh sách cập nhật, quay về cùng chế độ xem và phạm vi project, giữ vị trí gần nhất mà danh sách còn cho phép và chuyển focus tới tiêu đề danh sách.
- Nếu chi tiết còn mở trong khi dữ liệu mô tả, bình luận hoặc CI đang tải hoặc gặp lỗi, nút quay lại vẫn hoạt động.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Màn chi tiết PR MUST hiển thị nút `Back to list` ở đầu màn hình và giữ nút trong vùng nhìn khi người dùng cuộn chi tiết. Nút MUST dùng được bằng chuột và bàn phím, với chỉ báo focus rõ ràng trong theme sáng và tối.
- **FR-002**: Một lần kích hoạt `Back to list` MUST đóng chi tiết và hiển thị lại danh sách trong màn `Pull Requests`. Cách khôi phục ngữ cảnh MUST theo nơi mở chi tiết và áp dụng xử lý fallback khi hàng cũ biến mất.
- **FR-003**: Nút MUST có thể kích hoạt khi chi tiết còn mở, kể cả khi dữ liệu chi tiết đang tải hoặc gặp lỗi.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% lượt thử từ danh sách có ít nhất 30 PR, khi mở hàng ngoài vùng nhìn ban đầu rồi cuộn tới cuối chi tiết, quay về đúng phạm vi, chế độ xem, vị trí đọc và hàng đang focus bằng một lần kích hoạt, nếu hàng còn tồn tại.
- **SC-002**: 100% lượt thử từ danh sách thông báo và từ toast trở về chế độ xem tương ứng trong đúng project.
- **SC-003**: Trong cả hai theme, người kiểm thử có thể nhận ra nút khi đang ở cuối phần chi tiết, thấy chỉ báo focus và quay lại bằng bàn phím. Nút vẫn hoạt động trong cả hai trường hợp đang tải và tải lỗi.

## Assumptions

- Giữ quy tắc quay lại theo [spec 066](../066-refine-pull-requests/spec.md) và nhãn `Back to list` đã dùng trong [spec 067](../067-expand-pr-details/spec.md).
- Phạm vi là vị trí, khả năng truy cập và đích điều hướng của nút quay lại trên màn chi tiết PR trong Herdsman.
