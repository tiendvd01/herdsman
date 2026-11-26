# Feature Specification: Tinh chỉnh giao diện Pull Requests

**Feature Branch**: `master`

**Created**: 2026-11-26

**Status**: Implemented

**Input**: User description: "Check giao diện module PRs của herdr-app, rồi refine lại giao diện của module PRs herdsman"

## User Scenarios & Testing *(mandatory)*

Trong bản herdr-app cài trên máy, mục Pull requests mở một dialog có tên repository và bộ đếm ở đầu, bộ lọc luôn hiện, và danh sách gọn với tiêu đề, số PR, thời điểm cập nhật, trạng thái CI và review. Chọn một hàng để xem tiến độ của PR. Herdsman hiện dùng dropdown `Show`, trình bày trạng thái bằng nhiều badge trên nút PR và mở GitHub ngay khi chọn hàng. Tinh chỉnh này áp dụng cách tổ chức danh sách và đọc trạng thái của Herdr vào màn Pull Requests và sidebar chọn project của Herdsman.

### User Story 1 - Lướt danh sách và đổi chế độ xem (Priority: P1)

Là developer theo dõi nhiều PR, tôi muốn nhìn thấy các chế độ xem và nhận ra PR cần xử lý ngay khi mở màn hình.

**Why this priority**: Tôi cần phân biệt PR do mình mở, PR được giao review và PR có vấn đề trước khi chọn một mục.

**Independent Test**: Chuẩn bị hai project, mỗi project có PR do tôi mở và PR được giao review, bao gồm draft, CI lỗi và review yêu cầu sửa. Mở Pull Requests và chuyển qua từng chế độ xem.

**Acceptance Scenarios**:

1. **Given** project A đã có dữ liệu, **When** tôi mở Pull Requests, **Then** tôi thấy project đang chọn trong sidebar, tiêu đề màn hình, nút `Refresh` và bốn chế độ `Overview`, `Authored by Me`, `Review Requested` và `Notifications` ngay trên màn hình. Chế độ hiện tại được đánh dấu.
2. **Given** tôi đang xem `Overview`, **When** tôi cuộn qua danh sách, **Then** mỗi PR có tiêu đề nổi bật nhất, một dòng thông tin phụ có số PR và repository, và một dòng tóm tắt trạng thái. Tôi vẫn có thể đổi chế độ xem khi đang cuộn.
3. **Given** tôi đang xem `Review Requested` của A, **When** tôi chọn B hoặc `All projects` trong sidebar, **Then** màn hình giữ chế độ `Review Requested`, cập nhật số lượng theo phạm vi mới và nhóm PR theo từng project khi xem tất cả.
4. **Given** PR có cả CI lỗi và review cần sửa, **When** tôi lướt danh sách, **Then** dòng trạng thái thể hiện cả hai bằng nhãn có thể đọc được trong theme sáng và tối.

---

### User Story 2 - Đọc trạng thái PR trong Herdsman (Priority: P1)

Là tác giả hoặc reviewer, tôi muốn chọn một PR để hiểu tiến độ và quyết định có cần mở GitHub hay không.

**Why this priority**: Tôi có thể kiểm tra trạng thái CI, review và nhánh đích ngay trong app rồi tiếp tục lướt danh sách.

**Independent Test**: Cuộn danh sách đến một PR có CI lỗi, review đang chờ và cần cập nhật nhánh đích. Mở chi tiết bằng bàn phím, quay lại danh sách, rồi mở lại chi tiết và chọn `Open on GitHub`.

**Acceptance Scenarios**:

1. **Given** PR đang hiển thị trong danh sách, **When** tôi kích hoạt hàng bằng chuột hoặc bàn phím, **Then** Herdsman mở chi tiết trong vùng nội dung và giữ sidebar project. Chi tiết hiển thị tiêu đề đầy đủ, repository, số PR, nhánh nguồn và nhánh đích nếu có, cùng tiến độ PR, CI, review và tình trạng cập nhật với nhánh đích.
2. **Given** chi tiết đang mở, **When** tôi dùng `Back to list`, **Then** Herdsman trả tôi về đúng project, chế độ xem và vị trí đọc trước đó, với focus ở hàng vừa mở nếu hàng đó còn trong danh sách.
3. **Given** hai repository có cùng số PR, **When** tôi chọn `Open on GitHub` từ chi tiết, **Then** trình duyệt mở PR của đúng repository.
4. **Given** tôi đang xem chi tiết của A, **When** tôi chọn project B, **Then** màn hình trở về danh sách của B trong chế độ xem hiện tại.

---

### User Story 3 - Mở đúng PR từ thông báo (Priority: P2)

Là người nhận thông báo, tôi muốn đi thẳng đến thông tin của PR liên quan và thấy thông báo nào còn chưa xem.

