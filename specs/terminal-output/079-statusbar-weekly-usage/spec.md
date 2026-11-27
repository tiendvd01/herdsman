# Feature Specification: Hạn mức 7 ngày trên thanh trạng thái

**Feature Branch**: `master` (nhánh hiện tại)  
**Created**: 2026-11-26  
**Status**: Draft  
**Input**: “Hiện usage dưới status bar vào như này, hiện 7d limit, hover vào thì hiện chi tiết.”

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đọc nhanh mức sử dụng tuần (Priority: P1)

Khi đang làm việc, tôi muốn nhìn xuống thanh trạng thái để biết từng nhà cung cấp đã dùng bao nhiêu phần trăm hạn mức tuần.

**Why this priority**: Đây là thông tin cần đọc ngay cả khi đang nhập tin nhắn.  
**Independent Test**: Cho Claude dùng 83% hạn mức tuần và Codex dùng 10%, rồi quan sát thanh trạng thái.

**Acceptance Scenarios**:

1. Với dữ liệu trên, thanh hiển thị hai mục trên cùng một hàng, mỗi mục có biểu tượng tương ứng và nhãn ngắn như “83% 7d” và “10% 7d”, đọc được ngay khi chưa rê chuột.
2. Khi nhận mức tuần mới của Codex là 12%, mục Codex đổi thành “12% 7d” và mục Claude vẫn hiển thị 83%.

### User Story 2 - Xem chi tiết của từng nhà cung cấp (Priority: P2)

Khi muốn biết lúc nào hạn mức được đặt lại, tôi có thể xem ngay tại mục đang quan tâm.

**Why this priority**: Chi tiết giải thích con số trên thanh mà vẫn dành chỗ cho các trạng thái khác.  
**Independent Test**: Dùng chuột rồi bàn phím để xem lần lượt hai mục có mức sử dụng khác nhau.

**Acceptance Scenarios**:

1. Khi rê chuột vào Claude, phần chi tiết ghi tên Claude, mức đã dùng theo từng kỳ 5 giờ và 7 ngày có dữ liệu, cùng thời gian đến lần đặt lại nếu biết.
2. Khi chuyển sang Codex, chi tiết chuyển sang Codex. Khi rời mục và phần chi tiết, thông tin thu lại. Di chuyển tiêu điểm bàn phím vào và ra khỏi mục cho kết quả tương đương.

### Edge Cases

- Nếu chỉ biết kỳ 5 giờ, mục hiển thị “— 7d” và vẫn cho xem kỳ 5 giờ trong chi tiết.
- Khi chưa có dữ liệu từ cả hai nhà cung cấp, vùng usage báo chưa có dữ liệu. Khi chỉ một bên có dữ liệu, thanh chỉ hiện mục của bên đó.
- Giá trị 0% và 100% đều hiển thị đúng. Dữ liệu cũ hoặc hết hiệu lực dùng cùng dấu ước lượng hoặc dấu khuyết như trong chi tiết.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Thay nút Usage chung trên thanh trạng thái dưới cùng bằng một mục gọn cho mỗi nhà cung cấp có dữ liệu hạn mức.
- **FR-002**: Mỗi mục phải thể hiện biểu tượng nhà cung cấp, phần trăm hạn mức 7 ngày đã dùng và nhãn kỳ 7d. Cập nhật con số khi có dữ liệu mới.
- **FR-003**: Rê chuột hoặc đưa tiêu điểm vào một mục phải mở chi tiết của đúng nhà cung cấp. Rời mục và phần chi tiết phải đóng thông tin khi tiêu điểm cũng đã rời.
- **FR-004**: Chi tiết phải ghi tên nhà cung cấp, phân biệt từng kỳ có dữ liệu và hiển thị thời gian đến lần đặt lại cho từng kỳ có thông tin này.
- **FR-005**: Khi thiếu dữ liệu hoặc dữ liệu cũ, áp dụng các trạng thái trong Edge Cases. Số tuần trên thanh và trong chi tiết phải nhất quán.

### Key Entities

- **Nhà cung cấp**: Claude hoặc Codex, mỗi bên có hạn mức tài khoản riêng.
- **Kỳ hạn mức**: Khoảng 5 giờ hoặc 7 ngày, với phần trăm đã dùng và thời điểm đặt lại khi có.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Với hai nhà cung cấp có dữ liệu tuần, người dùng đọc được cả hai tỷ lệ trên thanh với 0 lần nhấp và 0 lần rê chuột.
- **SC-002**: Với mỗi nhà cung cấp, một lần rê chuột hoặc đưa tiêu điểm vào mục tương ứng cho biết kỳ nào sắp đặt lại khi có thời gian đặt lại.
- **SC-003**: Trong cả ba trường hợp mức tuần bằng 0%, bằng 100% và chưa biết, người dùng phân biệt được kết quả qua nhãn trên thanh.

## Assumptions

- Phần trăm là phần hạn mức đã dùng. Ảnh minh họa cách xếp biểu tượng và số liệu. Phạm vi gồm Claude và Codex đang được Herdsman hỗ trợ.
- Số liệu phụ thuộc vào thông tin hạn mức tài khoản hiện có. Việc đóng ứng dụng khi đang xem chi tiết không ảnh hưởng đến agent.
