# Feature Specification: Mở thêm tệp từ Rich Conversation

**Created**: 2026-11-27

**Status**: Draft

**Input**: Rà soát các trường hợp nên cho mở tệp từ Rich Conversation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mở từng tệp trong một thay đổi (Priority: P1)

Khi xem thẻ MultiEdit hoặc diff chứa nhiều tệp, người dùng có thể mở từng tệp để xem ngữ cảnh đầy đủ.

**Independent Test**: Mở một thẻ thay đổi hai tệp trong worktree, trong đó một tên chứa dấu phẩy. Kích hoạt từng đường dẫn bằng chuột và bàn phím.

**Acceptance Scenarios**

1. MultiEdit thay đổi nhiều đoạn của cùng một tệp hiển thị một liên kết mở tệp đó.
2. Một diff có hai tệp đang tồn tại hiển thị hai đích độc lập. Mỗi liên kết mở đúng tệp dù tên chứa khoảng trắng hoặc dấu phẩy.
3. Tệp đổi tên mở theo tên hiện tại. Tệp đã xóa vẫn có tên và diff để người dùng đọc.

### User Story 2 - Đi đến vị trí được nhắc trong hội thoại (Priority: P2)

Người dùng mở nhanh tệp từ thông báo lỗi hoặc tham chiếu có số dòng để kiểm tra nơi phát sinh vấn đề.

**Independent Test**: Thử một tham chiếu trong tin nhắn, một kết quả Grep có vị trí và một kết quả Glob chỉ có tên tệp.

**Acceptance Scenarios**

1. Kích hoạt `src/main.ts:12:5` trong tin nhắn mở đúng tệp và đưa trình xem tới dòng 12, cột 5.
2. Đường dẫn nhận diện được trong kết quả Grep, Glob hoặc thông báo lỗi Bash đã hoàn tất mở đúng tệp. Kết quả có số dòng thì đưa trình xem đến dòng đó.
3. Tên tệp đứng riêng như `README.md` được viết dưới dạng mã nội dòng mở tệp ở thư mục làm việc của session nếu tệp tồn tại ở đó.

### Edge Cases

- Tham chiếu ngoài workspace, URL web, thư mục, glob pattern và đoạn mã mẫu giữ cách hiển thị phù hợp với loại nội dung. Chỉ tệp hợp lệ trong workspace là đích mở tệp.
- Nếu dòng đã vượt quá độ dài tệp hiện tại, trình xem mở tệp và đưa người dùng đến dòng cuối. Nếu tệp biến mất sau khi liên kết xuất hiện, người dùng nhận thông báo tại hội thoại.
- Đường dẫn rút gọn vẫn trỏ tới đường dẫn đầy đủ. Một đường dẫn tương đối dùng thư mục làm việc của session, kể cả khi project có tệp trùng tên.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Rich Conversation MUST cung cấp liên kết riêng cho từng tệp có thể mở trong MultiEdit và diff nhiều tệp. Tên tệp chứa khoảng trắng hoặc dấu phẩy MUST được giữ nguyên.
- **FR-002**: Tin nhắn và kết quả công cụ đã hoàn tất MUST cho phép mở tệp từ các tham chiếu rõ ràng. Tham chiếu có dạng `path:line[:column]` MUST đưa trình xem đến vị trí tương ứng.
- **FR-003**: Liên kết MUST dùng được bằng chuột và bàn phím, độc lập với nút thu gọn. Mở tệp MUST chọn đúng tab Files và giữ chỉnh sửa chưa lưu của tab đã mở.
- **FR-004**: Các hành vi trên MUST áp dụng với cả session đang chạy và session mở lại từ lịch sử.

### Key Entities *(include if feature involves data)*

- **Tham chiếu tệp** gồm đường dẫn, session và vị trí dòng hoặc cột nếu có.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong diff có hai tệp, mỗi tệp được mở đúng bằng một lần kích hoạt, kể cả khi một tên chứa dấu phẩy.
- **SC-002**: Cả ba mẫu kiểm thử gồm tin nhắn có dòng và cột, kết quả Grep có dòng và kết quả Glob chỉ có đường dẫn đều mở đúng đích sau một thao tác.

## Assumptions

- Ưu tiên đường dẫn có đích xác định và phát sinh từ thao tác tệp hoặc kết quả công cụ. Nội dung lệnh Bash, code mẫu và output đang stream phục vụ việc đọc nguyên văn.
- Phạm vi workspace và quy tắc kiểm tra đích kế thừa spec 044. Read, Write và Edit một tệp là các trường hợp đã có. Phạm vi mới tập trung vào MultiEdit, diff nhiều tệp và tham chiếu có vị trí.