**Why this priority**: Thông báo từ các project khác cần đưa tôi đến đúng PR mà không phải tìm lại trong danh sách.

**Independent Test**: Tạo hai thông báo chưa xem cho hai repository có cùng số PR. Đang xem project A, mở thông báo của B từ toast. Sau đó kiểm tra một thông báo trỏ đến PR đã rời danh sách.

**Acceptance Scenarios**:

1. **Given** tôi đang xem `Notifications`, **When** danh sách hiển thị, **Then** mỗi thông báo cho biết loại cập nhật, project, số và tiêu đề PR, cùng nhãn `Unread` nếu chưa xem. Chỉ số trên chế độ `Notifications` đếm thông báo chưa xem trong phạm vi đã chọn.
2. **Given** có thông báo của B trong khi tôi đang xem A, **When** tôi kích hoạt thông báo từ danh sách hoặc toast, **Then** Herdsman chọn B, mở đúng chi tiết PR nếu còn được theo dõi và cập nhật chỉ số chưa xem.
3. **Given** PR đã rời danh sách theo dõi, **When** tôi mở thông báo và vẫn còn quyền truy cập, **Then** Herdsman mở trang PR gốc như luồng hiện tại.
4. **Given** tôi đã mở chi tiết từ một thông báo, **When** tôi chọn `Back to list`, **Then** tôi trở về chế độ xem nơi đã chọn thông báo trong project đích. Nếu mở từ toast, tôi về `Overview` của project đích.

### Edge Cases

- Lần tải đầu hiển thị trạng thái đang tải. Khi làm mới, dữ liệu đã tải của cùng project và tài khoản vẫn đọc được nếu còn quyền truy cập. Nếu cập nhật thất bại tạm thời, màn hình đánh dấu dữ liệu cũ và hiện lỗi tương ứng.
- Khi chưa có project, màn hình hướng về `Projects` để thêm. Khi không có PR phù hợp, màn hình báo danh sách trống theo chế độ đang chọn. Với project chưa có repository được hỗ trợ hoặc thiếu quyền, màn hình nêu nguyên nhân ở đúng project.
- Dữ liệu trạng thái hoặc nhánh chưa có được ghi là `Unknown` khi liên quan. Thời điểm cập nhật chỉ hiện khi có dữ liệu. Khi tài khoản đổi hoặc mất quyền, nội dung và chỉ số ngoài phạm vi truy cập biến mất, kể cả chi tiết đang mở.
- Nếu một thông báo khớp nhiều project, ưu tiên project hiện tại nếu phù hợp. Nếu có nhiều đích và không có project hiện tại phù hợp, người dùng chọn đích trước khi thông báo được đánh dấu đã xem.
- Nếu hàng đã biến mất khi quay lại danh sách, focus chuyển tới tiêu đề danh sách của chế độ đang xem. Tiêu đề PR dài vẫn đọc được đầy đủ trong chi tiết. Ở cửa sổ hẹp, dòng trạng thái xuống dòng để các nhãn tiếp tục đọc được.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Màn Pull Requests MUST có header với tên màn hình, `Refresh` và lựa chọn quay về workspace. Bốn chế độ xem MUST hiển thị trực tiếp trong cùng vùng điều khiển cố định phía trên nội dung cuộn. `Overview` hiển thị cả hai nhóm PR và thông báo. Khi quay về workspace, Herdsman MUST khôi phục project và workspace đang làm việc.
- **FR-002**: Sidebar MUST tiếp tục chọn từng project hoặc `All projects`. Đổi phạm vi MUST giữ chế độ xem hiện tại, đóng chi tiết nếu đang mở và áp dụng phạm vi mới cho danh sách, thông báo và số đếm. Trong `All projects`, danh sách PR MUST nhóm theo project. Khi dữ liệu tương ứng đã tải, `Authored by Me` và `Review Requested` MUST hiển thị số PR trong phạm vi đã chọn.
- **FR-003**: Mỗi hàng PR MUST ưu tiên theo thứ tự tiêu đề, thông tin phụ và trạng thái. Thông tin phụ MUST có số PR, repository và thời điểm cập nhật khi có. Dòng trạng thái MUST thể hiện trạng thái PR, CI, review và cảnh báo cần cập nhật nhánh đích khi thích hợp. Chip trạng thái trong danh sách và chi tiết MUST dùng màu theo ngữ nghĩa, kèm biểu tượng và nhãn chữ để phân biệt lỗi, đang chạy, thành công và chưa xác định trong cả hai theme.
- **FR-004**: Kích hoạt hàng PR MUST mở phần chi tiết chỉ đọc trong màn Pull Requests. Chi tiết MUST có tiêu đề đầy đủ, định danh repository và số PR, nhánh nguồn và nhánh đích khi có, và tóm tắt tiến độ theo các mục trạng thái PR, CI, review và tình trạng nhánh đích. `Open on GitHub` MUST mở đúng PR. `Back to list` MUST khôi phục ngữ cảnh theo User Story 2 khi mở từ danh sách PR, hoặc theo User Story 3 khi mở từ thông báo.
- **FR-005**: Mỗi thông báo MUST có loại cập nhật, project, số và tiêu đề PR, và dấu hiệu chưa xem. Chế độ `Notifications` MUST hiển thị số chưa xem theo phạm vi đang chọn. Icon Pull Requests ở thanh điều hướng MUST tiếp tục đếm trên mọi project còn quyền truy cập. Kích hoạt một thông báo MUST áp dụng quy tắc chọn đích, đánh dấu đã xem và mở đúng chi tiết hoặc trang GitHub theo User Story 3 và Edge Cases.
- **FR-006**: Trong danh sách và chi tiết, Herdsman MUST phân biệt trạng thái đang tải, trống, dữ liệu cũ và lỗi cấu hình hoặc quyền theo phạm vi. Trong lúc làm mới, dữ liệu đang hiển thị của cùng phạm vi vẫn đọc được khi người dùng còn quyền. Khi đổi tài khoản hay mất quyền, màn hình MUST ẩn dữ liệu và bộ đếm ngoài phạm vi truy cập.
- **FR-007**: Sidebar, bộ điều khiển chế độ xem, hàng PR, thông báo và các hành động chi tiết MUST dùng được bằng chuột và bàn phím, với focus và lựa chọn hiện tại phân biệt được trong theme sáng và tối. Nhãn do Herdsman cung cấp MUST dùng tiếng Anh. Tên project và tiêu đề PR MUST hiển thị bằng ngôn ngữ gốc.

