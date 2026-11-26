# Feature Specification: Highlight code trong Rich Conversation

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Tôi muốn code trong hiện trên rich conversation cũng được highlight kể cả code changes, và font của code cũng phải dùng theo code font size"

## User Scenarios & Testing

### User Story 1 — Đọc code và diff có tô màu cú pháp (P1)

Là người dùng Herdsman, tôi muốn nhìn rõ các thành phần cú pháp trong đoạn code và Code Changes để đọc câu trả lời và rà soát thay đổi nhanh hơn.

**Independent Test** — Mở một Rich Conversation có khối code ghi rõ ngôn ngữ và một mục Code Changes có dòng thêm, dòng xóa và dòng ngữ cảnh.

**Acceptance Scenarios**

1. Khi mở hội thoại chứa khối code thuộc ngôn ngữ được hỗ trợ, người dùng thấy màu cú pháp trong khối code ở cả giao diện sáng và tối.
2. Khi mở Code Changes cho tệp thuộc ngôn ngữ được hỗ trợ, người dùng thấy màu cú pháp trên các dòng code thêm, xóa và ngữ cảnh. Dấu `+` và `−` tiếp tục phân biệt dòng thêm và dòng xóa.
3. Khi câu trả lời đang được gửi, code xuất hiện theo tiến độ của câu trả lời. Khối code thuộc ngôn ngữ được hỗ trợ có màu cú pháp sau khi câu trả lời hoàn tất.

### User Story 2 — Đọc code theo cỡ chữ đã chọn (P2)

Là người dùng Herdsman, tôi muốn code trong Rich Conversation dùng cỡ chữ đã chọn trong Settings để đọc thoải mái khi chuyển giữa các loại nội dung code.

**Independent Test** — Mở hội thoại có code nội tuyến, khối code và Code Changes. Đổi **Code font size** sang 18 px, sau đó chọn **Reset**.

**Acceptance Scenarios**

1. Khi đổi **Code font size**, code nội tuyến, khối code và dòng code trong Code Changes đang hiển thị cập nhật ngay. Văn bản hội thoại thường giữ cỡ hiện tại.
2. Khi mở lại hội thoại, nội dung code dùng giá trị đã lưu ngay từ lần hiển thị đầu tiên. Khi chọn **Reset**, nội dung code trở về cỡ **Default** theo quy tắc chung của Herdsman.

### Edge Cases

- Khối code thiếu nhãn ngôn ngữ, tệp có ngôn ngữ chưa được hỗ trợ hoặc gặp lỗi tô màu vẫn hiện đầy đủ nội dung ở cỡ **Code font size**.
- Một khối code chỉ có một dòng vẫn dùng cỡ chữ code và được tô màu nếu ngôn ngữ được hỗ trợ.
- Hội thoại đã lưu và hội thoại mới áp dụng cùng quy tắc hiển thị.

## Requirements

### Functional Requirements

- **FR-001** Rich Conversation phải tô màu cú pháp cho khối code có ngôn ngữ được nhận diện và hỗ trợ trong câu trả lời đã hoàn tất.
- **FR-002** Code Changes trong Rich Conversation phải tô màu cú pháp theo ngôn ngữ của tệp trên các dòng thêm, xóa và ngữ cảnh. Các chỉ báo thêm và xóa phải dễ phân biệt bằng dấu dòng và màu trạng thái trong cả giao diện sáng và tối.
- **FR-003** Khi code đang được gửi hoặc không thể tô màu, Rich Conversation phải hiển thị nội dung code có sẵn, giữ nguyên ký tự, xuống dòng và thụt lề. Lỗi tô màu ở một khối phải cho phép phần còn lại của hội thoại tiếp tục hiển thị.
- **FR-004** Code nội tuyến, khối code và dòng code trong Code Changes phải dùng **Code font size** hiện hành, kể cả khi hiển thị dạng văn bản thuần. Thay đổi cỡ chữ phải áp dụng ngay cho nội dung đang mở và dùng giá trị đã lưu khi mở lại app. **Reset** phải áp dụng quy tắc **Default** hiện có. Văn bản hội thoại thường giữ cỡ hiện tại.
- **FR-005** Rich Conversation phải áp dụng cùng quy tắc tô màu và cỡ chữ khi hiển thị hội thoại đã lưu và hội thoại mới. Agent tiếp tục chạy khi app đóng và hội thoại được khôi phục khi mở lại.

## Success Criteria

### Measurable Outcomes

- **SC-001** Trong cả giao diện sáng và tối, một khối code được hỗ trợ và một diff có ba loại dòng đều hiển thị màu cú pháp. Người đọc nhận ra dòng thêm và dòng xóa qua dấu dòng khi xem ở thang xám.
- **SC-002** Khi chọn lần lượt 14 px và 18 px, cả ba vị trí code đang mở dùng đúng cỡ đã chọn ngay sau mỗi lần chỉnh. Sau khi mở lại app và sau **Reset**, cả ba vị trí lần lượt hiển thị theo giá trị đã lưu và quy tắc **Default**.
- **SC-003** Một khối code không nhận diện được ngôn ngữ và một diff của tệp không được hỗ trợ đều hiển thị đủ ký tự, xuống dòng và thụt lề của mẫu, ở cỡ chữ đã chọn.

## Assumptions

- Phạm vi tô màu cú pháp gồm khối code và nội dung code trong Code Changes. Code nội tuyến dùng **Code font size**.
- Tính năng dùng cài đặt chung được mô tả tại [Chỉnh cỡ chữ code trong Settings](../../appearance-shortcuts/036-code-font-settings/spec.md).
- Các khối Mermaid và biểu đồ tiếp tục được trình bày theo vai trò nội dung của chúng trong Rich Conversation.
