# Feature Specification: Hiển thị % context đã dùng và giới hạn 5h / tuần

**Feature Branch**: `014-usage-limits-display`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Tôi muốn hiện thị số phần trăm context được sử dụng và limit 5h và limit week"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem % context đã dùng của session (Priority: P1)

Khi trò chuyện với agent, developer muốn biết cửa sổ context của session hiện tại đã đầy bao nhiêu phần trăm để biết khi nào nên mở session mới hoặc nén hội thoại, thay vì bị bất ngờ khi chất lượng trả lời giảm hoặc session bị cắt.

**Why this priority**: context đầy là rủi ro trực tiếp, ảnh hưởng từng session và là thông tin cần xem thường xuyên nhất.

**Independent Test**: mở một session có hội thoại, gửi vài tin nhắn → chỉ báo hiển thị % context và tăng dần theo hội thoại.

**Acceptance Scenarios**:

1. **Given** session đang mở và đã có phản hồi từ agent, **When** nhìn vào chỉ báo, **Then** thấy số phần trăm context đã dùng (0–100%) của chính session đó.
2. **Given** agent vừa trả lời xong một lượt, **When** lượt kết thúc, **Then** % context cập nhật theo mức mới mà không cần thao tác thêm.
3. **Given** developer chuyển sang session khác, **When** session đó được hiển thị, **Then** chỉ báo hiện % của session đó, không phải của session trước.
4. **Given** % context đạt mức cao (từ 80% trở lên), **When** hiển thị, **Then** chỉ số đổi sang màu cảnh báo; từ 95% trở lên dùng màu nguy hiểm.

---

### User Story 2 - Xem mức dùng giới hạn 5 giờ và giới hạn tuần (Priority: P1)

Developer dùng gói đăng ký có hạn mức theo cửa sổ 5 giờ và theo tuần. Họ muốn thấy đã dùng bao nhiêu phần trăm của mỗi hạn mức và khi nào hạn mức đặt lại, để chủ động sắp xếp công việc thay vì đột ngột bị chặn.

**Why this priority**: yêu cầu trực tiếp thứ hai; bị chặn giữa chừng gây gián đoạn lớn hơn bất kỳ vấn đề giao diện nào.

**Independent Test**: với tài khoản có hạn mức, mở app → thấy hai chỉ báo (5h, tuần) với % đã dùng và thời điểm đặt lại.

**Acceptance Scenarios**:

1. **Given** tài khoản có hạn mức 5h và tuần, **When** nhìn vào khu vực hiển thị, **Then** thấy % đã dùng của hạn mức 5h và của hạn mức tuần, mỗi cái có nhãn rõ ràng.
2. **Given** chỉ báo hạn mức, **When** rê chuột vào, **Then** thấy thời điểm hạn mức đặt lại (dạng còn lại bao lâu hoặc giờ cụ thể).
3. **Given** một hạn mức đạt từ 80% trở lên, **When** hiển thị, **Then** đổi sang màu cảnh báo; từ 95% trở lên dùng màu nguy hiểm.
4. **Given** agent vừa trả lời xong, **When** lượt kết thúc, **Then** % hạn mức được làm mới.
5. **Given** hạn mức là của tài khoản chứ không của session, **When** chuyển giữa các session, **Then** hai chỉ báo hạn mức giữ nguyên giá trị.

---

### User Story 3 - Trạng thái không có dữ liệu hiển thị rõ ràng (Priority: P2)

Không phải lúc nào cũng có số liệu (session mới chưa có phản hồi, engine không cung cấp, dùng API key không có hạn mức, mất kết nối). Developer muốn giao diện không hiện số sai hay gây hiểu nhầm.

**Why this priority**: bảo đảm độ tin cậy của thông tin, nhưng chỉ có ý nghĩa sau khi hai story trên chạy.

**Independent Test**: mở session mới chưa gửi gì, hoặc session dùng engine không có số liệu → chỉ báo hiện trạng thái trống thay vì số.

**Acceptance Scenarios**:

1. **Given** session mới chưa có phản hồi nào, **When** hiển thị, **Then** % context hiện trạng thái chưa có dữ liệu (ví dụ "—"), không hiện 0% giả.
2. **Given** tài khoản hoặc engine không cung cấp thông tin hạn mức, **When** hiển thị, **Then** hai chỉ báo hạn mức bị ẩn hoặc hiện "—" kèm giải thích khi rê chuột, không báo lỗi.
3. **Given** số liệu hạn mức đã cũ do không lấy được bản mới, **When** hiển thị, **Then** vẫn hiện giá trị gần nhất kèm dấu hiệu là có thể đã cũ.

---

### Edge Cases

