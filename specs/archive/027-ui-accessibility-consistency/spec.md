# Feature Specification: Điều hướng và phản hồi giao diện nhất quán

**Feature Branch**: `master`

**Created**: 2026-11-23

**Status**: Draft

**Input**: Xử lý các phát hiện từ đợt rà soát giao diện của Herdsman.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Duyệt và chuyển tab bằng bàn phím (Priority: P1)

Người dùng điều hướng các tab session, file và panel phải bằng bàn phím, đồng thời nhận biết tab được chọn và nội dung của nó khi dùng trình đọc màn hình.

**Independent Test**: Mở một session và một file, rồi dùng bàn phím chuyển giữa hai tab và giữa các mục của panel phải.

**Acceptance Scenarios**:

1. **Given** focus đang ở một tab, **When** người dùng nhấn mũi tên trái hoặc phải, **Then** focus chuyển đến tab liền kề trong cùng hàng. Home và End đưa focus tới tab đầu và cuối.
2. **Given** focus đang ở một tab, **When** người dùng nhấn Enter hoặc Space, **Then** app hiển thị nội dung của tab đó, đồng bộ trạng thái được chọn và liên kết tab với nội dung để trình đọc màn hình nhận biết.
3. **Given** tab file đang mở có thay đổi chưa lưu, **When** người dùng chuyển tab bằng bàn phím rồi quay lại, **Then** nội dung đang sửa vẫn còn.
4. **Given** tab đang chọn có thể đóng, **When** việc đóng hoàn tất, **Then** app chọn và đưa focus đến tab kế tiếp theo thứ tự hiển thị, hoặc tab phía trước nếu tab vừa đóng nằm cuối. Nếu không còn tab, focus đến nút tạo session khi có, hoặc nút điều khiển panel phải.
5. **Given** đóng tab mở hộp thoại xác nhận, **When** người dùng hủy hoặc thao tác đóng thất bại, **Then** tab và nội dung hiện tại vẫn còn. Khi hộp thoại đóng, focus trở về nút đã mở hộp thoại.
6. **Given** một hàng có tab đang chọn, **When** người dùng dùng Tab để vào hàng tab từ điều khiển phía trước, **Then** focus vào tab đang chọn. Tab có focus và tab đang chọn phải phân biệt được khi chúng khác nhau.

### User Story 2 - Tìm kiếm và chọn thiết lập bằng bàn phím (Priority: P1)

Người dùng biết kết quả nào đang được nhắm tới trong Command Palette và có thể đổi tùy chọn trong các nhóm lựa chọn.

**Independent Test**: Dùng trình đọc màn hình để duyệt hai kết quả trong Command Palette, mở kết quả thứ hai rồi đổi lựa chọn ở Theme, Working directory và Search scope.

**Acceptance Scenarios**:

1. **Given** Command Palette có từ hai kết quả, **When** người dùng nhấn mũi tên lên hoặc xuống, **Then** focus vẫn ở ô tìm kiếm, kết quả hiện hành được đánh dấu và trình đọc màn hình nhận biết tên của kết quả đó. Enter thực hiện đúng mục đang được đánh dấu.
2. **Given** focus vào nhóm Theme, Working directory hoặc Search scope, **When** người dùng dùng phím mũi tên, **Then** focus và lựa chọn chuyển cùng nhau giữa các mục khả dụng. Trình đọc màn hình nhận biết mục được chọn và người dùng có thể rời nhóm bằng Tab.
3. **Given** kết quả hiện hành biến mất sau khi đổi truy vấn hoặc nhận kết quả mới, **When** danh sách cập nhật, **Then** app trỏ đến kết quả đầu tiên còn khả dụng hoặc bỏ chỉ báo nếu danh sách rỗng. Enter chỉ kích hoạt mục hiện hành trong danh sách đang hiển thị.

### User Story 3 - Nhận phản hồi nhất quán khi sao chép và khi panel trống (Priority: P2)

Người dùng sao chép đoạn mã bằng chuột hoặc bàn phím và nhận biết khi một panel chưa có nội dung.

**Independent Test**: Dùng Tab để đến nút Copy code, sao chép thành công rồi thử lại khi clipboard báo lỗi. Mở các panel trong những ngữ cảnh không có dữ liệu.

**Acceptance Scenarios**:

