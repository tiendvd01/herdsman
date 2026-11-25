# Feature Specification — Cửa sổ nổi xem output của tiến trình hc

**Feature Branch** `master` (nhánh hiện tại)

**Created** 2026-11-25

**Status** Draft

**Input** Người dùng muốn bấm vào lệnh dùng `hc` trong hội thoại để mở cửa sổ nổi xem output của tiến trình đó.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mở output từ thẻ lệnh (Priority: P1)

Khi Claude dùng `hc` để chạy test backend, developer bấm **Open Output** trên thẻ lệnh để mở cửa sổ nổi riêng. Cửa sổ hiển thị output và trạng thái của đúng lần chạy, kể cả khi lệnh khởi chạy nền đã trả về và Claude tiếp tục hội thoại.

**Why this priority**. Developer có thể theo dõi test trong Herdsman và vẫn đọc hoặc thao tác trong hội thoại.

**Independent Test**. Cho Claude chạy hai lệnh test nền cùng nội dung, mỗi lần in một dấu nhận diện riêng. Bấm **Open Output** trên từng thẻ và kiểm tra output, trạng thái và khả năng tiếp tục dùng hội thoại.

**Acceptance Scenarios**.

1. **Given** lệnh `hc run --bg` đã trả về và tiến trình vẫn chạy, **When** developer bấm **Open Output**, **Then** cửa sổ nổi hiện phần output có sẵn, nhận dòng mới và báo trạng thái của chính tiến trình test.
2. **Given** hai thẻ lệnh trỏ tới hai tiến trình khác nhau, **When** developer mở output từ từng thẻ, **Then** mỗi cửa sổ chỉ hiện output tương ứng, kể cả khi tên lệnh giống nhau. Bấm lại thẻ trỏ đến cửa sổ đang mở sẽ đưa cửa sổ đó lên trước.
3. **Given** một lệnh `hc run` đang chờ hoặc một lệnh `hc read`, `hc wait` hay `hc attach` đã xác định được terminal đích, **When** developer bấm **Open Output**, **Then** cửa sổ theo dõi terminal đích đó và giữ hội thoại có thể sử dụng.
4. **Given** lệnh yêu cầu Claude xin quyền hoặc chưa xác định được terminal đích, **When** developer xem thẻ, **Then** thẻ chỉ cho mở output khi đích đã được xác nhận. Việc mở cửa sổ xem không chạy lại lệnh gốc.

### User Story 2 - Quay lại output của lần chạy (Priority: P2)

Developer có thể đóng cửa sổ xem, chuyển phiên hoặc khởi động lại Herdsman rồi mở lại output của cùng tiến trình từ thẻ lệnh.

**Why this priority**. Test dài có thể tiếp tục trong lúc developer làm việc khác hoặc rời app.

**Independent Test**. Mở output, đóng cửa sổ trước khi lệnh in dòng thứ hai, rồi mở lại. Lặp lại bằng cách thoát app. Kiểm tra cả tiến trình đang chạy, đã kết thúc và terminal đã bị dọn.

**Acceptance Scenarios**.

1. **Given** cửa sổ đang hiển thị tiến trình còn chạy, **When** developer đóng cửa sổ hoặc thoát app, **Then** tiến trình tiếp tục theo vòng đời của nó. Khi mở lại từ thẻ, developer thấy cùng terminal và output còn khả dụng, gồm cả dòng đã in khi cửa sổ đóng.
2. **Given** tiến trình đã kết thúc và terminal còn lịch sử, **When** developer mở output, **Then** cửa sổ hiện output còn khả dụng và trạng thái kết thúc, gồm thành công hoặc thất bại khi có thông tin.
3. **Given** terminal gốc đã bị dọn và tên của nó được dùng cho tiến trình mới, **When** developer mở từ thẻ cũ, **Then** app thông báo output gốc không còn khả dụng và không hiện output của tiến trình mới.

### Edge Cases