- % vượt 100% hoặc là số lẻ: làm tròn về số nguyên và giới hạn hiển thị trong 0–100%.
- Hạn mức đã đặt lại trong lúc app mở: chỉ báo trở về mức mới khi có số liệu mới, không giữ mãi giá trị cũ sau thời điểm đặt lại.
- Nhiều session chạy song song: mỗi session có % context riêng; hạn mức dùng chung.
- Cửa sổ hẹp hoặc sidebar thu nhỏ: chỉ báo vẫn đọc được, có thể rút gọn nhưng không che hay làm vỡ giao diện hiện có.
- Nén hội thoại làm context giảm: % hạ xuống tương ứng.
- Hạn mức bị chặn hoàn toàn (100%): hiển thị rõ mức đầy và thời điểm đặt lại.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST hiển thị % context đã dùng của session đang xem, là số nguyên trong khoảng 0–100%.
- **FR-002**: Hệ thống MUST hiển thị % đã dùng của hạn mức 5 giờ và của hạn mức tuần, mỗi cái có nhãn phân biệt.
- **FR-003**: Hệ thống MUST cập nhật các chỉ báo sau mỗi lượt phản hồi của agent mà không cần người dùng thao tác.
- **FR-004**: % context MUST gắn với từng session; % hạn mức MUST gắn với tài khoản và dùng chung giữa các session.
- **FR-005**: Hệ thống MUST cho xem thời điểm đặt lại của mỗi hạn mức khi rê chuột vào chỉ báo.
- **FR-006**: Hệ thống MUST đổi màu chỉ báo theo ngưỡng: bình thường dưới 80%, cảnh báo từ 80%, nguy hiểm từ 95%.
- **FR-007**: Hệ thống MUST hiện trạng thái trống rõ ràng khi chưa có dữ liệu thay vì hiện số giả.
- **FR-008**: Hệ thống MUST ẩn hoặc làm mờ chỉ báo hạn mức, không báo lỗi, khi nguồn dữ liệu không cung cấp hạn mức.
- **FR-009**: Hệ thống MUST đánh dấu giá trị hạn mức có thể đã cũ khi không lấy được số liệu mới.
- **FR-010**: Các chỉ báo MUST nằm ở thanh công cụ của composer (ô soạn chat), nhỏ gọn, không che khu vực hội thoại hay ô soạn thảo.
- **FR-012**: Các chỉ báo MUST hiển thị dưới dạng chỉ số văn bản (ví dụ "ctx 42%", "5h 30%", "7d 12%"), KHÔNG dùng thanh tiến trình (progress bar).
- **FR-011**: Các chỉ báo MUST tuân theo giao diện sáng/tối hiện có và thang khoảng cách chung của app.

### Key Entities

- **Mức dùng context**: số phần trăm cửa sổ context của một session đã được dùng; thuộc về một session, đổi theo từng lượt hội thoại.
- **Hạn mức sử dụng**: hai hạn mức của tài khoản (5 giờ và tuần), mỗi hạn mức có % đã dùng và thời điểm đặt lại; dùng chung toàn app.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer đọc được % context của session hiện tại chỉ trong một cái nhìn, không cần mở menu hay trang riêng.
- **SC-002**: Sau mỗi lượt trả lời của agent, các chỉ báo phản ánh số liệu mới trong vòng 5 giây.
- **SC-003**: Người dùng có thể nói đúng mình đã dùng khoảng bao nhiêu % hạn mức 5h và tuần, và khi nào đặt lại, mà không cần rời app.
- **SC-004**: 100% trường hợp thiếu dữ liệu hiển thị trạng thái trống hoặc ẩn, không có trường hợp nào hiện số sai hay thông báo lỗi.
- **SC-005**: Thêm chỉ báo không làm mất hay che bất kỳ thành phần giao diện hiện có ở cửa sổ kích thước tối thiểu của app.

## Assumptions

- Người dùng chủ yếu dùng engine Claude với tài khoản đăng ký có hạn mức 5h và tuần; engine hoặc tài khoản không có hạn mức thì chỉ báo hạn mức bị ẩn.
- "Context" là cửa sổ context của chính session đang xem, không phải tổng token đã dùng của toàn tài khoản.
- Số liệu lấy từ thông tin mà engine đã trả về trong quá trình trò chuyện; không yêu cầu người dùng nhập thêm khóa hay cấp quyền mới.
- Cập nhật theo từng lượt phản hồi là đủ; không cần làm mới theo thời gian thực khi app ở trạng thái rảnh.
- Ngưỡng cảnh báo 80% và nguy hiểm 95% là mặc định hợp lý; chưa cần cho người dùng cấu hình.
- Vị trí hiển thị là thanh công cụ của composer; hiển thị bằng chỉ số văn bản, không có progress bar.
- Chỉ hiển thị thông tin; không tự động chặn, nén hội thoại hay đổi model khi gần đầy.
