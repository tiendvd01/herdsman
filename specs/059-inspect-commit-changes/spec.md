# Feature Specification — Inspect Commit Changes

**Feature Branch** — `master`

**Created** — 2026-11-25

**Status** — Ready for planning

**Input** — “Ấn vào 1 row commit thì hiện ra như thế này, xem changes file thì mở tab mới như ở git” cùng ảnh tham chiếu.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem các file thay đổi ngay trong Git Graph (Priority: P1)

Khi xem lịch sử workspace, tôi muốn bấm vào một commit để thấy ngay các file commit đó đã thay đổi.

**Why this priority** — Người dùng có thể xác định phạm vi thay đổi mà vẫn thấy commit trong lịch sử.

**Independent Test** — Mở Git Graph của workspace có commit thay đổi nhiều file rồi chọn và thu gọn commit.

**Acceptance Scenarios**

1. **Given** một commit sửa, thêm và xóa file, **When** người dùng chọn dòng commit bằng chuột hoặc bàn phím, **Then** danh sách file xuất hiện ngay dưới dòng đó, lùi vào bên trong đồ thị, với biểu tượng file, tên, thư mục tương đối và trạng thái ở cuối mỗi dòng.
2. **Given** một commit đang mở rộng, **When** người dùng chọn lại dòng commit hoặc chọn một commit khác, **Then** danh sách hiện tại thu gọn. Commit mới được chọn sẽ mở danh sách của nó.
3. **Given** đồ thị có nhiều luồng, **When** một commit mở rộng, **Then** các đường đi qua vị trí đó tiếp tục xuyên qua phần danh sách, giữ màu và kết nối đúng với các dòng commit.

### User Story 2 - Mở diff của file trong tab riêng (Priority: P2)

Khi đã thấy danh sách file trong commit, tôi muốn chọn một file để xem nội dung đã đổi trong tab diff của workspace, giống cách mở file từ mục Changes.

**Why this priority** — Người dùng có thể kiểm tra nội dung chính xác của commit và tiếp tục duyệt lịch sử trong khi tab diff đang mở.

**Independent Test** — Chọn cùng một đường dẫn từ hai commit khác nhau và từ mục Changes, sau đó đối chiếu ba tab.

**Acceptance Scenarios**

1. **Given** danh sách file của một commit đã mở, **When** người dùng chọn một file, **Then** một tab diff mới được mở và kích hoạt trong vùng làm việc, hiển thị thay đổi đã lưu của file trong commit. Danh sách trong Git Graph vẫn mở.
2. **Given** tab diff của file trong commit đã mở, **When** người dùng chọn lại file đó trong cùng commit, **Then** tab đó được kích hoạt. Chọn cùng đường dẫn ở commit khác hoặc trong mục Changes mở tab tương ứng riêng.
3. **Given** workspace có thay đổi chưa commit, **When** người dùng mở diff lịch sử, **Then** diff vẫn hiển thị đúng thay đổi đã lưu và chỉ cho phép xem.

### Edge Cases

- Commit đầu tiên so với cây file rỗng. Commit merge so với parent thứ nhất.
- File đổi tên hiển thị trạng thái đổi tên và cho phép xem đường dẫn cũ. File thêm, xóa và file nhị phân mở được trong tab diff với cách hiển thị tương ứng.
- Commit rỗng hiển thị trạng thái không có file thay đổi. Khi đang tải hoặc đọc lịch sử thất bại, trạng thái nằm dưới commit và cho phép thu gọn. Người dùng có thể chọn lại commit để thử lại.
- Khi tên hoặc đường dẫn dài, dòng có thể rút gọn và người dùng vẫn có cách xem đường dẫn đầy đủ. Khi đổi workspace, danh sách của workspace trước biến mất khỏi đồ thị.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** Dòng commit phải hỗ trợ mở và thu gọn bằng chuột hoặc bàn phím. Mỗi Git Graph hiển thị tối đa một danh sách file đang mở.
- **FR-002** Danh sách phải nằm ngay dưới dòng commit, có biểu tượng, tên file, thư mục tương đối và trạng thái thêm, sửa, xóa hoặc đổi tên tương ứng. Các đường nối đi qua danh sách phải giữ màu và liên tục.
- **FR-003** Danh sách và diff phải dùng cùng mốc so sánh. Commit thông thường và merge dùng parent thứ nhất. Commit đầu tiên dùng cây file rỗng.
- **FR-004** Chọn file phải mở tab diff chỉ đọc với cách hiển thị và thao tác đóng tab như mục Changes. Chọn lại cùng file trong cùng commit phải kích hoạt tab đã mở. Các workspace, commit hoặc nguồn Changes khác nhau phải có tab riêng.
- **FR-005** Phải xử lý danh sách rỗng, trạng thái tải, lỗi đọc, đường dẫn dài, file đổi tên, file thêm hoặc xóa và file nhị phân. Phải duy trì khả năng đọc trong theme sáng và tối.
- **FR-006** Tính năng chỉ đọc lịch sử của workspace hiện tại. Mở hoặc đóng danh sách và tab diff không làm thay đổi file hay lịch sử Git.

### Key Entities

- **Commit đang xem** — Một commit trong Git Graph của workspace, kèm mốc so sánh dùng cho danh sách và diff.
- **File thay đổi** — File thuộc commit đang xem, có đường dẫn, trạng thái và đường dẫn trước khi đổi tên nếu có.
- **Tab diff lịch sử** — Tab chỉ đọc xác định theo workspace, commit và file.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** Từ Git Graph, người dùng xem được diff của một file chỉ với hai thao tác chọn. Chọn lại đúng file trong cùng commit tạo thêm 0 tab.
- **SC-002** Trên repo mẫu có commit đầu tiên, commit thường và merge, 100% file, trạng thái và diff trong bộ đối chiếu khớp với thay đổi so với mốc đã định.
- **SC-003** Trong cả theme sáng và tối, người dùng xác định đúng tên và trạng thái của cả bốn loại file thêm, sửa, xóa và đổi tên trong danh sách mẫu, đồng thời lần theo được luồng qua phần mở rộng.

## Assumptions

- Mỗi lần mở một commit để giữ danh sách lịch sử gọn. Người dùng có thể đối chiếu nhiều commit bằng các tab diff đã mở.
- Chọn parent thứ nhất làm mặc định cho merge. Danh sách phản ánh các commit Git Graph của workspace đã hiển thị.
- Chức năng xem diff dùng quy ước tab hiện tại của mục Changes. Nhãn và thông báo do ứng dụng cung cấp dùng tiếng Anh.
