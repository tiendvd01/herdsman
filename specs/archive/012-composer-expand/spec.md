# Feature Specification: Nút mở rộng ô chat để soạn text dài

**Feature Branch**: `012-composer-expand`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Làm chức năng button mở rộng ô chat để soạn text dài" (kèm ảnh: nút mũi tên chéo hai chiều nằm cạnh nút đính kèm trong thanh công cụ ô chat)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mở rộng ô chat để soạn prompt dài (Priority: P1)

Developer cần viết một prompt dài (mô tả task nhiều đoạn, dán log, liệt kê yêu cầu). Ô chat mặc định thấp, chỉ hiện vài dòng rồi cuộn, khó nhìn toàn bộ nội dung. Developer bấm nút mở rộng trên thanh công cụ ô chat; ô chat cao lên chiếm phần lớn khung hội thoại để thấy và sửa được nhiều dòng cùng lúc.

**Why this priority**: đây là toàn bộ giá trị người dùng yêu cầu.

**Independent Test**: mở một session, gõ/dán 40 dòng text, bấm nút mở rộng → ô chat cao lên rõ rệt, hiện được nhiều dòng hơn hẳn; nội dung đang gõ còn nguyên.

**Acceptance Scenarios**:

1. **Given** ô chat ở kích thước thường, **When** người dùng bấm nút mở rộng, **Then** vùng soạn thảo cao lên chiếm phần lớn chiều cao khung hội thoại và con trỏ vẫn ở trong ô chat.
2. **Given** ô chat đang có nội dung và ảnh đính kèm, **When** mở rộng hoặc thu nhỏ, **Then** nội dung, vị trí con trỏ và ảnh đính kèm giữ nguyên.
3. **Given** ô chat đang mở rộng, **When** nội dung dài hơn vùng soạn thảo, **Then** vùng soạn thảo cuộn bên trong, thanh công cụ (đính kèm, chế độ, model, gửi) vẫn luôn hiện.
4. **Given** ô chat đang mở rộng, **When** người dùng gửi tin nhắn, **Then** tin được gửi như bình thường và ô chat trở về kích thước thường.

---

### User Story 2 - Thu nhỏ lại (Priority: P1)

Sau khi soạn xong hoặc muốn xem lại hội thoại, developer thu ô chat về kích thước thường bằng chính nút đó (lúc này hiển thị biểu tượng thu nhỏ) hoặc bằng phím Esc.

**Why this priority**: không thu nhỏ được thì ô chat mở rộng che mất hội thoại.

**Independent Test**: mở rộng ô chat → bấm lại nút (biểu tượng đã đổi thành thu nhỏ) → ô chat về kích thước thường; mở rộng lại → nhấn Esc → về kích thước thường.

**Acceptance Scenarios**:

1. **Given** ô chat đang mở rộng, **When** bấm nút thu nhỏ, **Then** ô chat về kích thước thường, nội dung giữ nguyên.
2. **Given** ô chat đang mở rộng và không mở danh sách lệnh `/`, **When** nhấn Esc, **Then** ô chat thu nhỏ; agent đang chạy KHÔNG bị interrupt bởi lần nhấn này.
3. **Given** ô chat ở kích thước thường, **When** nhấn Esc lúc agent đang chạy, **Then** hành vi interrupt như hiện tại không đổi.
4. **Given** nút ở trạng thái nào, **When** rê chuột hoặc dùng trình đọc màn hình, **Then** tooltip/nhãn cho biết hành động tương ứng ("Expand editor" / "Collapse editor") và trạng thái mở rộng.

### Edge Cases

- Ô chat bị vô hiệu (mất kết nối agent): nút mở rộng cũng vô hiệu.
- Danh sách lệnh `/` đang mở khi ô chat mở rộng: Esc vẫn đóng danh sách lệnh trước, lần Esc sau mới thu nhỏ.
- Cửa sổ app thấp: ô chat mở rộng không đẩy thanh công cụ ra khỏi màn hình; chiều cao mở rộng có giới hạn theo chiều cao cửa sổ.
- Chuyển sang session khác: ô chat của session mới hiện ở kích thước thường.
- Gửi lỗi: ô chat vẫn mở rộng và giữ nguyên nội dung để người dùng thử lại.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Thanh công cụ ô chat MUST có nút mở rộng (biểu tượng mũi tên chéo hướng ra) đặt cạnh nút đính kèm ảnh.
- **FR-002**: Bấm nút khi ô chat thường MUST làm vùng soạn thảo cao lên chiếm phần lớn chiều cao khung hội thoại (khoảng 65% chiều cao cửa sổ), không vượt khỏi màn hình.
- **FR-003**: Khi mở rộng, nút MUST đổi sang biểu tượng thu nhỏ (mũi tên chéo hướng vào); bấm lại MUST thu ô chat về kích thước thường.
- **FR-004**: Mở rộng/thu nhỏ MUST giữ nguyên nội dung, ảnh đính kèm và giữ focus trong ô chat.
- **FR-005**: Khi đang mở rộng, Esc (không có danh sách lệnh `/` mở) MUST thu nhỏ ô chat và MUST NOT interrupt agent ở cùng lần nhấn.
- **FR-006**: Gửi tin thành công MUST đưa ô chat về kích thước thường; gửi lỗi MUST giữ trạng thái mở rộng.
- **FR-007**: Phím Enter gửi, Shift+Enter xuống dòng MUST giữ nguyên như chế độ thường.
- **FR-008**: Nút MUST có nhãn truy cập và tooltip theo trạng thái ("Expand editor" / "Collapse editor") và báo trạng thái mở rộng cho trình đọc màn hình.
- **FR-009**: Nút MUST bị vô hiệu khi ô chat bị vô hiệu.
- **FR-010**: Trạng thái mở rộng MUST chỉ là trạng thái giao diện tạm thời: mặc định là thường khi mở session, không lưu lại giữa các lần mở app.

### Key Entities

- **Trạng thái mở rộng của ô chat**: bật/tắt, thuộc về ô chat đang hiển thị, không lưu bền.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ở cửa sổ mặc định, ô chat mở rộng hiển thị được ít nhất gấp đôi số dòng so với chiều cao tối đa của ô chat thường.
- **SC-002**: Mở rộng hoặc thu nhỏ hoàn tất trong một thao tác (một lần bấm hoặc một phím) và phản hồi tức thì (dưới 100 ms cảm nhận được).
- **SC-003**: 100% trường hợp mở rộng/thu nhỏ không làm mất ký tự nào hay ảnh đính kèm nào.
- **SC-004**: Hành vi gửi, xuống dòng, lệnh `/` và interrupt ở chế độ thường không đổi (kiểm thử hồi quy pass).

## Assumptions

- Mở rộng tại chỗ (ô chat cao lên trong khung hội thoại), không mở cửa sổ/hộp thoại riêng — giữ nguyên các nút chế độ, model, gửi ở cùng chỗ.
- Ảnh tham chiếu đến từ một UI khác; trong Herdsman, nút đặt cạnh nút đính kèm ảnh của ô chat hiện tại.
- Không thêm phím tắt toàn cục mới để mở rộng (tránh xung đột); Esc chỉ dùng để thu nhỏ.
- Không ảnh hưởng tiến trình agent (thuần giao diện), nên tắt app giữa chừng không tác động gì tới agent.
