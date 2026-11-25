# Feature Specification: Mở tệp từ Rich Conversation

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Làm tính năng dẫn file từ rich conversation, khi có path của file thì có thể clickable mở file lên"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mở tệp được nhắc trong hội thoại (Priority: P1)

Khi agent nhắc đến một tệp, người dùng bấm vào đường dẫn trong Rich Conversation để xem tệp ngay trong workspace.

**Why this priority**: Người dùng có thể xem trực tiếp tệp mà agent đang nói tới, bỏ qua bước sao chép đường dẫn hoặc tìm trong cây tệp.

**Independent Test**: Mở một session có worktree riêng và có tệp cùng đường dẫn tương đối với bản trong thư mục project. Bấm đường dẫn trong hội thoại và kiểm tra nội dung hiển thị thuộc worktree của session.

**Acceptance Scenarios**

1. **Given** một tin nhắn có đường dẫn tương đối ở dạng văn bản, **When** người dùng bấm vào đường dẫn, **Then** tab tệp hiển thị đúng tệp trong thư mục làm việc của session, kể cả khi project có một tệp cùng tên và cùng đường dẫn tương đối.
2. **Given** một tin nhắn có đường dẫn tuyệt đối dưới dạng mã nội dòng hoặc có liên kết Markdown trỏ đến tệp trong workspace, **When** người dùng kích hoạt liên kết bằng chuột hoặc bàn phím, **Then** tab của đúng tệp được đưa ra trước. Nếu tab đã mở, ứng dụng dùng lại tab đó và giữ các chỉnh sửa chưa lưu.
3. **Given** một session có sẵn trong lịch sử, **When** người dùng mở lại session, **Then** các đường dẫn được hỗ trợ có thể mở từ tin nhắn cũ như từ tin nhắn mới.

---

### User Story 2 - Tiếp tục đọc khi đường dẫn không mở được (Priority: P2)

Người dùng biết khi nào đường dẫn không còn mở được và có thể tiếp tục đọc hội thoại ngay tại chỗ.

**Why this priority**: Tệp có thể đã bị đổi tên, xóa hoặc nằm ngoài workspace khi người dùng xem lại tin nhắn.

**Independent Test**: Bấm vào đường dẫn của một tệp đã xóa, một tệp không đọc được và một đường dẫn trỏ ra ngoài workspace. Sau mỗi lần bấm, kiểm tra thông báo, vị trí đọc và tab đang mở.

**Acceptance Scenarios**

1. **Given** tệp từng tồn tại nhưng đã bị xóa, thay bằng thư mục hoặc trở nên không đọc được, **When** người dùng kích hoạt đường dẫn, **Then** ứng dụng hiển thị lỗi bằng tiếng Anh tại ngữ cảnh hiện tại, giữ vị trí đọc và tab đang mở.
2. **Given** đường dẫn đi ra ngoài thư mục làm việc của session, kể cả qua liên kết tượng trưng hoặc thành phần `..`, **When** ứng dụng kiểm tra đích trước khi hiển thị, **Then** chuỗi giữ nguyên định dạng và không thành liên kết. Nếu đích thay đổi sau khi đã được xác nhận, lần bấm phải báo lỗi.
3. **Given** agent đang chạy và hội thoại chứa đường dẫn, **When** tin nhắn xuất hiện, người dùng mở tệp rồi đóng và mở lại ứng dụng, **Then** tệp chỉ được mở sau thao tác chủ động của người dùng, agent tiếp tục chạy và hội thoại được khôi phục theo luồng hiện có.

4. **Given** tin nhắn có URL web, khối mã nhiều dòng và đường dẫn chứa khoảng trắng trong mã nội dòng, **When** người dùng xem tin nhắn, **Then** URL web và khối mã giữ hành vi hiện có, còn đường dẫn trong mã nội dòng mở được đúng tệp khi kích hoạt.

5. **Given** tin nhắn chứa `close/minimize/maximize` hoặc đường dẫn đến tệp chưa tồn tại, **When** ứng dụng kiểm tra đường dẫn trong workspace, **Then** nội dung giữ nguyên định dạng và không thành liên kết.

### Edge Cases

