# Feature Specification: Theo dõi pull request theo project

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-26

**Status**: Draft

**Input**: Theo dõi PR mình mở và PR được giao review, nhận thông báo khi có cập nhật, phân biệt vai trò theo project và hiện số thông báo chưa xem ở góc icon. Mở màn PR riêng từ thanh icon dọc bên trái và chọn project cùng nội dung muốn xem.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem PR theo project và vai trò (Priority: P1)

Là developer làm việc trên nhiều project, tôi muốn mở danh sách PR từ sidebar trái để biết PR nào do mình mở và PR nào đang chờ mình review.

**Why this priority**: Tôi cần biết việc nào thuộc về mình và thuộc project nào trước khi xử lý.

**Independent Test**: Chuẩn bị hai project, mỗi project có một PR do tôi mở, một PR yêu cầu tôi review và một PR không liên quan. Mở mục PR và kiểm tra nội dung khi đổi project.

**Acceptance Scenarios**:

1. **Given** project A đang được chọn, **When** tôi kích hoạt icon Pull Requests trên sidebar dọc bên trái bằng chuột hoặc bàn phím, **Then** màn PR riêng mở trong một thao tác, thay sidebar project, workspace và panel phải, rồi hiển thị hai nhóm `Authored by Me` và `Review Requested` của A.
2. **Given** danh sách A đang mở, **When** tôi chọn project B trong màn PR, **Then** tiêu đề và hai nhóm hiển thị dữ liệu của B. PR trùng số giữa hai project vẫn dẫn đến đúng PR.
3. **Given** một nhóm không có PR phù hợp, **When** dữ liệu tải thành công, **Then** nhóm hiển thị trạng thái trống riêng.
4. **Given** màn PR đang mở, **When** tôi chọn `All projects` và `Review Requested`, **Then** màn chỉ hiển thị PR chờ tôi review và vẫn nhóm theo từng project.
5. **Given** tôi đã đổi project trong màn PR, **When** tôi quay lại workspace, **Then** sidebar project, workspace và panel phải trở về bố cục trước đó cùng project và workspace đang làm việc.

---

### User Story 2 - Nhận thông báo về cập nhật PR (Priority: P1)

Là tác giả hoặc reviewer, tôi muốn nhận thông báo về thay đổi trên PR mình theo dõi ngay cả khi đang xem mục khác trong Herdsman.

**Why this priority**: Tôi có thể phản hồi comment, cập nhật nhánh hoặc xử lý CI kịp thời mà không cần mở từng PR để kiểm tra.

**Independent Test**: Trên PR thuộc mỗi nhóm, lần lượt tạo comment mới, gửi review yêu cầu sửa, gửi approval, làm CI chuyển sang lỗi và đưa PR vào trạng thái cần cập nhật với nhánh đích. Kiểm tra loại, project, đích của thông báo và số chưa xem trên icon.

**Acceptance Scenarios**:

1. **Given** Herdsman đang chạy và đã ghi nhận trạng thái ban đầu, **When** một PR đang theo dõi có một trong các thay đổi trên, **Then** người dùng nhận thông báo trong app ghi đúng project, PR và loại cập nhật, kể cả khi đang xem project khác.
2. **Given** một lần approve cũng là một review mới, **When** cập nhật được nhận lại hoặc app được khởi động lại, **Then** lần approve đó chỉ tạo một thông báo. Một approval mới từ reviewer khác vẫn tạo thông báo riêng.
3. **Given** thông báo thuộc project B trong khi tôi đang xem A, **When** tôi chọn thông báo, **Then** Herdsman chọn B trong màn PR và đưa tôi đến đúng PR.
4. **Given** tôi đang xem project A và chưa có thông báo PR chưa xem, **When** A và B mỗi project nhận một thông báo mới, **Then** góc icon Pull Requests trên sidebar dọc bên trái hiện số 2. Khi tôi mở một thông báo, số giảm còn 1. Khi mở thông báo còn lại, số biến mất.

---

### User Story 3 - Quản lý yêu cầu review được giao (Priority: P2)

Là reviewer, tôi muốn nhận biết yêu cầu review mới, xem trạng thái và mở PR gốc để xử lý.

**Why this priority**: Danh sách việc chờ review cần phản ánh các yêu cầu đang còn hiệu lực.

**Independent Test**: Giao một PR cho tôi review, mở PR từ danh sách, gửi review trên trang PR rồi yêu cầu review lại. Kiểm tra danh sách sau mỗi thay đổi.

**Acceptance Scenarios**:

1. **Given** một PR đang mở của người khác, **When** tôi được yêu cầu review trực tiếp, **Then** PR xuất hiện ở `Review Requested` của project tương ứng và tôi nhận thông báo yêu cầu review mới.
2. **Given** PR đã được giao cho tôi, **When** tôi chọn mở PR gốc, **Then** trang của đúng PR mở để tôi đọc, comment hoặc gửi review.
3. **Given** một PR trong `Review Requested`, **When** yêu cầu được hoàn tất hoặc gỡ bỏ, hoặc PR được đóng hay merge, **Then** PR rời danh sách chờ. Nếu PR đang mở và tôi được yêu cầu review lại, PR xuất hiện lại cùng thông báo mới.

