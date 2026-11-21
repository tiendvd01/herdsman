# Feature Specification: Resize ô chat ở chế độ mở rộng, chiều cao mặc định 300px

**Feature Branch**: `013-composer-expand-resize`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Khi mở chế độ mở rộng của chat, tôi muốn nó có thể resize được và default height khi hiện lên là 300px thôi"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mở rộng với chiều cao mặc định 300px (Priority: P1)

Hiện tại khi bấm nút mở rộng, ô chat cao lên khoảng 65% chiều cao cửa sổ, quá lớn và che nhiều hội thoại. Developer muốn khi mở rộng, vùng soạn thảo chỉ cao 300px, đủ để soạn prompt dài mà vẫn thấy hội thoại phía trên.

**Why this priority**: đây là thay đổi hành vi mặc định mà người dùng yêu cầu trực tiếp.

**Independent Test**: mở một session ở cửa sổ có chiều cao đủ lớn, bấm nút mở rộng → vùng soạn thảo cao 300px.

**Acceptance Scenarios**:

1. **Given** ô chat ở kích thước thường và chưa từng được resize, **When** bấm nút mở rộng, **Then** vùng soạn thảo cao 300px.
2. **Given** cửa sổ app thấp đến mức 300px vượt quá chiều cao cho phép, **When** bấm nút mở rộng, **Then** ô chat bị giới hạn theo chiều cao cho phép và thanh công cụ vẫn hiện đầy đủ.

---

### User Story 2 - Kéo để đổi chiều cao khi đang mở rộng (Priority: P1)

Tuỳ nội dung, developer muốn ô chat cao hơn hoặc thấp hơn 300px. Khi đang mở rộng, họ kéo một tay nắm resize ở cạnh trên của ô chat để đổi chiều cao.

**Why this priority**: nửa còn lại của yêu cầu: chế độ mở rộng phải resize được.

**Independent Test**: mở rộng ô chat → kéo cạnh trên lên/xuống → chiều cao đổi theo con trỏ trong giới hạn; nội dung giữ nguyên.

**Acceptance Scenarios**:

1. **Given** ô chat đang mở rộng, **When** rê chuột vào cạnh trên ô chat, **Then** con trỏ đổi thành dạng resize dọc và không hiện đường kẻ ngang.
2. **Given** ô chat đang mở rộng, **When** kéo tay nắm lên, **Then** ô chat cao thêm theo con trỏ; kéo xuống thì thấp đi.
3. **Given** đang kéo, **When** chiều cao chạm giới hạn tối thiểu hoặc tối đa, **Then** ô chat dừng ở giới hạn đó, không vượt.
4. **Given** ô chat ở kích thước thường (chưa mở rộng), **When** người dùng rê vào cạnh trên, **Then** không có tay nắm resize.
5. **Given** đang kéo hoặc sau khi kéo, **When** quan sát nội dung, **Then** chữ, ảnh đính kèm và vị trí con trỏ giữ nguyên.

---

### User Story 3 - Nhớ chiều cao đã chọn (Priority: P2)

Sau khi đã kéo về chiều cao ưa thích, mỗi lần mở rộng lại developer không muốn phải kéo lại từ 300px.

**Why this priority**: tiện lợi, nhưng chức năng cốt lõi vẫn dùng được nếu thiếu.

**Independent Test**: mở rộng, kéo lên 450px, thu nhỏ, mở rộng lại → cao 450px.

**Acceptance Scenarios**:

1. **Given** người dùng đã kéo ô chat tới một chiều cao, **When** thu nhỏ rồi mở rộng lại (kể cả ở session khác), **Then** ô chat mở rộng ở chiều cao đã chọn.
2. **Given** người dùng chưa từng resize, **When** mở rộng, **Then** chiều cao là 300px mặc định.

### Edge Cases

