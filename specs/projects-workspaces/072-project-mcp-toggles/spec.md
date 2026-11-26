# Feature Specification: Bật tắt mọi MCP server theo project

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Tôi muốn bật tắt được mcp theo từng project"

## Bối cảnh

Spec 071 cho bật tắt theo project các MCP server do Herdsman quản lý. Các server Claude tự nạp (từ `.mcp.json` của project, cấu hình riêng của project trong cấu hình Claude toàn cục, và cấu hình toàn cục dùng cho mọi project) chỉ hiện ở chế độ chỉ xem. Server cài ở mức toàn cục vì vậy luôn chạy trong mọi project, kể cả project không cần, và người dùng chỉ có thể tắt bằng cách sửa file cấu hình ngoài app, làm ảnh hưởng mọi project khác. Spec này cho mọi server trong màn MCP bật tắt được theo từng project.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tắt server Claude tự nạp cho một project (Priority: P1)

Developer có server cài ở cấu hình Claude toàn cục, ví dụ server chỉ mục mã nguồn chỉ hữu ích ở vài repo. Ở project không cần server đó, developer mở màn **MCP**, tắt server trong mục **Loaded by Claude**, và session Claude mới của project không còn nạp server đó. Các project khác vẫn nạp như cũ.

**Why this priority**: Đây là phần còn thiếu của quản lý MCP theo project. Server không cần thiết tốn thời gian khởi động, thêm công cụ gây nhiễu cho agent và có thể truy cập dữ liệu ngoài ý muốn.

**Independent Test**: Khai báo một server ở cấu hình toàn cục. Tắt server ở project A, giữ nguyên ở B. Mở lại app, tạo session Claude mới ở A và B, kiểm tra session ở A không có công cụ của server, session ở B có.

**Acceptance Scenarios**:

1. **Given** project A có server Claude tự nạp, **When** mở màn MCP, **Then** mỗi server trong mục **Loaded by Claude** có công tắc bật tắt, mặc định là bật, kèm nguồn của server.
2. **Given** người dùng tắt server Claude tự nạp ở project A, **When** tạo session Claude mới ở thư mục chính, worktree hoặc workspace trống của A, **Then** session không nạp server đó và các server còn lại vẫn hoạt động.
3. **Given** server đã tắt ở A, **When** tạo session Claude mới ở project B, **Then** B vẫn nạp server đó.
4. **Given** server đã tắt ở A, **When** người dùng bật lại, **Then** session Claude mới của A nạp lại server đó.
5. **Given** người dùng tắt hoặc bật server, **When** mở lại app, **Then** lựa chọn được giữ nguyên.
6. **Given** session Claude đang chạy ở A, **When** người dùng tắt server, **Then** session đó giữ nguyên cấu hình cũ, và màn MCP cho biết thay đổi chỉ áp dụng cho session mới.

---

### User Story 2 - Thấy rõ server nào session sẽ nhận (Priority: P2)

Developer nhìn màn MCP của một project và biết ngay server nào session Claude mới sẽ nhận, server nào đã tắt, và lý do.

**Why this priority**: Khi server đến từ nhiều nguồn, người dùng cần một chỗ duy nhất để biết agent có công cụ gì. Thiếu điều này thì thao tác bật tắt khó kiểm chứng.

**Independent Test**: Tạo project có server từ `.mcp.json`, từ cấu hình toàn cục và từ Herdsman, tắt mỗi nguồn một server. Mở màn MCP và so với công cụ có trong session Claude mới.

**Acceptance Scenarios**:

1. **Given** project có server từ nhiều nguồn, **When** mở màn MCP, **Then** mỗi server hiện tên, kiểu kết nối, nguồn và trạng thái bật/tắt cho project đang xem, và danh sách server bật khớp với server session Claude mới nhận.
2. **Given** cùng một tên server được khai báo ở nhiều nguồn, **When** người dùng tắt tên đó ở project, **Then** mọi dòng cùng tên chuyển sang tắt và session Claude mới không nạp server nào mang tên đó.
3. **Given** một server đã tắt ở project không còn trong file cấu hình nguồn, **When** mở màn MCP, **Then** server đó không hiện, và nếu sau này server được khai báo lại với cùng tên thì lựa chọn tắt trước đó vẫn được áp dụng.

### Edge Cases

