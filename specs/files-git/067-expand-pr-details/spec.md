# Feature Specification: Mở rộng trang chi tiết Pull Request

**Feature Branch**: `master`

**Created**: 2026-11-26

**Status**: Implemented

**Input**: User description: "Check giao diện chi tiết của 1 PRs herdr-app update lại trang xem chi tiết PRs của herdsman sao cho giống, xem đc comment review, xem đc pr description, xem được các bước của ci đến đâu luôn"

## User Scenarios & Testing *(mandatory)*

Trang chi tiết đã mở trong Herdr hiển thị thông tin PR và nhánh ở đầu, timeline `Progress` với các check có thể mở rộng, rồi các khối nội dung để đọc khi cuộn. Mod Herdr tóm tắt các thread review chưa giải quyết và trình bày mô tả có định dạng. Chi tiết Herdsman hiện hiển thị thông tin PR, nhánh và trạng thái tổng hợp. Đặc tả này áp dụng thứ tự đọc của Herdr trong bố cục Herdsman và đưa tiến độ từng bước vào luồng theo dõi PR đang mở.

### User Story 1 - Xem tiến độ CI theo từng bước (Priority: P1)

Là tác giả hoặc reviewer, tôi muốn biết workflow nào đang chạy và job đang ở bước nào để quyết định chờ tiếp hay xử lý lỗi.

**Why this priority**: Trạng thái CI tổng hợp chỉ cho biết tình hình chung. Tên bước đang chạy hoặc lỗi giúp tôi xác định việc cần làm ngay trong Herdsman.

**Independent Test**: Mở PR có hai workflow, hai job song song và một check ngoài GitHub Actions. Kiểm tra trạng thái trước và sau khi một bước hoàn thành, một bước lỗi và một workflow được chạy lại.

**Acceptance Scenarios**:

1. **Given** PR có CI, review và tình trạng nhánh đích đã xác định, **When** tôi mở chi tiết, **Then** timeline `Progress` cho thấy trạng thái PR, CI, review và nhánh đích theo thứ tự.
2. **Given** hai job đang chạy song song, **When** tôi mở rộng phần CI và từng job, **Then** tôi thấy workflow, job và các bước theo thứ tự nguồn, với bước đang chạy được đánh dấu riêng trong mỗi job. Vị trí bước được hiển thị khi nguồn cung cấp đủ thứ tự và số bước.
3. **Given** một bước thất bại hoặc một workflow được chạy lại trên cùng phiên bản PR, **When** tiến độ cập nhật, **Then** bước lỗi được nhận diện bằng tên, lần chạy hiện hành có trạng thái riêng và phần tôi đang đọc vẫn mở nếu còn thuộc lần chạy hiện hành.
4. **Given** một check chỉ công bố trạng thái tổng hợp, **When** tôi xem CI, **Then** tên và trạng thái của check vẫn xuất hiện, với liên kết đến lần chạy hoặc check gốc khi nguồn có cung cấp.

---

### User Story 2 - Đọc bình luận review theo thread (Priority: P1)

Là developer đang xử lý góp ý, tôi muốn đọc cả bình luận trong review và các phản hồi theo từng thread để hiểu yêu cầu trong đúng ngữ cảnh.

**Why this priority**: Đọc được nội dung và vị trí góp ý giảm số lần phải chuyển sang GitHub trong lúc xem PR.

**Independent Test**: Mở PR có một nhận xét cấp review, một thread chưa giải quyết có phản hồi và một thread đã giải quyết. Kiểm tra thứ tự, tác giả, thời điểm, vị trí và nội dung.

**Acceptance Scenarios**:

1. **Given** PR có nội dung nhận xét cấp review và thread trên dòng code, **When** tôi đến `Review Comments`, **Then** tôi phân biệt được hai loại, đọc được nội dung review có tác giả, thời điểm và kết quả review khi có, đồng thời thấy thread chưa giải quyết trước.
2. **Given** thread có nhiều phản hồi, **When** tôi mở rộng thread, **Then** tôi đọc được toàn bộ nội dung theo thứ tự thời gian, cùng tác giả, thời điểm, tên tệp và dòng liên quan nếu nguồn cung cấp.
3. **Given** có thread đã giải quyết hoặc vị trí dòng đã cũ, **When** tôi xem bình luận, **Then** trạng thái của từng thread được ghi rõ. Thread đã giải quyết có thể mở để đọc.

---

