# Feature Specification: Đồng bộ giao diện Git với Files

**Feature Branch** — Chưa tạo nhánh riêng
**Created** — 2026-11-23
**Status** — Draft
**Input** — “Update UI của Gits files đi, cho đồng bộ với files, và mở changes của file sẽ mở lên tab mới”

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem thay đổi của file trong tab riêng (Priority: P1)

Developer chọn một file trong Git để xem diff ở vùng tab chính và tiếp tục chọn các file khác từ danh sách bên phải.

**Why this priority** — Người dùng có thể xem và chuyển giữa các diff mà vẫn giữ được danh sách thay đổi để duyệt tiếp.

**Independent Test** — Mở sẵn một tab soạn thảo có bản sửa chưa lưu, rồi mở hai file đã thay đổi từ Git, chuyển qua lại và đóng một tab diff.

**Acceptance Scenarios**

1. **Given** workspace có hai file thay đổi, **When** người dùng chọn từng file từ Git, **Then** mỗi file mở và kích hoạt một tab diff chỉ đọc ở vùng tab chính, hiển thị đúng tên, đường dẫn và nội dung thay đổi, đồng thời danh sách Git vẫn hiển thị.
2. **Given** tab diff đang tải hoặc đã mở, **When** người dùng chọn lại cùng file trong cùng workspace, **Then** tab đó được kích hoạt và chỉ có một tab diff cho file đó.
3. **Given** file đang mở trong Files với bản sửa chưa lưu, **When** người dùng mở diff của file đó, chuyển giữa hai tab rồi đóng tab diff, **Then** tab soạn thảo và bản sửa chưa lưu vẫn còn.
4. **Given** hai file trùng tên ở hai thư mục hoặc cùng đường dẫn tương đối trong hai workspace, **When** người dùng mở từng diff và quay lại workspace ban đầu, **Then** mỗi diff gắn với đúng đường dẫn và workspace nguồn.
5. **Given** file vẫn có trong danh sách Git khi được chọn, **When** diff đang tải, tải lỗi hoặc trả về rỗng, **Then** tab hiển thị trạng thái tương ứng và người dùng vẫn có thể chọn thay đổi khác.

### User Story 2 - Duyệt Git theo cùng quy ước với Files (Priority: P2)

Developer nhận ra cách duyệt file trong Git từ những quy ước đã quen ở Files, đồng thời vẫn thấy trạng thái Git của mỗi file.

**Why this priority** — Hai panel dùng cùng cách nhận diện file và thao tác, giúp người dùng chuyển qua lại dễ dàng.

**Independent Test** — So sánh Git và Files ở cùng chiều rộng panel trong cả giao diện sáng và tối. Duyệt Git bằng chuột và bàn phím, rồi kiểm tra các trạng thái danh sách.

**Acceptance Scenarios**

1. **Given** workspace có thay đổi, **When** người dùng chuyển giữa Git và Files, **Then** bố cục tiêu đề, mật độ hàng file, kiểu chữ, biểu tượng file, cách rút gọn tên và cách hiển thị hover, focus, lựa chọn dùng cùng quy ước.
2. **Given** có file trùng tên ở các thư mục khác nhau, **When** người dùng duyệt Git, **Then** họ có thể phân biệt đường dẫn và nhận biết trạng thái Git của từng file. Họ có thể di chuyển tới file bằng bàn phím và mở diff bằng Enter.
3. **Given** người dùng chưa chọn workspace, danh sách đang tải, workspace sạch hoặc đọc danh sách thất bại, **When** người dùng mở Git, **Then** panel hiển thị trạng thái tương ứng. Khi có workspace, người dùng có thể làm mới danh sách bằng thao tác Refresh.

### Edge Cases

- File đã xóa vẫn có thể mở diff từ danh sách Git khi Git còn báo thay đổi. Tab hiển thị phần bị xóa nếu có diff.
- Khi chiều rộng panel làm tên file bị rút gọn, người dùng vẫn có thể xem đường dẫn đầy đủ.
- Khi thay đổi biến mất trước lúc tải diff, tab hiển thị trạng thái không còn nội dung thay đổi hoặc lỗi đọc tương ứng với kết quả tải.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Panel Git MUST dùng cùng quy ước với Files cho tiêu đề, khoảng cách, kiểu chữ, biểu tượng file, tên dài và trạng thái hover, focus, lựa chọn trong theme sáng và tối.
- **FR-002** — Panel Git MUST hiển thị các file có thay đổi chưa commit trong workspace đang chọn, kèm đường dẫn phân biệt file và trạng thái Git. Danh sách MUST hỗ trợ chuột và bàn phím.
- **FR-003** — Khi người dùng kích hoạt một file trong Git, ứng dụng MUST mở và chọn tab diff chỉ đọc ở vùng tab chính, giữ danh sách Git hiển thị và cho phép chuyển hoặc đóng tab theo quy ước của vùng tab chính.
- **FR-004** — Ứng dụng MUST mở tối đa một tab diff cho mỗi cặp workspace và đường dẫn tương đối, kể cả khi đang tải. Tab diff và tab soạn thảo của cùng file có thể mở đồng thời, và thao tác trên tab diff MUST giữ nguyên bản sửa chưa lưu.
- **FR-005** — Tab diff MUST hiển thị tên, đường dẫn, các dòng thêm và xóa khi có dữ liệu, hoặc thông báo khi đang tải, không còn nội dung thay đổi hay tải thất bại.
- **FR-006** — Panel Git MUST hiển thị các trạng thái chưa chọn workspace, đang tải, không có thay đổi và lỗi. Khi có workspace, người dùng MUST có thể làm mới danh sách.
- **FR-007** — Nhãn và thông báo mới do ứng dụng cung cấp MUST dùng tiếng Anh.

### Key Entities

- **File thay đổi** — Một đường dẫn tương đối và trạng thái Git trong workspace nguồn.
- **Tab diff** — Tab chỉ đọc của một file thay đổi, nhận diện bằng workspace nguồn và đường dẫn tương đối.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Từ danh sách Git, một lần kích hoạt bằng chuột hoặc Enter đưa người dùng đến tab diff tương ứng. Người dùng có thể mở diff thứ hai mà không cần quay lại danh sách bằng thao tác Back.
- **SC-002** — Trong kịch bản kiểm thử gồm hai file trùng tên, hai workspace có cùng đường dẫn tương đối và thao tác chọn lại khi đang tải, tất cả tab hiển thị đúng diff và mỗi cặp workspace, đường dẫn có tối đa một tab.
- **SC-003** — Cả giao diện sáng và tối đều đạt đối chiếu trực quan cho sáu nhóm quy ước với Files gồm bố cục tiêu đề, mật độ hàng, kiểu chữ, biểu tượng file, cách rút gọn tên và trạng thái tương tác.
- **SC-004** — Người kiểm thử chuyển qua lại giữa tab diff và tab soạn thảo rồi đóng tab diff, bản sửa chưa lưu vẫn có thể tiếp tục chỉnh sửa.

## Assumptions

- “Tab mới” là tab trong vùng nội dung chính của Herdsman, cùng nơi Files hiện mở file. Chọn lại cùng thay đổi sẽ kích hoạt tab đang mở.
- Git giữ dạng danh sách file thay đổi và áp dụng quy ước hiển thị từ Files. Phạm vi gồm duyệt thay đổi và xem diff chưa commit ở workspace đang chọn.
- Tính năng dùng dữ liệu thay đổi Git hiện có của workspace và quy ước điều hướng tab hiện có của ứng dụng.