- Server cùng tên được khai báo ở nhiều nguồn (project, riêng của project, toàn cục): mỗi nguồn hiện một dòng nhưng dùng chung một công tắc, vì Claude chỉ nạp một server cho mỗi tên.
- Server Herdsman trùng tên với server Claude tự nạp: giữ quy tắc của spec 071, bản Herdsman không được cấp và màn MCP báo xung đột, kể cả khi server Claude tự nạp đã tắt ở project.
- Tắt mọi server: session vẫn mở bình thường, không có công cụ MCP nào.
- File cấu hình nguồn lỗi hoặc không đọc được: màn MCP báo lỗi đọc nguồn đó, các nguồn khác vẫn hiện và bật tắt được.
- Session được resume bằng `claude --resume` ngoài Herdsman: Herdsman không kiểm soát được, Claude nạp theo cấu hình gốc.
- Người dùng chạy `claude` trong terminal ở thư mục project: không chịu ảnh hưởng của lựa chọn trong Herdsman.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Màn MCP MUST cho bật hoặc tắt từng server Claude tự nạp theo từng project, với mọi nguồn mà màn MCP đang hiện: `.mcp.json` của project, cấu hình riêng của project trong cấu hình Claude toàn cục, và cấu hình toàn cục.
- **FR-002**: Server Claude tự nạp MUST mặc định là bật cho mọi project cho tới khi người dùng tắt.
- **FR-003**: Session Claude mới mà Herdsman tạo cho workspace thuộc project MUST không nạp server đã tắt cho project đó, bất kể session tạo từ thư mục chính, worktree, workspace trống, phím tắt hay Command Palette.
- **FR-004**: Session Herdsman tiếp tục sau khi mở lại app, resume hoặc khởi động lại MUST giữ đúng tập server đã xác định khi tạo session.
- **FR-005**: Lựa chọn bật/tắt MUST được lưu qua lần mở lại app, chỉ áp dụng cho project đã chọn, và được nhận diện theo tên server.
- **FR-006**: Bật tắt server MUST không sửa file `.mcp.json` của project hay cấu hình Claude toàn cục.
- **FR-007**: Màn MCP MUST hiện trạng thái bật/tắt cho mọi server của project đang xem, và tập server bật MUST khớp với tập server session Claude mới nhận.
- **FR-008**: Server Claude tự nạp cùng tên ở nhiều nguồn MUST dùng chung một trạng thái bật/tắt trong project.
- **FR-009**: Màn MCP MUST cho biết thay đổi chỉ áp dụng cho session tạo mới, session đang chạy giữ cấu hình cũ.
- **FR-010**: Lưu lựa chọn thất bại MUST báo lỗi và giữ trạng thái đã lưu trước đó.
- **FR-011**: Nhãn, hướng dẫn, trạng thái và lỗi do Herdsman cung cấp MUST dùng tiếng Anh.

### Key Entities *(include if feature involves data)*

- **Server Claude tự nạp** — Server khai báo ngoài Herdsman, hiện kèm nguồn (phạm vi cùng file khai báo) và được bật tắt theo tên.
- **Lựa chọn MCP của project** — Mở rộng lựa chọn của spec 071: ngoài server Herdsman đã bật, ghi thêm các server Claude tự nạp mà project đã tắt.
- **Gói cấp cho session** — Tập server xác định khi tạo session, dùng lại khi session chạy tiếp trong Herdsman.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng tắt được một server toàn cục cho một project trong dưới 30 giây, không phải sửa file cấu hình.
- **SC-002**: Trong ma trận kiểm thử gồm mọi đường tạo session, thư mục chính, worktree, workspace trống, mở lại app và resume trong Herdsman, 0 session mới của project nhận server đã tắt, và 100% session mới của project khác vẫn nhận server đó.
- **SC-003**: Với mọi project trong bộ kiểm thử, danh sách server bật trên màn MCP khớp 100% với server session Claude mới nhận.
- **SC-004**: 0 thay đổi trên file `.mcp.json` của project và cấu hình Claude toàn cục sau mọi thao tác bật tắt.

## Assumptions

- Chỉ áp dụng cho session Claude do Herdsman tạo. Codex, `claude` chạy tay trong terminal và session resume ngoài Herdsman nằm ngoài phạm vi.
- Phạm vi gồm ba nguồn mà màn MCP đang đọc theo spec 071. Server do plugin Claude hoặc connector của tài khoản cung cấp nằm ngoài phạm vi phiên bản này.
- Server Claude tự nạp chỉ bật tắt được, không sửa hay gỡ được trong Herdsman.
- Không có thiết lập mặc định "tắt cho mọi project". Người dùng tắt ở từng project.
- Thay đổi không cấp lại cho session đang chạy, giống spec 071.