### User Story 3 - Đọc mô tả và quay lại đúng ngữ cảnh (Priority: P2)

Là reviewer, tôi muốn đọc mô tả PR ngay trong chi tiết, rồi quay lại vị trí đang xem trong màn PRs.

**Why this priority**: Mô tả cho tôi biết mục tiêu và cách kiểm tra thay đổi trước khi đọc góp ý hoặc mở GitHub.

**Independent Test**: Từ một hàng ngoài vùng nhìn ban đầu, mở PR có mô tả dài với heading, danh sách, code block và liên kết. Đọc hết mô tả bằng bàn phím rồi quay lại danh sách.

**Acceptance Scenarios**:

1. **Given** PR có mô tả Markdown, **When** tôi cuộn tới `Description`, **Then** heading, danh sách, code block và liên kết hợp lệ giữ định dạng và toàn bộ mô tả đọc được.
2. **Given** tôi đã mở chi tiết từ danh sách hoặc thông báo, **When** tôi chọn `Back to list`, **Then** Herdsman khôi phục ngữ cảnh tương ứng theo spec 066. `Open on GitHub` mở đúng PR.
3. **Given** tôi đang mở PR của project A, **When** tôi chuyển sang PR có cùng số ở project B hoặc đổi tài khoản, **Then** nội dung, bình luận và CI chỉ thuộc PR và tài khoản đích. Kết quả đến muộn của PR trước không xuất hiện ở chi tiết mới.
4. **Given** mô tả hoặc bình luận chứa mã nhúng hay liên kết không an toàn, **When** tôi đọc chi tiết, **Then** phần văn bản hợp lệ vẫn đọc được. Mã nhúng và liên kết không an toàn không thể thực thi từ trang chi tiết.

### Edge Cases

- Mô tả trống, chưa có bình luận review và chưa có CI có trạng thái trống riêng. Mỗi phần phân biệt đang tải, lỗi và bị giới hạn quyền với kết quả trống. Phần tải lỗi có cách thử lại hoặc mở nguồn khi có liên kết hợp lệ.
- Nếu CI mới xếp hàng hoặc chỉ có một phần dữ liệu, phần CI hiển thị những gì nguồn đã công bố và cho biết khi chưa có chi tiết từng bước. Bước bị bỏ qua, bị hủy, chưa chạy hoặc chưa rõ được phân biệt với bước đã đạt.
- Khi có commit mới, tiến độ của phiên bản đang được review phản ánh lần chạy tương ứng. Nếu nguồn chỉ trả dữ liệu của commit cũ, giao diện ghi rõ dữ liệu thuộc phiên bản trước và tách khỏi tiến độ hiện tại.
- Nếu mạng gián đoạn, phần dữ liệu đã tải của cùng PR và tài khoản được đánh dấu chưa cập nhật khi còn quyền hiển thị. Khi đổi tài khoản hoặc mất quyền, nội dung ngoài quyền biến mất, kể cả phần đang mở.
- Bình luận có thể thiếu tác giả hoặc vị trí dòng do dữ liệu nguồn thay đổi. Giao diện vẫn trình bày phần nội dung còn đọc được và ghi rõ trạng thái vị trí cũ nếu nguồn có thông tin.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Chi tiết PR MUST hiển thị tiêu đề, repository, số PR và nhánh ở đầu, theo sau là timeline `Progress`, `Review Comments` và `Description`. Timeline MUST giữ trạng thái PR, CI, review và nhánh đích. `Back to list`, `Open on GitHub` và sidebar project MUST tiếp tục hoạt động theo spec 066.
- **FR-002**: Phần CI MUST hiển thị trạng thái tổng hợp, danh sách check, và cho phép mở rộng các workflow và job có dữ liệu từng bước. Mỗi bước MUST có tên và trạng thái. Với mỗi job đang chạy, MUST chỉ rõ bước đang hoạt động và vị trí bước khi có đủ dữ liệu. Check ngoài GitHub Actions MUST hiển thị theo mức thông tin nguồn cung cấp, cùng liên kết gốc nếu có.
- **FR-003**: Tiến độ CI MUST tự cập nhật khi người dùng đang xem chi tiết. Giao diện MUST phân biệt lần chạy lại, job song song, phiên bản commit và các trạng thái được mô tả trong Edge Cases. Làm mới MUST giữ các mục đang mở nếu chúng còn hiệu lực và cho người dùng nhận biết dữ liệu cũ hoặc trạng thái lỗi.
- **FR-004**: `Review Comments` MUST hiện nội dung review có nhận xét và bình luận theo thread, ưu tiên thread chưa giải quyết. Người dùng MUST đọc được toàn bộ thread và phản hồi theo thứ tự thời gian, cùng tác giả, thời điểm, tệp, dòng và trạng thái giải quyết hoặc vị trí cũ khi nguồn có dữ liệu.
- **FR-005**: `Description` và nội dung review MUST có thể đọc đầy đủ trong Herdsman. Mô tả Markdown MUST giữ heading, danh sách, code block và liên kết hợp lệ. Nội dung từ nguồn MUST được hiển thị để đọc một cách an toàn. Mở liên kết MUST do người dùng chủ động thao tác.
- **FR-006**: Mô tả, bình luận review và CI MUST phản ánh đúng repository, số PR và tài khoản hiện tại, với trạng thái tải, trống, lỗi hoặc thiếu quyền riêng khi thích hợp. Dữ liệu đến muộn MUST không thay thế nội dung của PR mới chọn. Đổi tài khoản hoặc mất quyền MUST ẩn nội dung ngoài quyền truy cập.
- **FR-007**: Người dùng MUST mở rộng CI và thread, đọc nội dung và điều hướng bằng chuột hoặc bàn phím. Chữ và biểu tượng MUST đủ tương phản trong theme sáng và tối. Màu và biểu tượng MUST giúp nhận diện trạng thái, với nhãn chữ để vẫn hiểu được ở thang xám. Nhãn của Herdsman MUST dùng tiếng Anh và nội dung PR, bình luận dùng ngôn ngữ gốc.