- Cửa sổ app bị thu thấp sau khi đã chọn chiều cao lớn: chiều cao hiệu lực bị giới hạn lại theo cửa sổ, thanh công cụ không bị đẩy ra ngoài màn hình; khi cửa sổ cao lại thì trở về chiều cao đã chọn.
- Kéo chuột ra ngoài cửa sổ khi đang kéo: việc kéo vẫn tiếp tục theo con trỏ và kết thúc khi nhả chuột.
- Ô chat bị vô hiệu: nút mở rộng vô hiệu như hiện tại nên không có resize.
- Esc, gửi tin, chuyển session: giữ hành vi của chức năng mở rộng hiện có (012).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Khi mở rộng lần đầu (chưa có chiều cao người dùng chọn), vùng soạn thảo MUST cao 300px, thay cho mức ~65% chiều cao cửa sổ hiện tại.
- **FR-002**: Khi đang mở rộng, ô chat MUST có tay nắm resize ở cạnh trên để kéo đổi chiều cao theo chiều dọc; ở kích thước thường MUST NOT có tay nắm.
- **FR-003**: Chiều cao khi kéo MUST bị giới hạn trong khoảng tối thiểu (đủ hiện vài dòng) và tối đa (theo chiều cao cửa sổ, không đẩy thanh công cụ ra khỏi màn hình).
- **FR-004**: Tay nắm MUST có con trỏ resize dọc để báo vùng kéo được; MUST NOT hiện đường kẻ ngang khi rê chuột hoặc khi kéo (khác tay nắm sidebar). Khi focus bằng bàn phím vẫn có chỉ báo focus.
- **FR-005**: Resize MUST giữ nguyên nội dung, ảnh đính kèm, vị trí con trỏ và focus trong ô chat.
- **FR-006**: Chiều cao người dùng đã kéo MUST được dùng lại cho các lần mở rộng sau, kể cả sau khi đóng và mở lại app; nếu chưa có thì dùng 300px.
- **FR-007**: Chiều cao hiệu lực MUST luôn được giới hạn lại theo kích thước cửa sổ hiện tại mà không làm mất giá trị người dùng đã chọn.
- **FR-008**: Mọi hành vi còn lại của chế độ mở rộng (nút bật/tắt, Esc, gửi tin, vô hiệu hoá, nhãn truy cập) MUST giữ nguyên như spec 012.

### Key Entities

- **Chiều cao mở rộng của ô chat**: số đo người dùng đã chọn khi kéo, dùng chung cho mọi session, mặc định 300px, luôn bị giới hạn bởi min/max theo cửa sổ.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Lần mở rộng đầu tiên, vùng soạn thảo cao đúng 300px (khi cửa sổ đủ cao).
- **SC-002**: Người dùng đổi được chiều cao ô chat chỉ bằng một thao tác kéo, phản hồi theo con trỏ không trễ cảm nhận được.
- **SC-003**: 100% lần kéo không làm mất ký tự hay ảnh đính kèm nào.
- **SC-004**: Ở mọi kích thước cửa sổ hỗ trợ, thanh công cụ ô chat luôn nhìn thấy được ở chế độ mở rộng.
- **SC-005**: Chiều cao đã chọn được giữ lại qua các lần mở rộng và qua việc khởi động lại app.

## Assumptions

- Tay nắm resize nằm ở cạnh trên ô chat vì ô chat neo ở đáy khung hội thoại; kéo lên là cao thêm.
- Chiều cao tối thiểu khoảng 120px; chiều cao tối đa khoảng 80% chiều cao cửa sổ (giá trị chính xác chốt ở bước plan).
- Chiều cao đã chọn lưu như một tuỳ chọn giao diện chung (không theo từng session), giống cách lưu độ rộng sidebar.
- Không thêm resize cho ô chat ở kích thước thường; chiều cao thường vẫn tự co giãn theo nội dung như hiện tại.
- Phạm vi chỉ gồm resize bằng chuột/chạm; hỗ trợ resize bằng bàn phím nằm ngoài phạm vi.
- Dựa trên chức năng mở rộng ô chat đã có ở spec 012-composer-expand.
