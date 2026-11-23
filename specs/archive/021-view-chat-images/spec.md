# Feature Specification: Bấm để xem ảnh đính kèm trong chat

**Feature Branch**: `master`

**Created**: 2026-11-23

**Status**: Draft

**Input**: User description: "Tôi muốn update tính năng có thể xem được ảnh upload vào chat bằng cách ấn vào ảnh"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem ảnh đã gửi trong chat (Priority: P1)

Người dùng muốn bấm vào ảnh đính kèm trong tin nhắn để xem chi tiết ngay trong Herdsman.

**Why this priority**: Người dùng cần mở lại ảnh trong ngữ cảnh của cuộc hội thoại.

**Independent Test**: Gửi tin nhắn có hai ảnh khác nhau, bấm lần lượt vào từng ảnh, sau đó mở lại ứng dụng và thử lại.

**Acceptance Scenarios**:

1. **Given** tin nhắn có nhiều ảnh đính kèm còn dữ liệu, **When** người dùng bấm vào một hình thu nhỏ, **Then** khung xem mở đúng ảnh đã chọn, hiển thị trọn ảnh và giữ tỷ lệ.
2. **Given** khung xem đang mở, **When** người dùng bấm nút đóng hoặc nhấn Escape, **Then** họ trở về cùng tin nhắn và vị trí cuộn.
3. **Given** người dùng đã gửi ảnh bằng phiên bản hỗ trợ tính năng, **When** họ đóng rồi mở lại ứng dụng và quay về phiên chat, **Then** họ vẫn có thể bấm để xem ảnh đó. Agent đang chạy tiếp tục công việc khi ứng dụng đóng.
4. **Given** một ảnh trong lịch sử bị thiếu hoặc hỏng, **When** người dùng mở tin nhắn hoặc thử xem ảnh, **Then** ứng dụng hiển thị trạng thái ảnh không khả dụng và phần còn lại của cuộc hội thoại vẫn dùng được.

---

### User Story 2 - Kiểm tra ảnh trước khi gửi (Priority: P2)

Người dùng muốn bấm vào hình thu nhỏ trong ô soạn để kiểm tra ảnh vừa chọn hoặc dán trước khi gửi.

**Why this priority**: Người dùng có thể phát hiện mình đã đính kèm nhầm ảnh trước khi gửi cho agent.

**Independent Test**: Dán một ảnh vào bản nháp có văn bản, bấm ảnh để xem, đóng khung xem rồi dùng nút gỡ ảnh.

**Acceptance Scenarios**:

1. **Given** bản nháp có văn bản và một ảnh đính kèm, **When** người dùng bấm hình thu nhỏ rồi đóng khung xem, **Then** họ thấy đúng ảnh và quay lại bản nháp với nguyên văn bản và tệp đính kèm.
2. **Given** bản nháp có ảnh, **When** người dùng bấm nút gỡ ảnh, **Then** ảnh được gỡ khỏi bản nháp và khung xem vẫn đóng.

### Edge Cases

- Ảnh dọc rất cao, ảnh toàn cảnh và ảnh lớn hơn cửa sổ đều hiển thị trọn vẹn theo đúng tỷ lệ.
- Tin nhắn cũ chỉ còn thông tin đính kèm, hoặc có ảnh bị hỏng, hiển thị trạng thái ảnh không khả dụng. Các ảnh còn dùng được trong cùng tin nhắn vẫn mở riêng được.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Người dùng MUST có thể mở đúng ảnh bằng một lần bấm vào hình thu nhỏ của từng ảnh còn khả dụng trong tin nhắn đã gửi.
- **FR-002**: Khung xem MUST hiển thị toàn bộ ảnh trong vùng xem, giữ đúng tỷ lệ và cho phép đóng bằng nút đóng hoặc Escape. Khi đóng từ lịch sử chat, người dùng trở về cùng tin nhắn và vị trí cuộn.
- **FR-003**: Ảnh gửi từ phiên bản hỗ trợ tính năng MUST xem lại được khi người dùng mở lại phiên chat sau khi khởi động lại ứng dụng. Việc đóng ứng dụng khi đang xem ảnh MUST cho phép agent đang chạy tiếp tục công việc.
- **FR-004**: Ảnh thiếu dữ liệu hoặc bị hỏng MUST có trạng thái không khả dụng. Người dùng vẫn đọc được tin nhắn và xem được những ảnh còn khả dụng.
- **FR-005**: Bấm hình thu nhỏ trong ô soạn MUST mở đúng ảnh bằng cùng thao tác xem và đóng. Khi quay lại, văn bản và ảnh trong bản nháp vẫn còn. Nút gỡ ảnh MUST tiếp tục gỡ ảnh mà không mở khung xem.

### Key Entities *(include if feature involves data)*

- **Ảnh đính kèm**: Ảnh do người dùng chọn hoặc dán, thuộc một bản nháp hoặc tin nhắn đã gửi. Mỗi ảnh có thể được xem riêng khi dữ liệu ảnh còn khả dụng.
- **Tin nhắn chat**: Nội dung đã gửi trong một phiên, có thể chứa nhiều ảnh và được mở lại từ lịch sử.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong các ca nghiệm thu với ảnh đơn và nhiều ảnh, 100% ảnh khả dụng mở đúng bằng một lần bấm và hiển thị toàn bộ ảnh đúng tỷ lệ.
- **SC-002**: Trong các ca đóng bằng nút đóng và Escape, 100% lần thử quay lại đúng vị trí trong lịch sử hoặc đúng nội dung bản nháp.
- **SC-003**: Sau khi khởi động lại ứng dụng, 100% ảnh gửi trong phiên thử bằng bản hỗ trợ tính năng mở lại được. Ca thử với một agent đang chạy xác nhận công việc tiếp tục khi ứng dụng đóng.
- **SC-004**: Trong các ca thử ảnh thiếu hoặc hỏng, 100% ảnh lỗi có thông báo rõ ràng và người dùng vẫn xem được các ảnh khả dụng trong cùng tin nhắn.

## Assumptions

- Phạm vi gồm ảnh người dùng đính kèm hoặc dán vào ô soạn và ảnh đính kèm trong tin nhắn đã gửi. Các định dạng đã được luồng đính kèm hỗ trợ xác định phạm vi tương thích.
- Khung xem có kích thước vừa cửa sổ. Thu phóng thủ công, chỉnh sửa, tải xuống và mở ảnh do agent chèn từ liên kết nằm ngoài phạm vi.
- Việc xem lại ảnh cũ phụ thuộc vào dữ liệu còn sẵn trong lịch sử. Khôi phục dữ liệu ảnh đã mất nằm ngoài phạm vi.
