# Feature Specification: Mở tệp từ thẻ Read và Write

**Created**: 2026-11-26

**Status**: Draft

**Input**: Bấm vào đường dẫn trên thẻ đọc hoặc ghi code để chuyển sang trang Files và mở tệp.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mở tệp từ thẻ Read hoặc Write (Priority: P1)

Khi xem agent đọc hoặc ghi code trong Rich Conversation, người dùng có thể mở tệp ngay từ đường dẫn trên tiêu đề thẻ.

**Independent Test**: Trong một session thuộc worktree, kích hoạt đường dẫn của thẻ Read và thẻ Write rồi kiểm tra trang Files hiển thị đúng tệp của từng thẻ.

**Acceptance Scenarios**

1. **Given** thẻ Read hiển thị code đã đọc, **When** người dùng bấm vào đường dẫn, **Then** ứng dụng chuyển sang trang Files và mở đúng tệp.
2. **Given** thẻ Write có đường dẫn dài bị rút gọn và đang hiển thị diff, **When** người dùng bấm vào phần đường dẫn đang hiển thị, **Then** ứng dụng chuyển sang trang Files và mở đúng tệp theo đường dẫn đầy đủ.
3. **Given** thẻ Read hoặc Write đang thu gọn, **When** người dùng dùng bàn phím để kích hoạt đường dẫn hoặc dùng nút mở rộng thẻ, **Then** đường dẫn mở tệp còn nút mở rộng hiển thị nội dung thẻ.

### Edge Cases

- Khi project và worktree có cùng đường dẫn tương đối, tệp mở ra thuộc thư mục làm việc của session.
- Khi tệp đã mở, trang Files đưa tab đó ra trước và giữ các chỉnh sửa chưa lưu.
- Khi tệp đã bị xóa sau khi thẻ xuất hiện, lần mở thất bại hiển thị thông báo tại hội thoại để người dùng tiếp tục đọc.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Rich Conversation MUST cho phép kích hoạt đường dẫn trên tiêu đề thẻ Read và Write bằng chuột hoặc bàn phím ở cả trạng thái mở rộng và thu gọn.
- **FR-002**: Khi kích hoạt đường dẫn hợp lệ, ứng dụng MUST chuyển sang Files, mở hoặc đưa tab đúng tệp ra trước, và giữ các chỉnh sửa chưa lưu. Đường dẫn tương đối dựa trên thư mục làm việc của session. Nhãn rút gọn vẫn trỏ đến đường dẫn đầy đủ.
- **FR-003**: Nút mở rộng và thu gọn MUST điều khiển nội dung thẻ độc lập với thao tác mở tệp.
- **FR-004**: Khi lần mở tệp thất bại, ứng dụng MUST hiển thị thông báo tại hội thoại và giữ vị trí đọc.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cả 2 loại thẻ, Read và Write, đều mở đúng tệp trên trang Files chỉ qua một lần kích hoạt đường dẫn hợp lệ, kể cả khi nhãn bị rút gọn.
- **SC-002**: Trong cả 2 trạng thái mở rộng và thu gọn, người dùng có thể mở tệp bằng chuột hoặc bàn phím và điều khiển nội dung thẻ bằng nút riêng.

## Assumptions

- Trang đích là Files trong workspace của session. Phạm vi đường dẫn hợp lệ kế thừa quy tắc mở tệp từ Rich Conversation của [đặc tả 044](../044-rich-conversation-file-links/spec.md).
