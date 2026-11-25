# Feature Specification: Xem output shell của Claude khi lệnh đang chạy

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Tôi muốn triển khai tính năng lúc claude chạy shell lệnh test backend tôi có thể xem được output của shell đấy"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Theo dõi tiến độ test trong hội thoại (Priority: P1)

Khi Claude chạy test backend, developer mở thẻ lệnh trong hội thoại để đọc output ngay khi có và biết lệnh còn đang chạy hay đã kết thúc.

**Why this priority**: Developer có thể phát hiện lỗi sớm và theo dõi tiến độ trong lúc chờ test.

**Independent Test**: Yêu cầu Claude chạy một lệnh test ghi dòng tiến độ, chờ 10 giây, ghi một dòng lỗi rồi kết thúc với mã lỗi. Mở thẻ lệnh ngay khi lệnh chạy.

**Acceptance Scenarios**:

1. **Given** lệnh đang chạy và đã in một dòng tiến độ, **When** developer mở thẻ, **Then** dòng đã in xuất hiện cùng trạng thái đang chạy, và các dòng mới xuất hiện ngay trong thẻ đang mở.
2. **Given** test kết thúc với lỗi, **When** developer xem thẻ, **Then** thẻ hiển thị trạng thái thất bại và dòng lỗi từ lệnh. Với lệnh kết thúc thành công, thẻ hiển thị trạng thái thành công và output tương ứng.
3. **Given** hai lần chạy có cùng nội dung lệnh, **When** developer mở từng thẻ, **Then** mỗi thẻ chỉ hiển thị output và trạng thái của lần chạy tương ứng.
4. **Given** phiên yêu cầu duyệt lệnh, **When** developer chưa duyệt hoặc từ chối, **Then** lệnh chưa được chạy và thẻ không báo đang chạy.
5. **Given** lệnh in nhiều dòng có chứa dấu và cú pháp đánh dấu văn bản, **When** developer xem output, **Then** các dòng và ký tự hiển thị theo văn bản gốc.

### User Story 2 - Đọc lại output sau khi quay lại phiên (Priority: P2)

Developer có thể chuyển sang phiên khác hoặc đóng Herdsman trong lúc test chạy rồi quay lại đúng thẻ để tiếp tục theo dõi hoặc đọc kết quả.

**Why this priority**: Developer thường theo dõi nhiều phiên và cần đọc lại chi tiết lỗi sau khi test kết thúc.

**Independent Test**: Chạy test có dòng output nhận diện được trước, trong và sau khi đóng app. Mở lại app và kiểm tra đúng thẻ lệnh trong phiên Claude.

**Acceptance Scenarios**:

1. **Given** test tiếp tục chạy khi Herdsman đóng, **When** developer mở lại phiên trước lúc test kết thúc, **Then** thẻ hiển thị các dòng đã nhận, gồm cả dòng phát sinh khi app đóng, rồi tiếp tục cập nhật.
2. **Given** test đã kết thúc khi developer đang ở phiên khác hoặc app đã đóng, **When** developer quay lại thẻ, **Then** output đã ghi nhận và trạng thái kết thúc vẫn đọc được.

### Edge Cases

- Lệnh chưa in gì vẫn có trạng thái đang chạy. Lệnh đã kết thúc mà không in gì hiển thị trạng thái kết thúc và báo không có output.
- Nếu lệnh bị ngắt, thẻ báo đã bị ngắt và giữ phần output đã nhận. Nếu mất kết nối và chưa biết kết quả, thẻ báo chưa xác định được trạng thái và cập nhật khi có thông tin.
- Nếu output bị thiếu hoặc bị cắt, thẻ báo rõ và cho xem phần còn có. Lịch sử phiên cũ hiển thị phần kết quả sẵn có, nếu có.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Developer MUST có thể mở output của từng lệnh shell do Claude chạy trực tiếp từ thẻ lệnh trong hội thoại, cả khi đang chạy và sau khi kết thúc.
- **FR-002**: Herdsman MUST hiển thị output thường và output lỗi khi lệnh phát ra, giữ cách xuống dòng, bổ sung dòng mới tự động và gắn output với đúng lần chạy.
- **FR-003**: Thẻ MUST cho biết lệnh đang chạy, thành công, thất bại, bị ngắt hoặc chưa xác định được trạng thái, tùy thông tin hiện có. Thẻ MUST báo khi chưa có output, khi lệnh kết thúc không có output, hoặc khi chỉ có một phần output.
- **FR-004**: Herdsman MUST để lệnh và phiên tiếp tục khi người dùng đổi phiên hoặc đóng app. Khi người dùng quay lại, thẻ MUST cho xem output đã ghi nhận, kể cả lúc app đóng, cùng trạng thái hiện tại hoặc kết quả cuối. Với lịch sử cũ, thẻ MUST hiển thị kết quả sẵn có.
- **FR-005**: Việc xem output MUST tuân theo chế độ duyệt lệnh của phiên. Lệnh cần duyệt chỉ được chạy sau khi được cho phép. Output MUST được hiển thị như văn bản, kể cả khi chứa ký tự có thể được diễn giải thành nội dung tương tác.

### Key Entities *(include if feature involves data)*

- **Lần chạy lệnh shell**. Một lần Claude chạy một lệnh trong phiên, có trạng thái và output riêng.
- **Output của lệnh**. Văn bản tiến độ, kết quả hoặc lỗi gắn với lần chạy, có thể xuất hiện dần hoặc chỉ có một phần.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong 5 lần chạy thử cục bộ liên tiếp, với lệnh in một dòng rồi chờ 10 giây, dòng đó xuất hiện trong thẻ đang mở trong vòng 2 giây kể từ lúc lệnh in.
- **SC-002**: Với bộ kiểm tra gồm lệnh thành công, thất bại và bị ngắt, cả 3 lần chạy đều hiển thị đúng kết quả và giữ các dòng đã nhận. Hai lần chạy cùng lệnh với dòng nhận diện khác nhau hiển thị đúng dòng nhận diện ở từng thẻ.
- **SC-003**: Trong 2 lần kiểm tra đóng rồi mở lại Herdsman, một lần mở khi test còn chạy và một lần sau khi test kết thúc, test tiếp tục khi app đóng và người dùng thấy đủ các dòng nhận diện đã in trong lần chạy.
- **SC-004**: Trong 3 lượt kiểm tra thao tác lần đầu, cả 3 developer xác định được dòng báo lỗi của test từ hội thoại trong vòng 15 giây kể từ lúc mở phiên chứa lệnh đã chạy.

## Assumptions

- Phạm vi là lệnh shell do Claude chạy trong phiên Herdsman. Test backend là tình huống chính và dùng cùng cách xem output với các lệnh shell khác của Claude. Terminal tự mở, Codex và thao tác nhập liệu vào lệnh từ thẻ nằm ngoài phạm vi.
- Output có thể hiện ngay khi lệnh thực sự phát ra. Lệnh giữ output đến cuối sẽ chỉ có trạng thái đang chạy trong thời gian chờ. Việc phát lại dựa trên output mà phiên ghi nhận được.
