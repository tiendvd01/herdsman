# Feature Specification: Zoom Mermaid diagram trong rich conversation

**Feature Branch**: `018-mermaid-zoom`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "Triển khai tính năng zoom mermaid diagram ở trên rich conversation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem diagram lớn trong khung phóng to (Priority: P1)

Khi agent trả về một diagram mermaid lớn (sequence, flowchart nhiều node), diagram bị thu nhỏ vừa bề ngang cuộc hội thoại nên chữ khó đọc. Người dùng muốn mở diagram đó ở khung phóng to gần toàn màn hình để đọc rõ.

**Why this priority**: Đây là giá trị cốt lõi: đọc được diagram lớn. Chỉ riêng nó đã là MVP.

**Independent Test**: Mở một conversation có diagram mermaid lớn, bấm nút phóng to, kiểm tra diagram hiện trong khung lớn và đọc được chữ; đóng khung bằng nút đóng, phím Esc hoặc bấm ra ngoài.

**Acceptance Scenarios**:

1. **Given** một diagram mermaid đã render xong trong conversation, **When** người dùng bấm nút phóng to trên diagram, **Then** hiện khung phóng to che phần lớn cửa sổ, chứa diagram vừa khít khung.
2. **Given** khung phóng to đang mở, **When** người dùng nhấn Esc, bấm nút đóng hoặc bấm vùng nền bên ngoài, **Then** khung đóng và conversation giữ nguyên vị trí cuộn.
3. **Given** diagram chưa render hoặc render lỗi (đang hiện mã nguồn), **When** người dùng xem diagram, **Then** không có nút phóng to.

---

### User Story 2 - Zoom và kéo (pan) diagram trong khung phóng to (Priority: P2)

Người dùng muốn phóng to hơn nữa vào một vùng nhỏ của diagram và kéo để xem các phần khác.

**Why this priority**: Bổ trợ cho P1 với diagram rất lớn, nhưng P1 vẫn dùng được khi thiếu.

**Independent Test**: Trong khung phóng to, dùng nút +/−, cuộn chuột kèm Ctrl/Cmd hoặc pinch trackpad để đổi mức zoom, kéo chuột để di chuyển, bấm "Đặt lại" để về mức vừa khít.

**Acceptance Scenarios**:

1. **Given** khung phóng to đang mở, **When** người dùng bấm +, −, cuộn chuột hoặc pinch, **Then** diagram phóng to/thu nhỏ quanh vị trí con trỏ (hoặc tâm khung với nút), trong giới hạn tối thiểu và tối đa.
2. **Given** diagram đang được zoom, **When** người dùng kéo chuột, **Then** diagram di chuyển theo.
3. **Given** diagram đã zoom hoặc kéo, **When** người dùng bấm "Đặt lại", **Then** diagram trở về mức vừa khít khung.
4. **Given** khung phóng to hiển thị mức zoom, **When** mức zoom đổi, **Then** phần trăm zoom hiển thị cập nhật theo.

---

### User Story 3 - Đúng theme và nhiều diagram (Priority: P3)

Diagram trong khung phóng to phải cùng màu/theme với app, và mỗi diagram có thể phóng to độc lập.

**Why this priority**: Đảm bảo nhất quán, ít rủi ro hơn.

**Independent Test**: Đổi theme sáng/tối rồi mở khung phóng to; mở lần lượt hai diagram khác nhau trong cùng conversation.

**Acceptance Scenarios**:

1. **Given** theme hiện tại của app, **When** mở khung phóng to, **Then** diagram và nền khung dùng đúng màu theme.
2. **Given** conversation có nhiều diagram, **When** người dùng phóng to từng cái, **Then** mỗi lần chỉ hiện đúng diagram được chọn, mức zoom bắt đầu ở vừa khít.

### Edge Cases

