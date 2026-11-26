# Feature Specification: Sidebar danh sách project cho Pull Requests và Skills

**Feature Branch**: `master`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Pull Request và Skills dùng layout thêm sidebar bên cạnh toolbar để hiện list project"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chuyển phạm vi Pull Requests từ sidebar (Priority: P1)

Developer mở Pull Requests từ toolbar điều hướng dọc và chọn project ngay trong sidebar cạnh toolbar để xem PR và thông báo của project đó.

**Why this priority**: Danh sách hiện sẵn giúp developer chuyển project trong một thao tác và luôn thấy phạm vi đang xem.

**Independent Test**: Đăng ký hai project có PR và thông báo khác nhau. Mở Pull Requests, chọn lần lượt từng project rồi chọn `All projects`.

**Acceptance Scenarios**:

1. **Given** project A đang được chọn trong Projects, **When** mở Pull Requests lần đầu, **Then** sidebar nằm giữa toolbar dọc và vùng nội dung, liệt kê cả hai project và đánh dấu A đang chọn.
2. **Given** đang xem `Notifications` của A, **When** chọn B từ sidebar bằng chuột hoặc bàn phím, **Then** B được đánh dấu và nội dung chuyển sang thông báo của B trong cùng chế độ.
3. **Given** đang xem B, **When** chọn `All projects`, **Then** nội dung áp dụng phạm vi tất cả project và PR vẫn được nhóm theo project trong chế độ có danh sách PR.
4. **Given** một thông báo dẫn đến PR của B, **When** người dùng mở thông báo, **Then** sidebar đánh dấu B và màn hình đưa người dùng đến PR tương ứng.

### User Story 2 - Chọn project để quản lý Skills (Priority: P1)

Developer mở Skills từ cùng toolbar và chọn project trong sidebar để xem hoặc quản lý bộ skills của project đó.

**Why this priority**: Vị trí chọn project nhất quán giúp developer nhận biết project nào sẽ nhận thay đổi cấu hình.

**Independent Test**: Chuẩn bị hai project có cấu hình skills khác nhau. Mở Skills và dùng bàn phím để chuyển giữa hai project, sau đó quay về Projects.

**Acceptance Scenarios**:

1. **Given** đã đăng ký hai project, **When** mở Skills, **Then** sidebar ở cùng vị trí như trong Pull Requests, hiển thị từng project và đánh dấu project đang xem.
2. **Given** đang xem Skills của A, **When** chọn B, **Then** nội dung hiển thị cấu hình của B và thao tác bật hoặc tắt skill áp dụng cho B.
3. **Given** người dùng đã đổi project trong Pull Requests hoặc Skills, **When** quay lại Projects, **Then** project và workspace đang làm việc trước đó được khôi phục.
4. **Given** toolbar đang thu gọn hoặc danh sách dài hơn chiều cao cửa sổ, **When** người dùng duyệt sidebar, **Then** họ vẫn cuộn hoặc dùng bàn phím để tới và chọn mọi project.

### Edge Cases

- Nếu chưa có project, sidebar báo danh sách trống và vùng nội dung hướng người dùng về Projects để thêm project.
- Nếu project đang xem bị loại khỏi danh sách trong lúc màn hình đang mở, Pull Requests chuyển về `All projects` và Skills chuyển sang project đầu tiên còn lại hoặc trạng thái trống.
- Nếu hai project trùng tên, sidebar hiển thị thêm thông tin phân biệt, chẳng hạn đường dẫn thư mục.
- Nếu nội dung project đang tải hay gặp lỗi, sidebar vẫn cho phép đổi project và vùng nội dung hiển thị trạng thái của lựa chọn hiện tại.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Pull Requests và Skills MUST có cùng bố cục từ trái sang phải gồm toolbar điều hướng dọc, sidebar chọn project và vùng nội dung. Sidebar MUST thay bộ chọn project hiện có trong vùng nội dung của mỗi màn.
- **FR-002**: Sidebar MUST hiển thị mỗi project đã đăng ký theo thứ tự trong Projects, phân biệt các mục trùng tên và cho phép cuộn khi danh sách dài hơn vùng hiển thị.
- **FR-003**: Người dùng MUST chọn được project trực tiếp bằng một lần nhấp hoặc một lần kích hoạt mục đang focus bằng bàn phím. Sidebar MUST thể hiện mục đang chọn và focus bàn phím trong cả theme sáng và tối.
- **FR-004**: Trong Pull Requests, sidebar MUST có mục `All projects` và áp dụng lựa chọn vào danh sách PR và thông báo, giữ chế độ xem hiện tại khi đổi project. Khi điều hướng từ thông báo đến một PR, sidebar MUST phản ánh project đích.
- **FR-005**: Trong Skills, sidebar MUST chọn một project cụ thể để hiển thị danh sách, nguồn và cấu hình skills, đồng thời áp dụng các thao tác quản lý cho project đã chọn.
- **FR-006**: Lựa chọn ở mỗi màn MUST giữ phạm vi riêng với project và workspace đang làm việc trong Projects. Khi mở màn lần đầu, ưu tiên project đang làm việc. Nếu chưa có project đang làm việc, Pull Requests dùng `All projects` và Skills chọn project đầu tiên nếu có.
- **FR-007**: Sidebar MUST hoạt động ở cả hai trạng thái mở rộng và thu gọn của toolbar. Khi danh sách trống, project bị gỡ hoặc nội dung đang tải hay gặp lỗi, màn hình MUST phản ánh trạng thái tương ứng như mô tả trong Edge Cases.
- **FR-008**: Nhãn và thông báo mới do Herdsman cung cấp MUST dùng tiếng Anh. Tên project hiển thị theo tên đã đăng ký.

### Key Entities *(include if feature involves data)*

- **Project** — Thư mục đã đăng ký trong Herdsman và là phạm vi cho dữ liệu Pull Requests hoặc Skills.
- **Phạm vi đang xem** — Một project cụ thể hoặc `All projects` trên Pull Requests, và một project cụ thể trên Skills khi có project.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Với ít nhất hai project, người dùng đổi sang một project đang thấy trong sidebar bằng một lần kích hoạt ở cả Pull Requests và Skills.
- **SC-002**: Trong bài kiểm tra với hai project có dữ liệu khác nhau, 100% lần đổi project hoặc mở thông báo PR hiển thị đúng mục đang chọn và đúng dữ liệu hoặc trạng thái tải của phạm vi đích. Quay lại Projects luôn khôi phục đúng project và workspace ban đầu.
- **SC-003**: Ít nhất 9/10 người thử lần đầu xác định đúng project đang chọn và chuyển sang project được yêu cầu trong vòng 10 giây kể từ khi danh sách hiện, trên cả hai màn.
- **SC-004**: Với danh sách 20 project và cửa sổ chỉ hiện được 8 mục cùng lúc, tất cả project đều có thể chọn bằng chuột và bàn phím trên cả hai màn, kể cả khi toolbar thu gọn.

## Assumptions

- Toolbar trong yêu cầu là thanh điều hướng dọc bên trái hiện có.
- Phạm vi thay đổi là bố cục và cách chọn project của hai màn. Các quy tắc theo dõi PR, thông báo và quản lý skills thực hiện theo [spec Pull Requests](../../files-git/064-track-pull-requests/spec.md) và [spec Skills](../../projects-workspaces/062-manage-project-skills/spec.md).