### Key Entities *(include if feature involves data)*

- **Phạm vi xem** — Project cụ thể hoặc `All projects`, kết hợp với chế độ xem trong màn Pull Requests.
- **Pull request** — PR được định danh theo repository và số PR, có project liên quan, tiêu đề, nhánh, thời điểm cập nhật và trạng thái hiển thị.
- **Thông báo PR** — Sự kiện cần xem với loại cập nhật, project liên quan, PR đích và trạng thái đã xem.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong bài thử lần đầu với ít nhất 10 người, ít nhất 9 người tìm được một PR được giao review đang lỗi CI trong vòng 15 giây sau khi danh sách đã tải, không cần mở trình duyệt.
- **SC-002**: Với hai project và hai repository có PR trùng số, 100% lượt mở từ danh sách, thông báo và nút `Open on GitHub` dẫn đến đúng PR và project khi áp dụng. Hai thông báo chưa xem thuộc hai project làm bộ đếm toàn app lần lượt hiện 2, 1 và biến mất sau khi mở từng thông báo.
- **SC-003**: Với 30 PR và chi tiết được mở từ một hàng ngoài vùng nhìn lúc đầu, `Back to list` khôi phục đúng phạm vi, chế độ, vị trí đọc và focus ở 100% lượt thử khi hàng còn trong danh sách.
- **SC-004**: Ở kích thước cửa sổ 900 × 600 và 1280 × 800, trong cả hai theme, người dùng hoàn thành luồng đổi project, đổi chế độ, mở PR và quay lại chỉ bằng bàn phím. Các điều khiển và nhãn trạng thái vẫn hiện đầy đủ mà không cần cuộn ngang vùng nội dung.
- **SC-005**: Trong bài thử làm mới thành công, lỗi tạm thời, đổi tài khoản và mất quyền, 100% trạng thái kiểm thử hiển thị đúng phạm vi. Dữ liệu còn quyền đọc tiếp tục hiển thị khi làm mới, và dữ liệu ngoài quyền truy cập biến mất khi quyền hoặc tài khoản thay đổi.

## Assumptions

- Đã đối chiếu danh sách trong cửa sổ herdr-app đang chạy và hành vi chi tiết qua mã mod `pr-flow` tại `~/.config/herdr-app/mods/pr-flow/main.js`. Phạm vi tinh chỉnh là danh sách, bộ điều khiển, chi tiết chỉ đọc và điều hướng từ thông báo trong bố cục riêng của Herdsman.
- [Spec 064](../064-track-pull-requests/spec.md) quy định nguồn dữ liệu, vai trò, tài khoản, điều kiện truy cập và cách thông báo. [Spec 065](../../appearance-shortcuts/065-add-project-sidebar/spec.md) quy định sidebar chọn project. Đặc tả này cập nhật cách trình bày và điều hướng của màn Pull Requests.
- Phạm vi dữ liệu là PR đang được theo dõi theo hai vai trò hiện có. Bộ lọc lịch sử `Merged`, phạm vi `Everyone`, inbox nổi, diff, log CI, liên kết agent và thao tác comment, approve hoặc merge trong Herdsman nằm ngoài phạm vi tinh chỉnh này.