- Diagram rất rộng hoặc rất cao (tỉ lệ khung hình cực đoan): vẫn vừa khít khung lúc mở, kéo được toàn bộ.
- Cửa sổ app đổi kích thước khi khung đang mở: diagram vẫn nằm trong khung, không vỡ bố cục.
- Conversation đang stream thêm nội dung khi khung mở: khung không bị đóng hay nhảy.
- Zoom chạm giới hạn tối thiểu/tối đa: nút +/− tương ứng bị vô hiệu, không lỗi.
- Đổi theme khi khung đang mở: diagram cập nhật theo theme mới.
- Người dùng chỉ dùng bàn phím: mở, đóng và zoom được bằng phím.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Mỗi diagram mermaid đã render thành công trong rich conversation MUST có nút phóng to rõ ràng, dễ thấy khi rê chuột hoặc focus.
- **FR-002**: Diagram chưa render hoặc render lỗi MUST NOT hiển thị nút phóng to; hành vi hiện có (hiện mã nguồn khi lỗi) giữ nguyên.
- **FR-003**: Bấm nút phóng to MUST mở khung phóng to che phần lớn cửa sổ, hiển thị diagram vừa khít khung.
- **FR-004**: Khung phóng to MUST đóng được bằng Esc, nút đóng và bấm nền bên ngoài; sau khi đóng, vị trí cuộn conversation MUST giữ nguyên.
- **FR-005**: Trong khung phóng to, người dùng MUST zoom được bằng nút +/−, cuộn chuột kèm Ctrl/Cmd và pinch trackpad, trong khoảng giới hạn tối thiểu và tối đa xác định.
- **FR-006**: Trong khung phóng to, người dùng MUST kéo (pan) được diagram bằng chuột/trackpad.
- **FR-007**: Khung phóng to MUST có nút "Đặt lại" đưa diagram về mức vừa khít, và MUST hiển thị mức zoom hiện tại dạng phần trăm.
- **FR-008**: Diagram trong khung phóng to MUST giữ nguyên nội dung và độ sắc nét khi zoom (không vỡ hình).
- **FR-009**: Khung phóng to MUST dùng màu theo theme hiện tại và cập nhật khi đổi theme.
- **FR-010**: Tính năng MUST dùng được bằng bàn phím (mở, đóng, zoom, đặt lại) và nút có nhãn truy cập (accessible label).
- **FR-011**: Mỗi lần mở khung MUST bắt đầu ở mức vừa khít, độc lập với lần mở trước.
- **FR-012**: Hành vi hiển thị diagram inline trong conversation (render lười, cache, lỗi) MUST không đổi khi chưa phóng to.

### Key Entities

- **Diagram mermaid**: khối mã mermaid trong tin nhắn, đã render thành hình; là đối tượng được phóng to.
- **Trạng thái xem phóng to**: mức zoom, vị trí kéo, đang mở/đóng; tạm thời, không lưu giữa các lần mở.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng mở khung phóng to một diagram trong 1 thao tác bấm, khung hiện trong dưới 0,5 giây.
- **SC-002**: Với diagram lớn (≥ 20 node), người dùng đọc được toàn bộ chữ trong khung phóng to mà không cần công cụ ngoài, ở mức zoom ≤ 200%.
- **SC-003**: 100% cách đóng (Esc, nút đóng, bấm nền) đưa người dùng về đúng vị trí cuộn cũ của conversation.
- **SC-004**: Zoom và kéo phản hồi mượt, không giật nhận thấy được trên diagram 50 node.
- **SC-005**: Toàn bộ thao tác (mở, đóng, zoom, đặt lại) thực hiện được chỉ bằng bàn phím.

## Assumptions

- Phạm vi chỉ gồm diagram mermaid trong rich conversation; hình ảnh, code block và nơi khác ngoài phạm vi.
- Zoom trong khoảng khoảng 25%–800% so với mức vừa khít (giá trị cụ thể quyết định ở bước plan).
- Không lưu mức zoom giữa các lần mở; không có chức năng xuất/tải diagram trong phiên bản này.
- Dùng lại bản render và theme có sẵn của diagram, không đổi cách render inline hiện tại.
- Ưu tiên desktop (chuột, trackpad, bàn phím); không có yêu cầu riêng cho cảm ứng.
