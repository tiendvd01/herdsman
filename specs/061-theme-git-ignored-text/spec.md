# Feature Specification — Theme Git-Ignored Text

**Feature Branch** — `master`

**Created** — 2026-11-25

**Status** — Ready for planning

**Input** — Tên file bị Git ignore khó phân biệt sau khi chuyển sang theme tối. Màu chữ cần thay đổi theo theme.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nhận ra file bị ignore khi đổi theme (Priority: P1)

Khi duyệt File Tree, tôi muốn nhìn ra file hoặc thư mục bị Git ignore trong cả theme sáng và tối, đồng thời vẫn đọc được tên mục.

**Why this priority** — Người dùng cần phân biệt nhanh mục bị ignore khi duyệt project, kể cả sau khi đổi giao diện.

**Independent Test** — Mở một thư mục chứa file và thư mục bị ignore cạnh các mục thường. Giữ cây đang mở và chuyển từ Light sang Dark rồi sang One Dark Pro.

**Acceptance Scenarios**

1. **Given** File Tree chứa file và thư mục bị ignore cùng các mục thường, **When** người dùng xem trong một theme tích hợp, **Then** tên mục bị ignore có sắc xám xanh theo theme, dễ phân biệt với mục thường và vẫn dễ đọc.
2. **Given** File Tree đang mở, **When** người dùng đổi theme, **Then** tên mục bị ignore cập nhật theo bảng màu mới ngay trong cây đang mở, với trạng thái mở rộng và mục đang chọn được giữ.
3. **Given** người dùng rê chuột hoặc chọn một mục bị ignore, **When** nền dòng đổi theo trạng thái tương tác, **Then** tên vẫn dễ đọc, vẫn phân biệt được với mục thường ở cùng trạng thái, và mục vẫn mở được theo thao tác hiện có.
4. **Given** người dùng mở kết quả tìm kiếm hoặc duyệt mục có trạng thái Git thông thường, **When** tên được hiển thị, **Then** kết quả tìm kiếm và dấu trạng thái Git giữ cách trình bày hiện có.

### Edge Cases

- Mục trong thư mục bị ignore được trình bày theo trạng thái Git của chính mục đó.
- Theme tùy chỉnh cũ chưa khai báo riêng màu tên mục bị ignore vẫn dùng được. Màu mặc định theo bảng màu hiện hành.
- Với repo không có mục bị ignore, cây hiển thị toàn bộ mục theo cách hiện có.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** File Tree phải dùng màu chữ dành cho mục bị Git ignore từ theme đang áp dụng, cho cả file và thư mục ở mọi cấp đang hiển thị.
- **FR-002** Khi đổi theme, cây đang mở phải cập nhật màu ngay mà không cần tải lại dự án hay đóng mở thư mục. Mục đã chọn và thư mục đã bung vẫn giữ trạng thái.
- **FR-003** Trong các theme tích hợp, tên mục bị ignore phải phân biệt rõ với tên mục thường ở cùng trạng thái và vẫn đọc được ở dòng thường, khi rê chuột và khi được chọn.
- **FR-004** Theme tùy chỉnh phải có thể chỉ định màu này. Theme chưa có màu riêng phải nhận màu mặc định phù hợp với bảng màu của theme.
- **FR-005** Giữ cách xác định Git ignore, khả năng mở mục, thông tin trợ năng về Git ignore, và cách trình bày kết quả tìm kiếm cùng trạng thái Git hiện có.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** Trong các theme sáng tích hợp, màu chữ đạt tối thiểu 4,5:1 với nền dòng. Các theme tối tích hợp dùng đúng màu xám xanh `#737994` lấy từ ảnh tham chiếu ở cả ba trạng thái.
- **SC-002** Sau mỗi lần đổi theme trong chuỗi Light → Dark → One Dark Pro → Light, 100% tên mục bị ignore trong cây mẫu dùng màu tương ứng với theme đang áp dụng và cây giữ mục đang chọn cùng các thư mục đang mở.
- **SC-003** Trong mỗi theme tích hợp, người kiểm tra xác định đúng cả bốn mục bị ignore trong một cây mẫu tám mục chỉ bằng cách nhìn tên. Tất cả tám tên vẫn đọc được.

## Assumptions

- Phạm vi là màu tên trong cây duyệt thư mục. Kết quả tìm kiếm giữ màu thông thường theo hành vi hiện tại.
- Màu tham chiếu tối được ưu tiên theo yêu cầu. Tiêu chí 4,5:1 áp dụng cho theme sáng. Theme tùy chỉnh có thể chỉ định màu riêng.
