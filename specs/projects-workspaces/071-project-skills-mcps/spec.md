# Feature Specification: Sửa cấp skill và thêm quản lý MCP theo project

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Kiểm tra lại cơ chế đẩy skills herdsman, đang bị lỗi đẩy skills vào. Skill enable ở project rồi mà session mới mở lên không slash được skill đấy, và chưa có quản lí mcps. Nên tách mcps thành 1 icon riêng trên sidebar."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gọi skill đã bật bằng slash command (Priority: P1)

Developer đã bật skill cho project trong màn **Skills** (spec 062). Khi mở session Claude mới trong project đó, developer gõ `/` trong ô soạn tin và mong thấy, chọn và chạy được các skill đã bật như mọi slash command khác.

**Why this priority**: Đây là lỗi của tính năng đã phát hành. Hiện skill đã bật không xuất hiện trong danh sách slash nên người dùng không dùng được, dù Settings báo đã bật.

**Independent Test**: Bật 2 skill ở project A (một từ thư viện dùng chung, một từ thư mục bổ sung). Tạo session Claude mới ở thư mục chính, ở worktree và từ workspace trống của A. Gõ `/` cùng một phần tên skill, chọn skill và gửi. Lặp lại với project B không bật skill.

**Acceptance Scenarios**:

1. **Given** project A có skill hợp lệ đã bật, **When** tạo session Claude mới bằng bất kỳ đường tạo session nào (nút tạo session, workspace mới, workspace trống, phím tắt), **Then** danh sách slash của session có skill đó với tên và mô tả, và chọn skill sẽ chạy đúng skill.
2. **Given** session vừa tạo ở bước 1, **When** đóng app, mở lại và tiếp tục session hoặc resume session đã kết thúc, **Then** skill đã cấp lúc tạo session vẫn có trong danh sách slash.
3. **Given** project B không bật skill nào qua Herdsman, **When** tạo session Claude mới ở B, **Then** danh sách slash không có skill chỉ bật ở A.
4. **Given** một skill đã bật không cấp được (nguồn mất, định nghĩa lỗi, trùng tên), **When** tạo session mới, **Then** session vẫn mở, các skill còn lại vẫn slash được và người dùng thấy cảnh báo nêu skill bị bỏ qua cùng lý do.
5. **Given** skill đã bật có tên hiển thị khác tên thư mục hoặc được nhóm dưới một tiền tố, **When** gõ `/` cùng tên skill như người dùng thấy trong màn Skills, **Then** skill vẫn xuất hiện trong kết quả lọc.

---

### User Story 2 - Quản lý MCP server theo project (Priority: P2)

Developer mở mục **MCP** riêng trên thanh điều hướng trái, chọn một project, xem MCP server nào session Claude của project sẽ có, thêm server mới và bật hoặc tắt server cho project đó.

**Why this priority**: Skill và MCP cùng quyết định agent làm được gì trong project. Hiện Herdsman chưa cho xem hay chọn MCP, nên người dùng phải sửa cấu hình bằng tay ngoài app.

**Independent Test**: Thêm một MCP server vào Herdsman, bật ở project A và tắt ở B. Mở lại app, tạo session Claude mới ở A và B, kiểm tra server có sẵn ở A và không được cấp qua Herdsman ở B.

**Acceptance Scenarios**:

1. **Given** app có project, **When** bấm icon **MCP** trên thanh điều hướng trái, **Then** vùng nội dung mở màn MCP tách biệt với màn Skills, hiển thị project đang xem và cho đổi project.
2. **Given** project có MCP server Claude tự nạp từ thư mục project hoặc cấu hình toàn cục, **When** mở màn MCP, **Then** các server đó hiển thị kèm nguồn ở chế độ chỉ xem.
3. **Given** người dùng nhập định nghĩa server hợp lệ (chạy bằng lệnh local hoặc kết nối qua URL), **When** lưu, **Then** server xuất hiện trong danh sách và có thể bật cho từng project.
4. **Given** server đã bật ở A, **When** tạo session Claude mới ở thư mục chính hoặc worktree của A, **Then** session dùng được công cụ của server đó. Session đang chạy giữ nguyên cấu hình cũ.
5. **Given** định nghĩa thiếu trường bắt buộc hoặc trùng tên với server khác của project, **When** lưu, **Then** màn MCP báo lý do và giữ danh sách đã lưu.
6. **Given** server đã bật không khởi động hoặc không kết nối được, **When** tạo session mới, **Then** session vẫn mở và người dùng thấy server nào lỗi.

---

### User Story 3 - Sửa và gỡ MCP server (Priority: P3)

Developer sửa định nghĩa của server đã thêm hoặc gỡ server không còn dùng.

**Why this priority**: Cần để duy trì danh sách lâu dài, nhưng thêm và bật server đã đủ giá trị ban đầu.

**Independent Test**: Sửa lệnh của một server đang bật ở hai project, tạo session mới để kiểm tra bản mới. Gỡ server, xác nhận danh sách project bị ảnh hưởng và tạo session mới.

**Acceptance Scenarios**:

1. **Given** server đang bật ở một hoặc nhiều project, **When** gỡ server, **Then** người dùng thấy các project bị ảnh hưởng trước khi xác nhận và session mới của các project đó ngừng nhận server.
2. **Given** người dùng sửa định nghĩa server, **When** lưu, **Then** session mới dùng định nghĩa mới và session đang chạy không bị ngắt.

### Edge Cases

