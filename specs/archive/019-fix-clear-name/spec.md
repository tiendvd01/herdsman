# Feature Specification for `/clear [name]`

**Feature Branch** — `master` (nhánh hiện tại)

**Created** — 2026-11-23

**Status** — Draft

**Input** — Sửa lỗi `/clear name` không nhận tham số `name`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bắt đầu hội thoại mới có tên (Priority: P1)

Khi đang chat với agent, người dùng có thể gõ `/clear Sửa bộ lọc` để bắt đầu hội thoại mới trong workspace hiện tại với tên “Sửa bộ lọc”.

**Why this priority** — Người dùng có thể đổi chủ đề và đặt tên để tìm lại hội thoại chỉ bằng một lệnh.

**Independent Test** — Từ một hội thoại đã có tin nhắn, gửi `/clear Sửa bộ lọc`, kiểm tra tên trong danh sách session và gửi tin nhắn đầu tiên.

**Acceptance Scenarios**

1. **Given** một hội thoại có lịch sử, **When** người dùng gửi `/clear Sửa bộ lọc`, **Then** Herdsman mở một hội thoại mới với tên “Sửa bộ lọc”, cùng workspace và cùng loại agent. Agent bắt đầu với ngữ cảnh hội thoại trống và người dùng vẫn có thể mở lại hội thoại cũ để đọc lịch sử.
2. **Given** hội thoại mới vừa được đặt tên bằng `/clear`, **When** người dùng gửi tin nhắn đầu tiên rồi đóng và mở lại Herdsman, **Then** tên đã đặt vẫn hiển thị và tin nhắn có trong lịch sử của hội thoại mới.
3. **Given** menu lệnh có mục `/clear`, **When** người dùng chọn mục đó, nhập tên và gửi, **Then** kết quả giống như gõ toàn bộ lệnh trực tiếp. Mục lệnh hiển thị gợi ý `[name]`.

---

### User Story 2 - Dùng `/clear` không kèm tên (Priority: P2)

Người dùng vẫn có thể bắt đầu hội thoại mới mà không cần đặt tên.

**Why this priority** — Cú pháp cũ vẫn dùng được và người dùng chỉ cần nhập tên khi có nhu cầu.

**Independent Test** — Gửi `/clear` và `/clear   ` từ các hội thoại có sẵn, rồi kiểm tra hội thoại mới và lịch sử cũ.

**Acceptance Scenarios**

1. **Given** một hội thoại có lịch sử, **When** người dùng gửi `/clear` hoặc chỉ thêm khoảng trắng sau lệnh, **Then** Herdsman mở hội thoại mới theo quy tắc đặt tên mặc định và giữ lịch sử cũ để xem lại.
2. **Given** một hội thoại đang mở, **When** người dùng gửi tin nhắn bắt đầu bằng `/clearance`, **Then** tin nhắn được gửi theo luồng chat thông thường và không tạo hội thoại mới.
3. **Given** Herdsman không thể bắt đầu hội thoại mới, **When** người dùng gửi `/clear` có hoặc không có tên, **Then** ứng dụng hiển thị lỗi, giữ hội thoại hiện tại và giữ nội dung lệnh để người dùng thử lại.

### Edge Cases

- Tên có Unicode và nhiều từ. Ví dụ `/clear   Tổng hợp lỗi   ` tạo hội thoại tên “Tổng hợp lỗi”.
- Nếu tên đã được dùng trong workspace, lệnh vẫn tạo hội thoại riêng. Các hội thoại cùng tên vẫn mở và xem lịch sử độc lập.
- Nếu agent đang chạy hoặc chờ duyệt quyền, lệnh vẫn tác động đến hội thoại mới. Lượt đang chạy và yêu cầu duyệt quyền vẫn thuộc hội thoại cũ.
- Nếu đóng Herdsman trong lúc xử lý lệnh, agent đang chạy tiếp tục độc lập. Khi mở lại, lịch sử cũ vẫn truy cập được và hội thoại mới đã tạo thành công xuất hiện dưới tên đã đặt.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Composer của Herdsman MUST nhận `/clear` và `/clear [name]` khi gửi từ hội thoại hiện tại. Chỉ từ lệnh chính xác `/clear` kích hoạt thao tác.
- **FR-002** — Lệnh MUST mở một hội thoại riêng cùng workspace và loại agent, với ngữ cảnh hội thoại trống. Toàn bộ lịch sử hội thoại cũ MUST vẫn truy cập được và các lượt đang chạy hoặc chờ duyệt MUST tiếp tục thuộc hội thoại cũ.
- **FR-003** — Toàn bộ phần văn bản sau `/clear` trên cùng dòng MUST được dùng làm tên, sau khi bỏ khoảng trắng ở hai đầu. Tên MUST hỗ trợ Unicode, nhiều từ và tên trùng. Khi thiếu tên hoặc tên chỉ có khoảng trắng, hội thoại mới MUST theo quy tắc đặt tên mặc định.
- **FR-004** — Tên do người dùng đặt MUST xuất hiện trong danh sách session ngay khi mở hội thoại mới và được giữ sau tin nhắn đầu tiên, khi đổi hội thoại và khi mở lại ứng dụng.
- **FR-005** — Mục `/clear` trong menu lệnh MUST hiển thị đối số tùy chọn `[name]` và cho phép người dùng nhập tên sau khi chọn lệnh.
- **FR-006** — Nếu thao tác thất bại, Herdsman MUST báo lỗi, giữ hội thoại hiện tại, giữ lịch sử và nội dung lệnh. Khi mở lại ứng dụng, mỗi lệnh đã hoàn tất MUST tương ứng với một hội thoại mới mang tên đã chọn hoặc tên mặc định.

### Key Entities *(include if feature involves data)*

- **Hội thoại (session)** — Phiên chat thuộc một workspace, có loại agent, lịch sử và tên hiển thị. `/clear` mở hội thoại riêng bên cạnh hội thoại hiện tại.
- **Tên hội thoại** — Nhãn hiển thị tùy chọn lấy từ đối số của `/clear`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Trên mỗi loại agent được Herdsman hỗ trợ, người dùng mở được hội thoại mới với đúng tên trong một lần gửi cho cả ba trường hợp tên một từ, nhiều từ và tiếng Việt có dấu.
- **SC-002** — Trong tất cả ca nghiệm thu thành công, người dùng vẫn mở và đọc được toàn bộ lịch sử cũ, hội thoại mới bắt đầu trống, và tên đã đặt vẫn hiển thị sau tin nhắn đầu tiên và sau khi mở lại Herdsman.
- **SC-003** — Cả hai dạng `/clear` và `/clear   ` đều mở hội thoại với quy tắc đặt tên mặc định trong một lần gửi. Tất cả ca kiểm tra lỗi giữ nguyên hội thoại hiện tại và nội dung lệnh để thử lại.

## Assumptions

- `name` là tên hiển thị của hội thoại mới. Dấu ngoặc vuông biểu thị đối số tùy chọn.
- Phạm vi là lệnh một dòng từ composer của Herdsman. Quy tắc đặt tên mặc định dựa vào luồng tạo session hiện có.
