# Feature Specification: Icon Material và màu trạng thái Git

**Feature Branch**: `master` (nhánh hiện tại)
**Created**: 2026-11-24
**Status**: Draft
**Input**: Dùng icon Material trong File Tree và tô màu các dòng có thay đổi Git trong cả Git Changes lẫn File Tree.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nhận biết loại file qua icon (Priority: P1)

Khi duyệt File Tree, người dùng nhận ra loại file và thư mục qua icon Material.

**Why this priority** — Người dùng có thể định hướng trong cây file nhanh hơn.

**Independent Test** — Mở cây có file TypeScript, Markdown, JSON, file đuôi lạ và một thư mục.

**Acceptance Scenarios**

1. **Given** cây chứa các file TypeScript, Markdown và JSON, **When** người dùng mở File Tree, **Then** mỗi loại có icon Material tương ứng.
2. **Given** một thư mục và một file không nhận diện được loại, **When** chúng xuất hiện trong cây, **Then** thư mục có icon thư mục và file có icon file chung của cùng bộ Material.

### User Story 2 - Phân biệt thay đổi trong Git Changes (Priority: P2)

Khi xem Git Changes, người dùng nhận ra loại thay đổi trực tiếp trên từng dòng.

**Why this priority** — Màu giúp quét danh sách thay đổi mà vẫn đọc được trạng thái cụ thể trên ký hiệu.

**Independent Test** — Mở Git Changes cho repo có file được thêm, sửa và xóa.

**Acceptance Scenarios**

1. **Given** danh sách có file thêm, sửa và xóa, **When** người dùng xem Git Changes, **Then** tên file ở từng dòng mang màu tương ứng và ký hiệu trạng thái vẫn đọc được.
2. **Given** người dùng chọn một dòng thay đổi hoặc chuyển theme, **When** dòng được hiển thị lại, **Then** màu trạng thái và dấu hiệu đang chọn vẫn phân biệt được.

### User Story 3 - Nhận ra file thay đổi ngay trong File Tree (Priority: P3)

Khi duyệt cây, người dùng thấy file nào đã thay đổi và đọc được trạng thái mà không cần mở Git Changes.

**Why this priority** — Người dùng có thể tiếp tục duyệt hoặc mở file ngay trong cây.

**Independent Test** — Mở File Tree của repo có file đã sửa, file mới chưa track và file sạch. Sau đó hoàn tác file đã sửa và làm mới trạng thái.

**Acceptance Scenarios**

1. **Given** cây có file đã sửa, file chưa track và file sạch, **When** trạng thái Git được tải, **Then** hai file thay đổi có màu và ký hiệu trạng thái, còn file sạch dùng màu mặc định.
2. **Given** cùng một file xuất hiện trong hai panel của cùng checkout, **When** đối chiếu hai dòng, **Then** chúng dùng cùng màu và cùng ý nghĩa trạng thái.
3. **Given** file đã trở về trạng thái sạch, **When** trạng thái Git được làm mới thành công, **Then** dòng trở về màu mặc định và bỏ ký hiệu thay đổi.
4. **Given** Git Changes đang hiển thị một worktree riêng với cùng đường dẫn tương đối như trong File Tree của project, **When** chỉ file trong worktree thay đổi, **Then** File Tree không tô màu file sạch thuộc checkout của project.

### Edge Cases

- File đã xóa khỏi đĩa vẫn có thể xuất hiện trong Git Changes. Cây chỉ hiển thị các entry hiện có.
- Hai file trùng tên ở hai thư mục được đối chiếu theo đường dẫn đầy đủ tương đối với checkout.
- Nếu vị trí đang duyệt nằm ngoài repo hoặc trạng thái Git chưa tải được, cây vẫn duyệt được với icon Material và màu mặc định ở các dòng chưa có trạng thái xác nhận.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — File Tree MUST dùng icon Material theo loại file, icon thư mục và icon file chung cho loại chưa được nhận diện.
- **FR-002** — Git Changes MUST tô màu tên file theo nhóm trạng thái và hiển thị ký hiệu chữ có màu ở mép phải dòng, không có nền hay đường viền. Màu thêm và chưa track là xanh lá, sửa là vàng hổ phách, xóa là đỏ, đổi tên hoặc sao chép là xanh dương, xung đột là đỏ kèm ký hiệu xung đột. Trạng thái chưa phân loại dùng màu trung tính và giữ ký hiệu.
- **FR-003** — File Tree MUST áp dụng cùng quy ước màu và ký hiệu cho các file có thay đổi trong checkout mà cây đang duyệt. Hai panel dùng cùng kiểu ký hiệu chữ màu ở mép phải dòng, ví dụ `M` cho file sửa và `U` cho file chưa track. File sạch dùng màu mặc định. Đối chiếu theo checkout và đường dẫn file.
- **FR-004** — Sau khi trạng thái Git được làm mới thành công, mỗi panel MUST phản ánh kết quả mới, bao gồm việc bỏ màu và ký hiệu ở file trở về trạng thái sạch.
- **FR-005** — Tên file, ký hiệu trạng thái và dấu hiệu hover, focus, đang chọn MUST dễ phân biệt ở cả theme sáng và tối. Người dùng MUST đọc được trạng thái qua ký hiệu có tên truy cập mô tả tương ứng.
- **FR-006** — Người dùng MUST tiếp tục mở file, mở rộng hoặc thu gọn thư mục và mở diff từ cùng các dòng như trước.

### Key Entities *(include if feature involves data)*

- **Entry trong File Tree** — File hoặc thư mục với tên, đường dẫn và loại icon.
- **Trạng thái Git của file** — Trạng thái thay đổi gắn với đường dẫn trong một checkout cụ thể.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Cả 5 entry đại diện gồm file TypeScript, Markdown, JSON, file đuôi lạ và thư mục hiển thị đúng icon hoặc icon dự phòng.
- **SC-002** — Trong mẫu kiểm thử gồm file thêm, chưa track, sửa, xóa, đổi tên và xung đột, 100% dòng Git Changes có màu và ký hiệu đúng quy ước. Mọi file tương ứng hiện diện trong File Tree của cùng checkout có màu và ý nghĩa ký hiệu nhất quán.
- **SC-003** — Sau một lần làm mới thành công, 100% file mẫu đã trở về trạng thái sạch mất dấu hiệu thay đổi. Không có file sạch nào bị tô màu do trùng đường dẫn với file thay đổi ở checkout khác.
- **SC-004** — Trong mỗi theme sáng và tối, người kiểm thử xác định được đúng trạng thái của tất cả dòng mẫu qua ký hiệu khi màu được ẩn, và nhận ra dòng đang chọn khi màu được bật.

## Assumptions

- “Material icons” được hiểu là bộ Material Icon Theme dành cho file và thư mục.
- Màu áp dụng cho tên file trên dòng. Thư mục dùng icon Material và không tổng hợp màu thay đổi của các file con.
- File Tree tiếp tục duyệt checkout của project. Git Changes tiếp tục theo workspace đang chọn. Hai panel dùng chung quy ước màu cho trạng thái Git.