- Nếu lệnh chứa nhiều đích chưa xác định được duy nhất, thẻ báo chưa thể xác định tiến trình. Nội dung trông giống địa chỉ terminal trong văn bản hội thoại hoặc output thường không tự tạo liên kết.
- Nếu mất kết nối trong lúc xem, cửa sổ giữ phần output đã hiện, báo mất kết nối và cập nhật lại khi kết nối với đúng terminal được khôi phục.
- Nếu terminal còn chạy nhưng chưa in dòng nào, cửa sổ báo đang chờ output. Nếu lịch sử chỉ còn một phần, cửa sổ báo giới hạn đó.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**. Herdsman MUST cung cấp thao tác **Open Output** ngay trên thẻ lệnh dùng `hc` khi có thể xác nhận đúng terminal đích. Áp dụng cho lệnh chạy trực tiếp, chạy nền và lệnh theo dõi một terminal cụ thể. Các lệnh cần duyệt vẫn theo cơ chế quyền của phiên.
- **FR-002**. Thao tác MUST mở một cửa sổ nổi riêng, có thể di chuyển, đổi kích thước và đóng, trong khi cửa sổ hội thoại vẫn sử dụng được. Trên macOS, cửa sổ MUST có thanh tiêu đề gốc và ba nút đỏ, vàng, xanh để đóng, thu nhỏ và phóng to. Mỗi terminal có tối đa một cửa sổ xem đang mở. Mở lại cùng terminal MUST đưa cửa sổ có sẵn lên trước.
- **FR-003**. Cửa sổ MUST hiển thị tên hoặc địa chỉ terminal, lịch sử output đang có, output mới trong lúc chạy và trạng thái tiến trình theo thông tin khả dụng. Nội dung output chỉ dùng để đọc. Việc mở, xem hay đóng cửa sổ MUST NOT gửi phím, chạy lại lệnh hoặc dừng tiến trình.
- **FR-004**. Sau khi chuyển phiên hoặc khởi động lại app, thao tác trên thẻ MUST mở lại đúng terminal gốc nếu terminal hoặc lịch sử vẫn còn. Tên trùng hoặc được tái sử dụng MUST NOT dẫn sang tiến trình khác.
- **FR-005**. Herdsman MUST hiển thị thông báo phù hợp khi chưa có output, lịch sử chỉ còn một phần, mất kết nối hoặc terminal gốc không còn khả dụng. Khi đọc được lại cùng terminal, cửa sổ MUST tiếp tục cập nhật.

### Key Entities *(include if feature involves data)*

- **Thẻ lệnh trong hội thoại**. Đại diện cho một lần Claude gọi lệnh và là điểm mở output của terminal đã xác nhận.
- **Terminal đích**. Terminal `hc` gắn với đúng lần chạy được theo dõi, có tên hoặc địa chỉ hiển thị, trạng thái và lịch sử còn khả dụng.
- **Cửa sổ xem output**. Cửa sổ nổi chỉ đọc của một terminal, có vòng đời riêng với tiến trình và hội thoại.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**. Trong 5 lần chạy thử cục bộ, developer mở đúng cửa sổ bằng một lần bấm từ thẻ đã có đích. Dòng test in sau khi cửa sổ đã mở xuất hiện trong vòng 2 giây trong ít nhất 4 lần.
- **SC-002**. Khi kiểm tra hai tiến trình cùng nội dung lệnh và một lần tái sử dụng tên sau khi terminal cũ bị dọn, không cửa sổ nào hiển thị output của tiến trình khác với thẻ đã chọn.
- **SC-003**. Trong hai lần thử, một lần đóng cửa sổ nổi và một lần thoát app, cả hai tiến trình vẫn chạy. Mở lại từ thẻ hiện dòng nhận diện đã in lúc cửa sổ đóng nếu lịch sử của terminal còn khả dụng.
- **SC-004**. Trong 3 lượt thử lần đầu, cả 3 developer tìm được dòng lỗi của test từ thẻ lệnh trong 15 giây mà vẫn giữ hội thoại mở.

## Assumptions

- Phạm vi là terminal `hc` cục bộ được xác nhận từ lệnh trong hội thoại Claude. Test backend là tình huống chính.
- Cửa sổ nổi là cửa sổ app riêng, mặc định có thể di chuyển và đổi kích thước. Việc nhập lệnh, gửi phím và điều khiển tiến trình nằm ngoài phạm vi.
- Output cũ phụ thuộc lịch sử terminal đang còn. Sau khi mở lại app, người dùng có thể bấm thẻ để mở lại cửa sổ và xem dữ liệu còn khả dụng.