- Skill đã bật trùng tên với slash command có sẵn hoặc skill Claude tự nạp: danh sách slash không hiện hai mục khó phân biệt, và Herdsman báo bản nào được dùng.
- Session được tạo trước khi bản sửa có hiệu lực: người dùng biết cần tạo session mới hoặc khởi động lại session để nhận skill.
- Dữ liệu tạm của skill bị dọn khi đóng tab nhưng session còn được resume: skill vẫn được cấp lại khi session chạy tiếp.
- Định nghĩa MCP chứa giá trị bí mật (token, khóa API): giá trị không hiện rõ trong danh sách và không xuất hiện trong log hay cảnh báo.
- MCP server từ Herdsman trùng tên với server Claude tự nạp: màn MCP báo xung đột và ưu tiên bản Claude tự nạp, giống quy tắc của skill.
- Đổi project khi đang lưu: thay đổi chỉ áp dụng cho project bắt đầu thao tác.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Mọi đường tạo session Claude mới MUST cấp các skill hợp lệ đã bật cho project chứa workspace, kể cả workspace trống, worktree và session tạo từ phím tắt hoặc Command Palette.
- **FR-002**: Skill được cấp MUST xuất hiện trong danh sách slash của session ngay khi session sẵn sàng nhận tin, có tên và mô tả, lọc được theo tên hiển thị trong màn Skills và chạy đúng skill khi chọn.
- **FR-003**: Session tiếp tục sau khi mở lại app, resume hoặc khởi động lại MUST giữ các skill đã cấp khi tạo session, kể cả khi dữ liệu tạm của session đã bị dọn.
- **FR-004**: Khi một skill đã bật không cấp được, Herdsman MUST mở session với các skill còn lại và hiển thị cảnh báo nêu tên skill cùng lý do trong session.
- **FR-005**: Thanh điều hướng trái MUST có icon **MCP** riêng, mở màn quản lý MCP trong vùng nội dung, tách khỏi màn Skills, có chọn project và hướng dẫn khi chưa có project.
- **FR-006**: Màn MCP MUST liệt kê server do Herdsman quản lý với tên, kiểu kết nối, trạng thái bật/tắt theo project, và liệt kê chỉ xem các server Claude tự nạp từ thư mục project hoặc cấu hình toàn cục kèm nguồn.
- **FR-007**: Người dùng MUST có thể thêm, sửa và gỡ server do Herdsman quản lý, với kiểu chạy bằng lệnh local (lệnh, tham số, biến môi trường) hoặc kết nối qua URL (địa chỉ, header). Herdsman MUST kiểm tra trường bắt buộc và tên trùng trước khi lưu, và liệt kê project bị ảnh hưởng trước khi gỡ server đang bật.
- **FR-008**: Người dùng MUST có thể bật hoặc tắt từng server cho từng project. Lựa chọn MUST được lưu qua lần mở lại app và không ảnh hưởng project khác.
- **FR-009**: Session Claude tạo mới MUST nhận các server đã bật cho project cùng với server Claude tự nạp. Khi trùng tên, Herdsman MUST báo xung đột và chỉ cấp bản Claude tự nạp. Server lỗi MUST không chặn việc mở session và MUST được báo trong session.
- **FR-010**: Giá trị của biến môi trường và header MUST được che khi hiển thị và MUST không xuất hiện trong cảnh báo hay log.
- **FR-011**: Thao tác trong màn Skills và MCP MUST giữ nguyên file cấu hình của project và cấu hình Claude toàn cục. Lưu thất bại MUST báo lỗi và giữ trạng thái đã lưu.
- **FR-012**: Nhãn, hướng dẫn, trạng thái và lỗi do Herdsman cung cấp MUST dùng tiếng Anh.

### Key Entities *(include if feature involves data)*

- **Project** — Project local trong Herdsman, có lựa chọn skill (spec 062) và lựa chọn MCP server riêng.
- **MCP server** — Định nghĩa do Herdsman quản lý: tên, kiểu kết nối, thông số chạy hoặc kết nối, giá trị bí mật.
- **Lựa chọn MCP** — Liên kết giữa project và MCP server, xác định server được cấp cho session Claude mới.
- **Gói cấp cho session** — Tập skill và MCP server đã xác định khi tạo session, dùng lại khi session chạy tiếp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong ma trận kiểm thử gồm mọi đường tạo session, thư mục chính, worktree, workspace trống, mở lại app và resume, 100% skill hợp lệ đã bật xuất hiện trong danh sách slash và chạy được.
- **SC-002**: Danh sách slash có skill đã bật trong vòng 3 giây sau khi session sẵn sàng.
- **SC-003**: Ít nhất 9/10 developer thêm và bật một MCP server cho project được giao trong vòng 2 phút, không cần tài liệu ngoài giao diện.
- **SC-004**: 100% session mới của project có server bật dùng được công cụ của server đó khi server hoạt động, và 0 session mới của project khác nhận server đó qua Herdsman.
- **SC-005**: 0 giá trị bí mật của MCP lộ ra trên giao diện, cảnh báo hoặc log trong các kịch bản kiểm thử.

## Assumptions

- Chỉ áp dụng cho session Claude. Codex nằm ngoài phạm vi, giống spec 062.
- MCP server do Herdsman quản lý được lưu như thiết lập local của Herdsman, dùng chung cho mọi project, và bật theo từng project. Herdsman không ghi vào file cấu hình MCP của project hay cấu hình Claude toàn cục.
- Không cấp lại skill hoặc MCP cho session đang chạy. Thay đổi có hiệu lực ở session tạo mới hoặc khi khởi động lại session.
- Cài server từ catalog trực tuyến, OAuth cho server qua URL và xem trước danh sách công cụ của server nằm ngoài phạm vi phiên bản đầu.
- Phần sửa lỗi skill kế thừa quy tắc nguồn, ưu tiên và xung đột của spec 062. Spec này chỉ sửa việc cấp skill vào session và thêm MCP.
