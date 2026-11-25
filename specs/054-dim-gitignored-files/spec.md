# Feature Specification: Làm mờ tệp bị Git bỏ qua trong cây tệp

**Feature Branch**: `master` (nhánh hiện tại)  
**Created**: 2026-11-25  
**Status**: Draft  
**Input**: Thêm chức năng đánh mờ các file bị gitignore trong file tree.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nhận biết mục bị Git bỏ qua (Priority: P1)

Là developer đang duyệt cây tệp, tôi muốn nhìn ra ngay các mục bị Git bỏ qua để tập trung vào những tệp liên quan đến công việc của mình và vẫn mở được tệp cục bộ khi cần.

**Why this priority** — Người dùng có thể phân biệt các mục ngay trong lúc duyệt cây.

**Independent Test** — Mở một dự án có tệp đang được theo dõi, tệp chưa được theo dõi, tệp bị bỏ qua và thư mục bị bỏ qua. Kiểm tra cách hiển thị và thao tác ở cả giao diện sáng và tối.

**Acceptance Scenarios**

1. **Given** cây có tệp bị Git bỏ qua, tệp chưa được theo dõi nhưng không bị bỏ qua và tệp đang được theo dõi, **When** người dùng mở cây, **Then** chỉ tệp bị bỏ qua được làm mờ. Tệp đang được theo dõi giữ chỉ báo Git hiện có, kể cả khi tên của nó khớp một quy tắc bỏ qua.
2. **Given** một thư mục và các mục bên trong bị Git bỏ qua, **When** người dùng mở rộng thư mục bằng chuột hoặc bàn phím, **Then** thư mục và các mục con bị bỏ qua đều hiển thị mờ. Người dùng vẫn đọc được tên, nhận biết mục đang được chọn và mở được tệp.
3. **Given** một quy tắc trong thư mục lồng nhau bỏ qua một nhóm tệp và có ngoại lệ cho một tệp, **When** người dùng mở thư mục, **Then** mức độ nổi bật của từng tệp phản ánh kết quả bỏ qua thực tế của Git.
4. **Given** người dùng vừa thay đổi quy tắc bỏ qua, **When** người dùng mở lại cây tệp để xem dữ liệu mới, **Then** các mục liên quan được làm mờ hoặc trở về cách hiển thị thông thường theo quy tắc mới.
5. **Given** cây tệp thuộc một dự án không dùng Git hoặc trạng thái bỏ qua tạm thời không xác định được, **When** người dùng duyệt cây, **Then** các mục chưa xác định vẫn hiển thị bình thường và có thể thao tác.

### Edge Cases

- Quy tắc lồng nhau, ngoại lệ và tệp đang được theo dõi có thể cho kết quả khác với việc chỉ so tên tệp với mẫu trong `.gitignore`.
- Khi chuyển dự án, cùng một đường dẫn tương đối có thể được Git phân loại khác nhau. Cây hiển thị theo dự án đang mở.
- Tên dài hoặc đang bị cắt ngắn vẫn theo cách trình bày hiện có. Trạng thái chọn và tiêu điểm phải dễ nhận biết trên cả hai giao diện.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Cây tệp phải làm mờ tên các tệp và thư mục đang hiển thị mà Git xác định là bị bỏ qua trong repository của cây, bao gồm các quy tắc `.gitignore` lồng nhau và ngoại lệ. Các mục còn lại giữ chỉ báo Git và cách hiển thị hiện có.
- **FR-002** — Tệp và thư mục bị làm mờ phải vẫn xuất hiện và hỗ trợ các thao tác hiện có, gồm mở tệp, mở rộng thư mục và điều hướng bằng bàn phím. Tên, trạng thái chọn và tiêu điểm phải dễ nhận biết trong giao diện sáng và tối.
- **FR-003** — Trạng thái làm mờ phải phản ánh quy tắc hiện hành khi người dùng mở lại cây tệp và phải tương ứng với dự án đang mở.
- **FR-004** — Khi cây nằm ngoài repository Git hoặc chưa xác định được trạng thái bỏ qua của một mục, mục đó phải giữ cách hiển thị và thao tác thông thường.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Trên bộ kiểm tra gồm ít nhất sáu trường hợp (tệp bị bỏ qua, thư mục bị bỏ qua, mục con bị bỏ qua, tệp chưa được theo dõi, ngoại lệ lồng nhau và tệp đang được theo dõi khớp mẫu bỏ qua), 100% mục hiển thị đúng trạng thái trong cả giao diện sáng và tối.
- **SC-002** — Trong mỗi giao diện, người kiểm thử nhận ra một mục bị bỏ qua giữa ít nhất ba mục cùng cấp trong vòng 5 giây kể từ khi các dòng hiển thị, sau đó mở được mục bằng bàn phím ngay lần thử đầu tiên.
- **SC-003** — Sau lần mở lại cây đầu tiên, cả trường hợp thêm và gỡ quy tắc bỏ qua đều hiển thị đúng trạng thái mới.

## Assumptions

- “Đánh mờ” nghĩa là giảm độ nổi bật của tên mục nhưng vẫn đọc được. Thư mục bị Git bỏ qua áp dụng cùng cách hiển thị với tệp.
- Phạm vi là chế độ duyệt cây tệp. Kết quả tìm kiếm và danh sách thay đổi Git giữ cách hiển thị hiện có.
- Quy tắc bỏ qua của repository là nguồn xác định trạng thái. Thời điểm cập nhật được bảo đảm là khi người dùng mở lại cây tệp để xem dữ liệu mới.