1. **Given** đoạn mã có nút Copy code, **When** người dùng di chuột qua đoạn mã hoặc đưa focus tới nút bằng bàn phím, **Then** nút hiện rõ. Sau khi kích hoạt, app chỉ báo **Copied** nếu clipboard đã nhận nội dung. Khi thất bại, app thông báo lỗi và cho phép thử lại.
2. **Given** Agents, Tasks, Git hoặc Log chưa có mục hiển thị, **When** người dùng mở panel tương ứng, **Then** trạng thái trống dùng cùng mẫu với Files và giải thích lý do phù hợp. Trạng thái đang tải được trình bày riêng.
3. **Given** panel đang chờ dữ liệu hoặc lần tải thất bại, **When** người dùng xem panel, **Then** app hiển thị thông báo đang tải hoặc thông báo lỗi tương ứng. Trạng thái trống chỉ xuất hiện khi thiếu ngữ cảnh cần thiết hoặc đã xác định không có dữ liệu để hiển thị.

### Edge Cases

- Hàng chỉ có một tab giữ focus ở tab đó. Khi đóng tab cuối và không có nút tạo session, focus chuyển đến một điều khiển còn hiển thị trong cùng vùng giao diện.
- Nếu kết quả Command Palette thay đổi do người dùng sửa truy vấn hoặc do tải xong, chỉ mục được thông báo phải còn trong danh sách hiện tại. Với danh sách rỗng, Enter không kích hoạt mục nào.
- Nhóm lựa chọn bỏ qua mục bị vô hiệu hóa. Thao tác điều hướng tab và nhóm lựa chọn không chiếm phím mũi tên khi focus ở editor hoặc ô nhập liệu.
- Clipboard có thể từ chối thao tác. Lỗi tải panel và kết quả trống được hiển thị thành các trạng thái khác nhau.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** App MUST dùng cùng quy ước hiển thị focus và lựa chọn cho tab session và file. Cả hai hàng tab chính và panel phải MUST hỗ trợ mũi tên trái/phải, Home/End và Enter/Space. Trình đọc màn hình MUST nhận biết tab được chọn và vùng nội dung tương ứng.
- **FR-002** Khi tab đang chọn được đóng, app MUST đưa focus đến mục còn khả dụng theo kịch bản nghiệm thu. Việc đổi tab MUST giữ bản nháp và các thao tác đóng tab hiện có.
- **FR-003** Command Palette MUST thông báo kết quả đang được trỏ tới khi focus ở ô tìm kiếm và MUST đồng bộ kết quả đó với thao tác Enter. Kết quả cũ không còn trong danh sách MUST không được kích hoạt.
- **FR-004** Theme, Working directory và Search scope MUST hỗ trợ điều hướng và chọn bằng bàn phím, công bố lựa chọn hiện tại và bỏ qua mục bị vô hiệu hóa.
- **FR-005** Copy code MUST hiển thị khi hover hoặc khi có focus. App MUST xác nhận thành công sau khi ghi clipboard thành công và MUST hiển thị lỗi khi ghi thất bại.
- **FR-006** Agents, Tasks, Git và Log MUST dùng cùng mẫu trạng thái trống với Files. Thông báo MUST phù hợp với panel hiện tại và phân biệt với trạng thái tải hoặc lỗi.
- **FR-007** Nhãn, trạng thái và phản hồi mới MUST dùng tiếng Anh. Các bề mặt được cập nhật MUST tuân theo chuẩn giao diện của constitution trong theme sáng lẫn tối.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** Cả hai hàng tab vượt qua ca thử di chuyển focus, kích hoạt tab và nhận biết nội dung được chọn chỉ bằng bàn phím và trình đọc màn hình. Ba ca thử đóng tab ở giữa, ở cuối và khi chỉ còn một tab đưa focus đến đúng đích. Ca thử chuyển qua lại giữa file đang sửa và session giữ nguyên bản nháp.
- **SC-002** Trong ca thử có ba kết quả, trình đọc màn hình nhận biết đúng kết quả tại cả ba vị trí. Khi sửa truy vấn thành không có kết quả, Enter không mở mục cũ.
- **SC-003** Cả ba nhóm lựa chọn cho phép đổi mục bằng bàn phím và thông báo mục đang chọn.
- **SC-004** Cả hai ca clipboard, thành công và thất bại, hiển thị đúng phản hồi khi người dùng kích hoạt Copy code bằng bàn phím.
- **SC-005** Cả bốn panel Agents, Tasks, Git và Log hiển thị mẫu trống nhất quán với Files trong theme sáng và tối.

## Assumptions

- Phạm vi gồm năm phát hiện trong đợt rà soát. Quy tắc tìm kiếm, luồng quản lý workspace và vòng đời session hiện tại tiếp tục áp dụng.
- Mũi tên chuyển focus trong hàng tab. Enter hoặc Space kích hoạt tab để tránh mở nội dung hay đổi ngữ cảnh khi người dùng chỉ đang duyệt tên tab.
