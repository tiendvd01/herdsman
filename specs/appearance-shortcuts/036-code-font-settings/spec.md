# Feature Specification — Chỉnh cỡ chữ code trong Settings

**Created** 2026-11-24

**Status** Draft

**Input** “cho chỉnh code font size mà”

## User Scenarios & Testing

### User Story 1 — Chọn cỡ chữ code (P1)

Là người dùng Herdsman, tôi muốn chỉnh cỡ chữ code để đọc mã nguồn và đầu ra của agent dễ hơn.

**Independent Test** — Mở Settings → Appearance, chọn **18 px** ở **Code font size** và kiểm tra nội dung code cùng văn bản thông thường.

1. Khi người dùng chọn một cỡ chữ, app áp dụng ngay cho code nội tuyến, code block, trình sửa file, diff và Log. Font giao diện, họ font code, cỡ chữ văn bản, nội dung chỉnh sửa dở và phiên agent được giữ nguyên.
2. Với một cỡ code đã chọn, phím tắt chỉnh cỡ chữ nội dung tiếp tục đổi văn bản thông thường. Cỡ code vẫn là giá trị đã chọn.

### User Story 2 — Khôi phục và đặt lại (P2)

1. Sau khi người dùng chọn cỡ chữ và mở lại app, Settings và nội dung code khôi phục giá trị đã lưu ngay từ lần hiển thị đầu.
2. Khi bấm **Reset**, code trở lại cách tính cỡ chữ nội dung hiện có. Lựa chọn **Default** được giữ khi mở lại app.
3. Khi app cũ chưa có tùy chọn cỡ code, app hiển thị cỡ mặc định. Khi đóng app giữa thao tác, lần mở tiếp theo dùng lựa chọn hợp lệ đã lưu gần nhất. Agent tiếp tục chạy độc lập.

## Requirements

- **FR-001** Settings → Appearance phải có mục **Code font size** với nút **−**, cỡ hiện tại và nút **+**. Mỗi lần bấm đổi 1 px, trong khoảng 10–24 px.
- **FR-002** App phải áp dụng cỡ đã chọn ngay cho code nội tuyến, code block, editor, diff và Log. Thay đổi giữ nguyên họ font code, cỡ chữ văn bản thông thường và dữ liệu đang chỉnh sửa.
- **FR-003** App phải lưu lựa chọn dùng chung cho các workspace và áp dụng trước khi hiển thị nội dung khi mở lại.
- **FR-004** **Reset** phải khôi phục quy tắc tính cỡ code theo cỡ chữ nội dung hiện có. Khi chưa lưu lựa chọn, app dùng **Default**.

### Key Entities

- **Code font size** — Cỡ chữ code dùng chung trên máy, gồm giá trị mặc định hoặc số pixel do người dùng chọn.

## Success Criteria

- **SC-001** Khi chọn 18 px, cả năm vị trí trong FR-002 dùng 18 px trước khi đóng Settings, đồng thời văn bản thông thường giữ cỡ hiện tại.
- **SC-002** Hai lần mở lại sau khi lần lượt chọn 18 px và Default đều khôi phục đúng lựa chọn.
- **SC-003** Hai giá trị biên 10 px và 24 px đều chọn được trong cả theme sáng và tối.

## Assumptions

- Khoảng 10–24 px và bước 1 px là mặc định cho tính năng này. Zoom toàn app tiếp tục tác động lên toàn bộ giao diện.