### Edge Cases

- Nếu chưa có project được chọn trong workspace, màn Pull Requests mặc định dùng `All projects`. Nếu chưa đăng ký project nào, màn hiển thị trạng thái trống. Project chưa có repository được hỗ trợ hoặc thiếu quyền truy cập hiển thị nguyên nhân riêng thay cho trạng thái danh sách trống.
- Khi mất kết nối hoặc nguồn cập nhật tạm lỗi, dữ liệu đã tải được đánh dấu là chưa cập nhật. Khi kết nối lại, danh sách được cập nhật và các sự kiện trong thời gian gián đoạn được thông báo nếu nguồn vẫn cung cấp chúng.
- Nếu quyền truy cập hoặc tài khoản thay đổi, danh sách và thông báo phải phản ánh phạm vi truy cập mới. Nội dung PR riêng tư chỉ hiển thị cho tài khoản còn quyền xem.
- Nếu hai project cùng trỏ tới một repository, mỗi project vẫn có danh sách riêng. Một sự kiện trên cùng PR chỉ tạo một thông báo, ghi các project liên quan mà người dùng có quyền xem. Khi chọn thông báo, Herdsman mở PR trong project hiện tại nếu phù hợp. Nếu có nhiều project phù hợp và project hiện tại không thuộc số đó, người dùng chọn project đích.
- Khi Herdsman đóng, các phiên agent tiếp tục chạy. Lần mở lại, theo dõi PR tiếp tục từ trạng thái đã biết và thông báo các cập nhật còn truy xuất được.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Herdsman MUST cung cấp icon Pull Requests trên sidebar dọc bên trái. Icon có tên truy cập bằng tiếng Anh, kích hoạt được bằng chuột hoặc bàn phím và mở màn Pull Requests riêng trong một thao tác. Màn PR thay phần sidebar project, workspace và panel phải. Thanh điều hướng bên trái vẫn hiện để chuyển màn và có nút thu gọn hoặc mở rộng. Projects là mục đầu tiên, được chọn mặc định và dùng để trở về màn làm việc chính. Mục Pull Requests hiển thị icon khi thu gọn, hiện cả icon và tên khi mở rộng, và giữ bộ đếm ở góc icon trong cả hai trạng thái. Khi quay lại, Herdsman khôi phục bố cục và workspace đang làm việc.
- **FR-002**: Màn PR MUST có bộ chọn project riêng gồm từng project và `All projects`. Màn MUST áp dụng bộ chọn cho danh sách PR và thông báo, nhóm PR theo project khi chọn tất cả, và cập nhật phạm vi ngay cả khi dữ liệu còn đang tải. Lựa chọn tại màn PR MUST giữ nguyên project và workspace đang làm việc.
- **FR-003**: Danh sách MUST tách PR đang mở do tài khoản người dùng tạo, gồm cả draft, vào `Authored by Me`, và PR đang mở của người khác có yêu cầu review trực tiếp còn hiệu lực đối với tài khoản đó vào `Review Requested`.
- **FR-004**: Mỗi PR MUST hiển thị số, tiêu đề, trạng thái PR, trạng thái review và CI nếu nguồn cung cấp, chỉ báo cần cập nhật với nhánh đích nếu được yêu cầu và liên kết đến trang PR gốc. Trạng thái chưa xác định MUST được hiển thị riêng.
- **FR-005**: Herdsman MUST tự cập nhật cả hai nhóm và phát thông báo trong app khi PR được theo dõi có comment mới, review mới, approval mới, lần chạy CI mới bị lỗi hoặc chuyển sang trạng thái bắt buộc cập nhật với nhánh đích (base branch). Herdsman MUST cũng thông báo khi có yêu cầu review trực tiếp mới, gồm yêu cầu lại. Phạm vi thông báo bao gồm mọi project đủ điều kiện khi app đang chạy, kể cả project đang ở nền.
- **FR-006**: Thông báo MUST cho biết project, số và tiêu đề PR, loại cập nhật, có liên kết để đến PR tương ứng trong Herdsman. Nút Pull Requests trên thanh điều hướng MUST hiển thị chấm nhỏ khi tài khoản hiện tại còn ít nhất một thông báo PR chưa đọc ở bất kỳ project nào còn quyền truy cập. Chấm MUST biến mất khi đã đọc hết. Chỉ mở danh sách PR hoặc đổi project sẽ giữ nguyên trạng thái đọc. Nếu PR đã rời danh sách đang theo dõi, liên kết MUST đưa đến trang PR gốc nếu người dùng còn quyền truy cập.
- **FR-007**: Mỗi sự kiện MUST chỉ tạo một thông báo qua các lần làm mới và mở lại app. Approval MUST dùng thông báo approval cho chính review đó. Lần tải thành công đầu tiên MUST lấy các thay đổi có sẵn làm mốc và hiển thị trạng thái hiện tại của PR.
- **FR-008**: Herdsman MUST cập nhật thành viên của hai nhóm khi PR mở lại, đóng, merge hoặc yêu cầu review được thêm, hoàn tất hay gỡ bỏ. Người dùng MUST mở được trang PR gốc để thực hiện thao tác review.
- **FR-009**: Herdsman MUST phân biệt trạng thái đang tải, trống, dữ liệu chưa cập nhật và lỗi cấu hình hoặc quyền truy cập theo từng project. Khi mất quyền hoặc đổi tài khoản, Herdsman MUST ẩn nội dung ngoài phạm vi quyền của tài khoản hiện tại.
- **FR-010**: Sau khi kết nối lại hoặc mở lại app, Herdsman MUST tự làm mới danh sách và thông báo các sự kiện đủ điều kiện còn truy xuất được kể từ lần cập nhật thành công trước đó. Vòng đời theo dõi PR MUST độc lập với vòng đời các phiên agent.

