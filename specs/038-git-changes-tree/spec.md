# Feature Specification: Chế độ cây cho Git Changes

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-24

**Status**: Draft

**Input**: Thêm mode tree cho git changes

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Duyệt file thay đổi theo thư mục (Priority: P1)

Khi review thay đổi trong workspace, người dùng chuyển Git Changes sang chế độ cây để nhìn cấu trúc thư mục và mở đúng diff, kể cả khi nhiều file trùng tên.

**Why this priority** — Cây giúp người dùng xác định file thuộc phần nào của dự án mà không phải đọc từng đường dẫn đầy đủ.

**Independent Test** — Tạo thay đổi cho `README.md`, `src/ui/index.ts` và `src/lib/index.ts`. Mở Git Changes, chuyển sang Tree, thu gọn và mở lại `src/ui`, rồi mở diff của hai file `index.ts`.

**Acceptance Scenarios**

1. **Given** workspace có file thay đổi ở thư mục gốc và nhiều cấp thư mục con, **When** người dùng chọn Tree, **Then** mỗi file xuất hiện đúng một lần dưới thư mục tương ứng và tiêu đề vẫn đếm số file thay đổi.
2. **Given** cây có thư mục đang mở, **When** người dùng thu gọn bằng chuột hoặc bàn phím, **Then** các mục con ẩn đi và hiện lại khi mở thư mục.
3. **Given** hai file trùng tên ở hai thư mục khác nhau, **When** người dùng chọn từng file, **Then** diff mở đúng theo đường dẫn đầy đủ trong workspace hiện tại và dòng tương ứng được đánh dấu khi diff đó đang được xem.
4. **Given** người dùng đang xem một diff trong Tree, **When** họ chuyển về List, **Then** danh sách phẳng hiện lại, diff vẫn mở và dòng tương ứng vẫn được đánh dấu.
5. **Given** người dùng đang ở Tree, **When** cập nhật Git Changes thêm hoặc bỏ một file hoặc người dùng chuyển workspace, **Then** cây phản ánh danh sách thay đổi mới và bỏ các thư mục không còn file thay đổi.

### Edge Cases

- File ở thư mục gốc xuất hiện trực tiếp trong cây. File đã xóa vẫn xuất hiện theo đường dẫn do Git Changes hiển thị. File đổi tên xuất hiện theo đường dẫn đích đang hiển thị trong List.
- Hai file cùng tên có thể được phân biệt qua thư mục cha và đường dẫn đầy đủ của từng mục.
- Khi chưa chọn workspace, đang tải, gặp lỗi hoặc không có thay đổi, Git Changes hiển thị trạng thái tương ứng ở cả hai chế độ.
- Sau khi làm mới cùng workspace, thư mục còn hiện diện giữ trạng thái mở hoặc thu gọn. Thư mục mới hiển thị ở trạng thái mở.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Git Changes MUST cho phép chuyển giữa hai chế độ List và Tree bằng chuột hoặc bàn phím và cho biết chế độ đang chọn.
- **FR-002** — Tree MUST nhóm đúng tập file thay đổi của workspace hiện tại theo các cấp thư mục trong đường dẫn tương đối. Cây chỉ hiện các thư mục chứa trực tiếp hoặc gián tiếp file thay đổi. Tiêu đề đếm file, và List tiếp tục hiển thị đường dẫn đầy đủ.
- **FR-003** — Người dùng MUST có thể duyệt các mục đang hiển thị và mở hoặc thu gọn từng thư mục bằng chuột hoặc bàn phím. Thao tác trên thư mục chỉ đổi trạng thái hiển thị các mục con.
- **FR-004** — Mỗi dòng file trong Tree MUST hiển thị tên file, icon và ký hiệu trạng thái Git tương ứng, đồng thời cho phép xác định đường dẫn đầy đủ. Chọn file MUST mở cùng diff như chọn đường dẫn đó trong List. Dòng file đang xem MUST giữ dấu chọn khi chuyển chế độ nếu dòng đang hiển thị.
- **FR-005** — Cả hai chế độ MUST phản ánh cùng dữ liệu khi làm mới hoặc đổi workspace và hiển thị trạng thái chưa chọn workspace, đang tải, lỗi hoặc không có thay đổi khi áp dụng.
- **FR-006** — List MUST là chế độ khi mở ứng dụng. Lựa chọn List hoặc Tree MUST giữ trong lần chạy hiện tại khi người dùng chuyển tab hoặc workspace. Các thư mục mở mặc định khi vào Tree hoặc chuyển workspace, và giữ trạng thái khi làm mới cùng workspace nếu vẫn hiện diện.
- **FR-007** — Nhãn và mô tả thao tác mới do Git Changes cung cấp MUST dùng tiếng Anh.

### Key Entities

- **File thay đổi** — Mục Git Changes có đường dẫn tương đối trong workspace, trạng thái Git và diff tương ứng.
- **Thư mục trong cây** — Một đoạn đường dẫn có mục con là file thay đổi hoặc thư mục khác, có thể mở và thu gọn.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Với mẫu có file gốc, file lồng nhiều cấp, file trùng tên, file đã xóa và file đổi tên, 100% mục file trong List xuất hiện đúng một lần ở đúng vị trí trong Tree, với cùng trạng thái Git.
- **SC-002** — Người dùng chuyển được từ List sang Tree và ngược lại bằng một lần kích hoạt điều khiển tương ứng. Trong mẫu thử, tất cả file mở đúng diff từ cả hai chế độ.
- **SC-003** — Trong kịch bản chỉ dùng bàn phím, người dùng hoàn thành luồng chuyển sang Tree, thu gọn và mở lại một thư mục, rồi mở diff của file bên trong mà không cần chuột.
- **SC-004** — Sau một lần làm mới có cả file thêm và file bị bỏ khỏi danh sách thay đổi, số file và các thư mục hiển thị khớp hoàn toàn với dữ liệu mới.

## Assumptions

- Tree là cách trình bày bổ sung bên trong Git Changes. Phạm vi chỉ gồm duyệt và mở diff cho các file đã được Git Changes liệt kê.
- Tree ưu tiên để các thư mục mở khi bắt đầu duyệt. Lựa chọn chế độ chỉ áp dụng trong lần chạy ứng dụng hiện tại.
