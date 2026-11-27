# Feature Specification: Khởi tạo CodeGraph theo project

**Feature Branch**: `master`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "Làm tính năng init codegraph giống như herdr-app vào trong herdsman"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tạo và xem index theo project (Priority: P1)

Developer mở **CodeGraph Index** từ menu project và thấy trạng thái của project đó. Khi chưa có index, họ có thể tạo index tại thư mục project bằng một thao tác rồi xem kết quả trong app.

1. Project chưa có index hiển thị **Initialize index**. Chọn hành động sẽ bắt đầu lập chỉ mục, kể cả khi đóng hộp thoại hoặc app trong lúc chạy. Mở lại hiển thị trạng thái hiện tại hoặc kết quả.
2. Project đã có index hiển thị số tệp, số symbol và thời điểm lập chỉ mục khi có dữ liệu. **Refresh index** cập nhật index hiện có.
3. Thiếu công cụ, project không hợp lệ hoặc chạy lỗi đều có trạng thái giải thích. Sau lỗi chạy, người dùng có thể thử lại khi khắc phục nguyên nhân.
4. Mở hộp thoại hoặc chọn project khác chỉ đọc trạng thái. Bấm lặp lại khi đang chạy chỉ có một lượt chạy tại thư mục project đó.

**Independent Test** — Mở một Git project chưa có index, bấm Initialize, đóng và mở lại hộp thoại, rồi kiểm tra trạng thái và số liệu khi chạy xong.

### User Story 2 - Giữ index ngoài thay đổi Git (Priority: P1)

Index do app tạo được loại trừ bằng Git exclude cục bộ của repository. Với index có sẵn mà Git chưa bỏ qua, người dùng có thể thêm exclude mà không lập chỉ mục lại.

**Independent Test** — Khởi tạo ở một linked worktree đã đăng ký làm project. Kiểm tra Git exclude dùng chung có đúng một quy tắc, Git không liệt kê index và các tệp tracked giữ nguyên.

### Edge Cases

- Hộp thoại ghi nhận nếu repository theo dõi tệp trong index. Quy tắc ignore không thể ẩn tệp tracked.
- File exclude thiếu hoặc thiếu newline vẫn được cập nhật mà giữ nguyên dòng cũ. Quy tắc tương đương được dùng lại.
- Thư mục home, filesystem root và thư mục không phải gốc checkout Git không được lập chỉ mục.

## Requirements *(mandatory)*

- **FR-001** — Menu project MUST cung cấp **CodeGraph Index** và trạng thái của đúng project.
- **FR-002** — Người dùng MUST có thể chủ động tạo index mới hoặc cập nhật index hiện có, mỗi thư mục project chỉ có một lượt chạy của Herdsman tại một thời điểm.
- **FR-003** — App MUST bảo đảm index mới được ignore cục bộ trước khi tạo, dùng exclude chung nếu project là linked worktree. Cấu hình Git tracked MUST được giữ nguyên. Với index hiện có, app MUST cho phép thêm exclude một cách độc lập.
- **FR-004** — App MUST hiển thị lỗi, thiếu công cụ, trạng thái đang chạy và số liệu khi có. Việc đóng app MUST để lượt chạy tiếp tục và khi mở lại có thể xem trạng thái hoặc kết quả.
- **FR-005** — Chỉ dùng CodeGraph đã cài và lập chỉ mục thư mục project đã đăng ký. Xem trạng thái không tự cài công cụ, đăng ký MCP hoặc tạo index.

### Key Entities

- **CodeGraph index** — Dữ liệu lập chỉ mục cục bộ theo thư mục project.
- **Lượt lập chỉ mục** — Thao tác tạo hoặc cập nhật do người dùng yêu cầu, có thư mục đích và kết quả.
- **Git exclude cục bộ** — Danh sách loại trừ Git chia sẻ giữa các checkout của cùng repository.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Từ hộp thoại CodeGraph Index, một lần bấm khởi tạo được index mà không cần mở terminal để nhập lệnh.
- **SC-002** — Với checkout chính và linked worktree, sau khi tạo thành công, Git có 0 mục chưa được theo dõi do index và 0 thay đổi trên file ignore tracked.
- **SC-003** — Bấm khởi tạo lặp lại trong lúc chạy chỉ phát sinh một lượt. Đóng và mở lại app không phát sinh lượt thay thế.

## Assumptions

- Tham chiếu hành vi từ Project Settings → Index của bản cấu hình Herdr App cục bộ, đặc tả 026 và `lib/codegraph.js`.
- Trong Herdsman, đích là thư mục đã đăng ký của project. Các worktree xuất hiện bên dưới project không tự nhận index.
- Cài CLI, cấu hình MCP, xóa index và project từ xa nằm ngoài phạm vi.