- **FR-011**: Màn PR MUST cho người dùng chọn một trong bốn chế độ `Overview`, `Authored by Me`, `Review Requested` và `Notifications`. Overview hiển thị cả hai vai trò và thông báo. Khi mở thông báo, màn MUST chọn project đích và hiển thị PR liên quan nếu còn trong danh sách.

- **FR-012**: Settings → GitHub MUST cho phép chọn tài khoản đã đăng nhập bằng GitHub CLI hoặc dùng tài khoản mặc định của CLI. Lựa chọn áp dụng cho toàn bộ màn Pull Requests và được khôi phục khi mở lại Herdsman. Khi đổi tài khoản, màn tải PR và thông báo theo tài khoản mới. Nếu tài khoản đã đăng xuất, Herdsman hướng dẫn đăng nhập lại hoặc đổi lựa chọn.

### Key Entities *(include if feature involves data)*

- **Project** — Project hiện có trong Herdsman, liên kết với repository chứa PR.
- **Pull request** — Được xác định theo repository và số PR, có tác giả, trạng thái, nhánh đích, kết quả review và CI.
- **Review request** — Yêu cầu review trực tiếp dành cho tài khoản đang dùng, có trạng thái còn hiệu lực hoặc đã kết thúc.
- **PR notification** — Một sự kiện trên PR, kèm loại cập nhật, project liên quan, đích điều hướng và trạng thái đã xem.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong bài kiểm tra với hai project và các PR trùng số, 100% PR xuất hiện đúng project, đúng nhóm và mở đúng trang gốc. Danh sách mở bằng một lần kích hoạt icon và ít nhất 9/10 người thử lần đầu tìm đúng nhóm họ cần trong 30 giây.
- **SC-002**: Khi app đang chạy và nguồn cập nhật hoạt động bình thường, 100% sự kiện thử nghiệm thuộc sáu loại nêu trong FR-005 xuất hiện đúng project và đúng PR trong vòng 2 phút kể từ khi nguồn ghi nhận.
- **SC-003**: Qua ba lần làm mới và một lần khởi động lại, mỗi sự kiện thử nghiệm xuất hiện đúng một lần. Một sự kiện mới cùng loại trên cùng PR vẫn tạo thông báo riêng. Với hai thông báo từ hai project, chấm trên nút Pull Requests vẫn hiện sau khi mở mục đầu tiên và biến mất sau khi mở mục thứ hai.
- **SC-004**: Trong thử nghiệm giao, hoàn tất, gỡ và giao lại review, 100% thay đổi trong danh sách chờ phản ánh đúng trạng thái nguồn trong vòng 2 phút khi app và nguồn hoạt động bình thường.

- **SC-005**: Trong bài kiểm tra chuyển màn với hai project, 100% lựa chọn project và nội dung phản ánh đúng phạm vi hiển thị. Quay lại workspace khôi phục đúng project, workspace và bố cục ban đầu.

## Assumptions

- Bản đầu hỗ trợ GitHub cho các project Herdsman liên kết với repository mà tài khoản đang dùng có quyền đọc. Vai trò reviewer được xác định từ yêu cầu gửi trực tiếp tới tài khoản. Yêu cầu gửi cho cả team nằm ngoài phạm vi bản đầu.
- Quản lý PR trong Herdsman gồm xem danh sách, trạng thái, thông báo và mở trang PR gốc. Người dùng gửi comment, approve, cập nhật nhánh và merge trên GitHub.
- Thông báo trong app là kênh mặc định. Việc lấy cập nhật đang diễn ra yêu cầu Herdsman chạy và truy cập được GitHub. Khả năng báo lại sau khi mở app phụ thuộc vào sự kiện nguồn còn cung cấp.
- Ngưỡng 2 phút là mục tiêu chấp nhận ban đầu trong điều kiện nguồn và kết nối hoạt động bình thường.
