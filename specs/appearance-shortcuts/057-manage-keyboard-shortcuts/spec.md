# Feature Specification: Quản lý phím tắt

**Feature Branch** — `master` (nhánh hiện tại)

**Created** — 2026-11-25

**Status** — Draft

**Input** — Quản lý phím tắt, dùng Cmd + 1–9 để chuyển tab và Cmd + W để đóng tab đang chọn.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chuyển và đóng tab bằng bàn phím (Priority: P1)

Khi làm việc với nhiều tab, người dùng muốn mở ngay tab theo vị trí và đóng tab đang xem mà không cần dùng chuột.

**Why this priority** — Đây là hai thao tác tab được yêu cầu trực tiếp và có thể dùng ngay với cấu hình mặc định.

**Independent Test** — Mở các tab session, terminal, file và diff. Đổi thứ tự rồi thử chọn từng vị trí và đóng tab đang chọn bằng bàn phím.

**Acceptance Scenarios**

1. Khi có ít nhất chín tab, mỗi tổ hợp `⌘1` đến `⌘9` chọn đúng tab ở vị trí tương ứng từ trái sang phải, kể cả sau khi kéo đổi thứ tự.
2. Khi chỉ có ba tab, `⌘4` và `⌘9` giữ nguyên tab đang chọn.
3. Khi một tab đang được chọn, `⌘W` thực hiện cùng thao tác với nút đóng của tab đó. Nếu nút đóng yêu cầu xác nhận, phím tắt cũng hiển thị xác nhận. Hủy xác nhận giữ tab mở.
4. Khi đóng thành công, tab kế tiếp và focus được chọn theo quy tắc hiện có. Khi xảy ra lỗi, tab vẫn mở và ứng dụng hiển thị lỗi như khi dùng nút đóng.

### User Story 2 - Xem và đổi phím tắt (Priority: P2)

Người dùng muốn tra cứu tổ hợp đang dùng và điều chỉnh chúng theo thói quen.

**Why this priority** — Một nơi tra cứu và chỉnh sửa giúp người dùng biết phím nào thực sự có hiệu lực.

**Independent Test** — Vào Settings → Keyboard Shortcuts, tìm một lệnh, đổi tổ hợp, thử lại trong app rồi khởi động lại.

**Acceptance Scenarios**

1. Khi mở danh mục, người dùng có thể lọc theo tên lệnh hoặc tổ hợp và xem tổ hợp mặc định cùng tổ hợp hiện hành.
2. Khi lưu một tổ hợp hợp lệ, tổ hợp mới có hiệu lực ngay và vẫn hoạt động sau khi mở lại app. Tổ hợp cũ thôi kích hoạt lệnh đó.
3. Khi thử gán tổ hợp đang dùng bởi lệnh khác, người dùng thấy tên lệnh xung đột và cấu hình hiện tại được giữ nguyên. Hủy thao tác ghi nhận phím cũng giữ nguyên cấu hình.
4. Người dùng có thể khôi phục mặc định cho một lệnh hoặc toàn bộ danh mục. Khôi phục một lệnh báo xung đột nếu tổ hợp mặc định của nó đang được lệnh khác sử dụng.

### Edge Cases