- Đường dẫn đặt trong mã nội dòng hoặc đích liên kết Markdown có thể chứa khoảng trắng. Dấu câu kết thúc câu quanh đường dẫn dạng văn bản không thuộc tên tệp.
- Kết quả được kiểm tra khi kích hoạt liên kết vì tệp có thể đã được di chuyển sau khi tin nhắn xuất hiện.
- URL web vẫn dùng hành vi liên kết web hiện có. Nội dung bên trong khối mã nhiều dòng giữ nguyên cách hiển thị.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Rich Conversation MUST hiển thị đường dẫn tệp tương đối và tuyệt đối dưới dạng có thể kích hoạt trong tin nhắn mới và tin nhắn mở lại từ lịch sử. Các dạng được hỗ trợ gồm đường dẫn dạng văn bản có thành phần thư mục và không chứa khoảng trắng, mã nội dòng chứa đường dẫn, và liên kết Markdown có đích là đường dẫn tệp. Ứng dụng MUST xác nhận đích là tệp tồn tại trong workspace trước khi hiển thị liên kết. Liên kết MUST có thể nhận tiêu điểm và được kích hoạt bằng bàn phím.
- **FR-002**: Khi người dùng kích hoạt đường dẫn, ứng dụng MUST lấy thư mục làm việc của session chứa tin nhắn làm gốc cho đường dẫn tương đối. Với cả đường dẫn tương đối và tuyệt đối, tệp đích thực tế MUST nằm trong thư mục đó, kể cả sau khi xác định đích của liên kết tượng trưng.
- **FR-003**: Khi tệp đích đọc được và được hỗ trợ bởi tab tệp hiện có, ứng dụng MUST mở hoặc đưa tab của đúng tệp ra trước và giữ các thay đổi chưa lưu của tab đã mở.
- **FR-004**: Khi đích nằm ngoài workspace, không tồn tại, là thư mục, không đọc được hoặc không được tab tệp hỗ trợ, ứng dụng MUST hiển thị thông báo lỗi bằng tiếng Anh, giữ vị trí đọc và giữ tab đang mở.
- **FR-005**: Việc hiển thị hoặc khôi phục tin nhắn MUST không tự mở tệp. Kích hoạt liên kết MUST chỉ thực hiện điều hướng đến tệp, giữ nguyên nội dung hội thoại và không làm gián đoạn agent. Khi ứng dụng mở lại, session MUST kết nối lại theo luồng hiện có.
- **FR-006**: URL web và khối mã nhiều dòng MUST giữ hành vi hiện có.

### Key Entities *(include if feature involves data)*

- **Tham chiếu tệp** gồm đường dẫn xuất hiện trong tin nhắn và session chứa tin nhắn.
- **Tệp đích** là tệp trong thư mục làm việc của session, có thể đã mở trong một tab với thay đổi chưa lưu.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Mỗi trường hợp hợp lệ trong bộ kiểm tra gồm đường dẫn tương đối, đường dẫn tuyệt đối, mã nội dòng, liên kết Markdown và tin nhắn lịch sử mở đúng tệp bằng một lần kích hoạt.
- **SC-002**: Trong 95% của 20 lần thử với tệp cục bộ đọc được và có kích thước dưới 100 KB, tab tệp hiển thị nội dung trong vòng 2 giây sau khi kích hoạt đường dẫn.
- **SC-003**: 100% thao tác kích hoạt liên kết có đích trở nên không hợp lệ hiển thị lỗi và giữ vị trí đọc cùng tab đang mở. Chuỗi sai hoặc đích vốn không tồn tại giữ định dạng ban đầu.
- **SC-004**: Ít nhất 4 trong 5 người dùng thử mở được tệp được nhắc trong hội thoại ngay lần đầu mà không cần hướng dẫn.

## Assumptions

- Phạm vi là tin nhắn trong Rich Conversation và các loại tệp mà tab tệp của workspace đã hỗ trợ. Đường dẫn bên ngoài workspace, mở bằng ứng dụng ngoài và nhảy tới số dòng nằm ngoài phạm vi này.
- Đường dẫn tương đối dùng thư mục project hoặc worktree theo cấu hình của workspace chứa session. Nội dung tin nhắn giữ nguyên ngôn ngữ gốc.