### Key Entities *(include if feature involves data)*

- **Chi tiết pull request** — PR được định danh bằng repository và số PR, với nhánh, phiên bản commit đang review, mô tả và quyền của tài khoản hiện tại.
- **Review và thread** — Review có tác giả, thời điểm, kết quả và nhận xét. Thread nhóm bình luận và phản hồi với trạng thái giải quyết và vị trí tệp khi có.
- **Tiến độ CI** — Check, lần chạy workflow, job và bước liên quan tới phiên bản PR, với trạng thái và liên kết nguồn nếu có.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ít nhất 9/10 người dùng thử lần đầu tìm đúng bước đang chạy hoặc lỗi, một góp ý chưa giải quyết và phần mô tả trong vòng 60 giây sau khi chi tiết tải xong, ngay trong Herdsman.
- **SC-002**: Trong bộ thử có hai job song song, chạy lại workflow và commit mới, 100% trạng thái bước kiểm thử phản ánh đúng job, lần chạy và phiên bản PR. Khi nguồn hoạt động bình thường, tiến độ đang xem phản ánh thay đổi trong vòng 60 giây kể từ khi nguồn công bố.
- **SC-003**: Với PR có ít nhất 20 bình luận và phản hồi, 100% nội dung mà tài khoản được quyền đọc có thể truy cập trong đúng thread hoặc review, kể cả khi thread đã giải quyết.
- **SC-004**: Trong các lượt đổi giữa hai PR trùng số, đổi tài khoản và mất quyền truy cập, không có lượt nào hiển thị mô tả, bình luận hoặc tiến độ sai phạm vi.
- **SC-005**: Trong cả theme sáng và tối, người dùng hoàn tất luồng mở rộng CI, đọc thread và quay lại bằng bàn phím. Trong bài thử thang xám, mọi trạng thái CI trong bộ thử vẫn phân biệt được bằng nhãn chữ.

## Assumptions

- Nguồn tham chiếu là trang chi tiết của mod `pr-flow` trong bản herdr-app cài trên máy. Timeline và mô tả được kiểm tra trực tiếp. Hành vi thread review và job/step được đối chiếu qua mã của mod. Herdsman áp dụng cách tổ chức thông tin này trong màn PR của mình.
- Phạm vi là PR đang được theo dõi theo [spec 064](../064-track-pull-requests/spec.md), với điều hướng và bố cục theo [spec 066](../066-refine-pull-requests/spec.md). CI ở mức job và bước áp dụng cho GitHub Actions khi tài khoản được quyền đọc. Các nguồn CI khác được hỗ trợ ở mức check công bố.
- Tính năng chỉ đọc. Viết, trả lời hoặc giải quyết bình luận, xem diff và log CI trong app, chạy lại CI, merge và theo dõi workflow sau merge nằm ngoài phạm vi.