- Khi không có tab đang chọn, `⌘W` giữ cửa sổ Herdsman mở.
- Khi có hơn chín tab, `⌘9` chọn tab thứ chín.
- Hộp thoại đang mở được ưu tiên nhận phím. Ghi nhận tổ hợp trong Settings không kích hoạt lệnh bên dưới. Giữ phím đóng tab không đóng liên tiếp nhiều tab.
- Nếu lưu thất bại, người dùng thấy lỗi và tổ hợp đã lưu trước đó vẫn có hiệu lực. Khởi động lại trong lúc lưu khôi phục cấu hình hợp lệ gần nhất và agent tiếp tục chạy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Settings MUST có mục Keyboard Shortcuts, liệt kê tên lệnh, tổ hợp hiện hành và tổ hợp mặc định, có thể lọc theo tên lệnh hoặc tổ hợp.
- **FR-002** — Danh mục MUST bao gồm Command Palette, Settings, thêm project, tạo workspace và session, đổi theme, bật/tắt hai sidebar, zoom, cỡ chữ, chuyển đến từng vị trí tab từ 1 đến 9 và đóng tab đang chọn. Các lệnh hiện có giữ tổ hợp mặc định và điều kiện khả dụng hiện tại.
- **FR-003** — Phím mặc định chuyển tab MUST là `⌘1`–`⌘9` trên macOS và `Ctrl+1`–`Ctrl+9` trên Linux. Vị trí tính theo thứ tự hiển thị của hàng tab hiện tại, gồm session, terminal, file và diff.
- **FR-004** — Phím mặc định đóng tab MUST là `⌘W` trên macOS và `Ctrl+W` trên Linux. Thao tác MUST chỉ áp dụng cho tab đang chọn và tuân theo quy tắc xác nhận, xử lý lỗi, chọn tab và chuyển focus của nút đóng hiện có. Nếu không có tab đang chọn, cửa sổ vẫn mở.
- **FR-005** — Người dùng MUST có thể ghi nhận, lưu hoặc hủy một tổ hợp mới và khôi phục mặc định từng lệnh hoặc toàn bộ. Tổ hợp mới MUST có ít nhất một trong Cmd, Ctrl hoặc Alt, kèm một phím khác ngoài phím bổ trợ.
- **FR-006** — Ứng dụng MUST từ chối tổ hợp trùng giữa hai lệnh trong danh mục và tổ hợp dành riêng mà ứng dụng nhận diện được, đồng thời hiển thị lý do và giữ cấu hình đang dùng. Kiểm tra này cũng áp dụng khi khôi phục mặc định từng lệnh.
- **FR-007** — Thay đổi đã lưu MUST áp dụng ngay, tồn tại sau khi mở lại app và xuất hiện nhất quán trong Settings, Command Palette, tooltip và menu ứng dụng ở những nơi đã hiển thị phím của lệnh đó.
- **FR-008** — Một lần nhấn phím MUST kích hoạt tối đa một lệnh trong danh mục. Khi cửa sổ Herdsman có focus và không có hộp thoại chặn, phím tab có hiệu lực cả khi focus ở composer hoặc terminal. Khi hộp thoại đang mở hoặc Settings đang ghi nhận tổ hợp, phím tab MUST không tác động hàng tab bên dưới.

### Key Entities

- **Lệnh** — Thao tác của Herdsman có tên, điều kiện khả dụng và tổ hợp mặc định theo hệ điều hành.
- **Gán phím** — Tổ hợp hiện hành cho một lệnh, lấy từ cấu hình người dùng hoặc mặc định.
- **Vị trí tab** — Số thứ tự từ trái sang phải trên hàng tab của project hoặc workspace đang hiển thị.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Trong hai lượt kiểm thử trước và sau khi đổi thứ tự một hàng có chín tab, 18/18 lần bấm phím số chọn đúng tab tương ứng.
- **SC-002** — Trong các ca kiểm thử đủ bốn loại tab, hành vi đóng bằng bàn phím khớp với nút đóng. Ca không có tab giữ cửa sổ mở và ca hủy xác nhận giữ tab mở.
- **SC-003** — Ít nhất 4/5 người dùng thử lần đầu tìm và đổi được một phím tắt trong 60 giây mà không cần hướng dẫn. Tổ hợp mới của mỗi lượt thành công vẫn hoạt động sau khi mở lại app.
- **SC-004** — Toàn bộ ca gán trùng trong danh mục đều hiển thị tên lệnh xung đột và giữ nguyên các tổ hợp đang dùng.

## Assumptions

- Cấu hình áp dụng cho toàn bộ bản cài Herdsman của người dùng trên máy hiện tại. Đồng bộ giữa các máy, chuỗi nhiều tổ hợp và phím toàn hệ thống nằm ngoài phạm vi.
- Các phím điều hướng chuẩn của từng điều khiển, thao tác nhập liệu và phím dành riêng cho terminal hoặc hệ điều hành giữ hành vi hiện có ngoài các tổ hợp đã gán trong danh mục.
- Đóng tab bằng phím phụ thuộc vào quy tắc đóng tab hiện có của từng loại. Thoát app khi đang chỉnh phím không ảnh hưởng đến vòng đời agent.
- Giao diện Herdsman dùng tiếng Anh. macOS là nền tảng ưu tiên, với Ctrl là phím bổ trợ mặc định tương ứng trên Linux.
