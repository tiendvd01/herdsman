# Feature Specification: Đổi model ngay trong khung chat

**Feature Branch**: `005-chat-model-switcher`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Làm chức năng đổi model ở trong khung chat" (kèm ảnh thanh công cụ của khung chat: nút đính kèm, nút `/`, và menu chế độ quyền "Ask before editing").

## Bối cảnh

Thanh công cụ dưới khung chat (composer) hiện có: đính kèm ảnh, slash command, và menu chế độ quyền ("Ask before editing" / "Auto-accept edits" / "Bypass all approvals"). Model của session chỉ hiện dạng nhãn chỉ đọc trên header (ví dụ "Opus 5.5"); developer không có cách nào đổi model từ app mà phải bỏ sang terminal. Trong khi đó developer thường muốn đổi model giữa chừng: dùng model mạnh cho việc khó, chuyển sang model nhanh/rẻ cho việc lặt vặt. Spec này thêm menu chọn model đặt cạnh menu chế độ quyền trong khung chat, áp dụng cho session đang mở.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đổi model cho session đang mở (Priority: P1)

Developer đang chat với agent trên model mạnh, giờ cần làm mấy việc đơn giản. Developer bấm vào nút model trên thanh công cụ của khung chat, thấy danh sách model mà engine của session hỗ trợ, chọn một model khác. Nút model và nhãn model trên header đổi ngay, và tin nhắn tiếp theo được agent xử lý bằng model mới.

**Why this priority**: Đây là toàn bộ giá trị cốt lõi của tính năng; các story sau chỉ làm nó an toàn và rõ ràng hơn.

**Independent Test**: Mở một session Claude đang idle, đổi model từ menu, gửi một tin nhắn → nhãn model ở khung chat và header hiện model mới, và lượt trả lời đó do model mới thực hiện (kiểm tra được qua thông tin model engine báo về).

**Acceptance Scenarios**:

1. **Given** một session đang mở, **When** developer nhìn thanh công cụ khung chat, **Then** thấy nút hiện tên model hiện tại dạng dễ đọc (ví dụ "Opus 5.5"), nằm cạnh menu chế độ quyền.
2. **Given** developer bấm nút model, **When** menu mở ra, **Then** menu liệt kê các model engine của session hỗ trợ, mỗi mục có tên dễ đọc và một dòng mô tả ngắn (nếu engine cung cấp), model đang dùng có dấu tích.
3. **Given** menu model đang mở, **When** developer chọn model khác, **Then** menu đóng, nút model và nhãn trên header đổi sang model mới mà không cần tải lại hay mở lại session.
4. **Given** đã đổi model, **When** developer gửi tin nhắn tiếp theo, **Then** agent xử lý tin nhắn đó bằng model mới; lịch sử hội thoại trước đó giữ nguyên.
5. **Given** menu đang mở, **When** developer nhấn Esc hoặc bấm ra ngoài, **Then** menu đóng và model không đổi.

---

### User Story 2 - Đổi model khi agent đang chạy (Priority: P2)

Agent đang làm dở một lượt dài, developer quyết định các lượt sau dùng model khác. Developer đổi model ngay lúc đó mà không phải interrupt.

**Why this priority**: Developer hay nhận ra cần đổi model đúng lúc agent đang chạy; bắt chờ hoặc interrupt làm mất thời gian, nhưng thiếu story này tính năng vẫn dùng được.

**Independent Test**: Gửi một yêu cầu dài, trong lúc agent đang working đổi model → lượt đang chạy không bị ngắt hay hỏng, lượt kế tiếp dùng model mới.

**Acceptance Scenarios**:

1. **Given** session đang ở trạng thái working, **When** developer đổi model, **Then** lượt đang chạy tiếp tục bình thường, không bị ngắt.
2. **Given** đã đổi model trong lúc working, **When** lượt hiện tại kết thúc và developer gửi tin tiếp, **Then** lượt mới dùng model vừa chọn.
3. **Given** session đang blocked chờ duyệt quyền, **When** developer đổi model, **Then** yêu cầu quyền đang chờ vẫn còn nguyên và duyệt được như bình thường.

---

### User Story 3 - Model đã chọn được giữ lại (Priority: P3)

Developer đổi model cho một session, sau đó tắt app hoặc chuyển sang workspace khác rồi quay lại. Session vẫn dùng model đã chọn.

**Why this priority**: Đảm bảo lựa chọn không âm thầm bị mất; phù hợp nguyên tắc agent sống độc lập với app.

**Independent Test**: Đổi model, tắt app, mở lại, vào session đó → nút model hiện model đã chọn và lượt tiếp theo dùng đúng model đó.

**Acceptance Scenarios**:

1. **Given** đã đổi model cho session A, **When** developer chuyển sang session B rồi quay lại A, **Then** A vẫn hiện và dùng model đã chọn; B không bị ảnh hưởng.
2. **Given** đã đổi model, **When** app tắt rồi mở lại (agent vẫn chạy trong lúc đó), **Then** session hiện đúng model đã chọn và agent vẫn dùng model đó.
3. **Given** session được resume sau khi agent dừng, **When** developer gửi tin, **Then** agent dùng model đã chọn gần nhất của session đó.

---

### Edge Cases

- **Engine không hỗ trợ đổi model**, hoặc agent đang chạy từ bản app cũ chưa biết lệnh đổi model: nút model hiện tên model hiện tại ở dạng vô hiệu, có tooltip giải thích (với agent cũ: khởi động lại session để dùng được).
- **Chưa biết model hiện tại** (session vừa tạo, engine chưa báo model): nút hiện "Default" cho tới khi engine báo model thật.
- **Không lấy được danh sách model** (agent chưa sẵn sàng, lỗi kết nối): menu hiện trạng thái đang tải rồi thông báo lỗi ngắn kèm cách thử lại; model hiện tại không đổi.
- **Đổi model thất bại** (agent từ chối hoặc mất kết nối): nút model giữ hoặc quay về model cũ và hiện thông báo lỗi; không hiện model mới khi chưa thực sự áp dụng.
- **Model đang dùng không có trong danh sách** (đặt bằng tên đầy đủ hoặc model cũ): vẫn hiện trong menu với dấu tích để developer biết model hiện tại.
- **Session đã kết thúc / đang khởi động lại**: nút model vô hiệu như các điều khiển khác của khung chat ở trạng thái đó.
- **Chọn lại đúng model đang dùng**: không làm gì, không gửi lệnh đổi.
- **Tên model dài hoặc khung chat hẹp**: nút model rút gọn tên, không đẩy nút gửi hay menu chế độ quyền ra khỏi khung.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Thanh công cụ khung chat MUST có một điều khiển chọn model cho session đang mở, đặt cạnh menu chế độ quyền, cùng kiểu dáng với menu đó.
- **FR-002**: Điều khiển MUST hiện tên dễ đọc của model đang dùng (ví dụ "claude-opus-5-5" → "Opus 5.5"); tên không nhận dạng được hiện nguyên văn.
- **FR-003**: Menu MUST liệt kê các model mà engine của session báo là hỗ trợ, kèm mô tả ngắn khi engine có cung cấp, và đánh dấu model đang dùng.
- **FR-004**: Khi developer chọn model khác, hệ thống MUST yêu cầu agent của session chuyển sang model đó và MUST chỉ hiện model mới sau khi agent xác nhận đã áp dụng.
- **FR-005**: Đổi model MUST áp dụng cho lượt tiếp theo trở đi; MUST NOT ngắt lượt đang chạy, MUST NOT huỷ yêu cầu quyền đang chờ, MUST NOT làm mất hay sửa lịch sử hội thoại.
- **FR-006**: Đổi model MUST chỉ ảnh hưởng tới session đang mở; các session khác (kể cả cùng workspace) giữ model của mình.
- **FR-007**: Model đã chọn MUST được lưu theo session, giữ qua chuyển session, tắt/mở app và resume session.
- **FR-008**: Nhãn model trên header của workspace MUST luôn khớp với model hiện tại của session đang mở.
- **FR-009**: Khi đổi model thất bại, hệ thống MUST giữ model cũ và hiện thông báo lỗi dễ hiểu.
- **FR-010**: Với engine không hỗ trợ đổi model, điều khiển MUST ở trạng thái vô hiệu và có giải thích ngắn.
- **FR-011**: Điều khiển MUST dùng được hoàn toàn bằng bàn phím (mở, di chuyển, chọn, đóng bằng Esc) và có nhãn trợ năng nêu model hiện tại.
- **FR-012**: Việc đổi model MUST được ghi vào lịch sử sự kiện của session để có thể biết từ lượt nào model đã đổi.

### Key Entities

- **Session**: đã có; thuộc tính model là model hiện tại của session, giờ người dùng đổi được và được lưu bền.
- **Model khả dụng**: một lựa chọn engine báo là hỗ trợ — mã model, tên hiển thị, mô tả ngắn (tuỳ chọn). Danh sách thuộc về engine của session, không do app tự định nghĩa.
- **Sự kiện đổi model**: mục trong lịch sử sự kiện của session ghi model cũ, model mới và thời điểm đổi.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer đổi model cho session đang mở trong không quá 2 thao tác (mở menu, chọn) và dưới 5 giây, không rời khung chat.
- **SC-002**: Sau khi chọn, nhãn model ở khung chat và header cập nhật trong vòng 1 giây.
- **SC-003**: 100% lượt gửi sau khi đổi model thành công được xử lý bằng model mới (kiểm tra qua model engine báo về cho lượt đó).
- **SC-004**: Đổi model trong lúc agent đang chạy không làm ngắt hay lỗi lượt đang chạy trong 100% lần thử.
- **SC-005**: Sau khi tắt app và mở lại, 100% session hiện đúng model đã chọn trước đó.
- **SC-006**: Developer không còn phải rời app (sang terminal) để đổi model cho session do Herdsman quản lý.

## Assumptions

- Lựa chọn model là **theo từng session**; tính năng này không đặt model mặc định cho session mới (session mới vẫn dùng model mặc định của engine). Đặt model mặc định theo project/workspace để làm sau nếu cần.
- Danh sách model lấy từ engine của session (engine tự báo model hỗ trợ), không hard-code trong app; nhờ vậy model mới xuất hiện mà không cần sửa app.
- Không có bước xác nhận khi đổi model (khác "Bypass all approvals"), vì đổi model không nới quyền của agent.
- Hạ tầng phía agent đã có lệnh đổi model và đã lưu model của session; phần thiếu chủ yếu là điều khiển trên UI, đường lệnh từ app tới agent, và danh sách model khả dụng.
- Phạm vi v1 gồm engine Claude; engine Codex làm theo cùng hành vi khi engine đó được hỗ trợ. Engine giả lập "Echo" có danh sách model giả lập để demo và test tính năng mà không tốn API.
- Không thuộc phạm vi: chọn mức suy nghĩ (thinking/effort), hiện chi phí theo model, đổi model cho nhiều session cùng lúc.
