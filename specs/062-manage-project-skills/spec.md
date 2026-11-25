# Feature Specification: Quản lý skills theo project

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Làm chức năng quản lí skills theo projects ở trong settings giống như herdr-app"

## Clarifications

### Session 2026-11-25

- Q: Settings nên xử lý thế nào với các skill mà Claude đã tự nạp từ thư mục của project? → A: Tự phát hiện và hiển thị ở chế độ chỉ xem. Session Claude mới trong project nhận các skill Claude tự nạp theo thư mục làm việc và các skill hợp lệ đã bật trong Herdsman cho project đó.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem skills của từng project (Priority: P1)

Developer mở **Settings → Skills**, chọn một project và xem skill nào có thể dùng, skill nào đã bật và skill nào Claude tự nạp từ project hoặc cấu hình toàn cục.

**Why this priority**: Người dùng cần biết cấu hình nào sẽ áp dụng trước khi mở session hoặc thay đổi lựa chọn.

**Independent Test**: Chuẩn bị hai project cùng thấy một thư viện nhưng có lựa chọn khác nhau. Chuyển giữa hai project và kiểm tra danh sách, trạng thái và nhãn nguồn.

**Acceptance Scenarios**:

1. **Given** hai project có cùng skill trong thư viện, **When** chuyển giữa hai project, **Then** Settings hiển thị tên project và trạng thái bật/tắt đã lưu của từng project.
2. **Given** danh sách có skill từ thư viện, thư mục bổ sung và cấu hình toàn cục, **When** tìm theo tên hoặc mô tả hoặc làm mới, **Then** Settings hiển thị kết quả tương ứng, nguồn của từng mục và đánh dấu các skill Claude tự nạp từ project hoặc cấu hình toàn cục chỉ để xem.
3. **Given** chưa có project, danh sách trống hoặc tìm kiếm không khớp, **When** mở mục Skills hoặc tìm kiếm, **Then** Settings giải thích trạng thái hiện tại và cách tiếp tục nếu có.

---

### User Story 2 - Bật hoặc tắt skill cho Claude trong project (Priority: P1)

Developer bật các skill cần dùng và tắt các skill không còn cần cho những session Claude tạo mới trong project.

**Why this priority**: Mỗi project có thể cần một bộ hướng dẫn khác nhau, kể cả khi developer dùng chung một thư viện skill.

**Independent Test**: Bật một skill ở project A, mở lại app và tạo session Claude mới từ thư mục chính và worktree của A, rồi tạo session Claude ở project B. Tắt skill ở A và tạo thêm một session để kiểm tra.

**Acceptance Scenarios**:

1. **Given** skill hợp lệ được bật ở A và tắt ở B, **When** mở lại app và tạo session Claude mới, **Then** skill có mặt ở thư mục chính và worktree của A và không được cấp qua tính năng này ở B.
2. **Given** A có session đang chạy và một skill đã bật, **When** tắt skill rồi tạo session Claude mới, **Then** session mới dùng lựa chọn đã cập nhật và session đang chạy tiếp tục hoạt động.
3. **Given** skill đã bật trở nên không khả dụng trước lúc tạo session, **When** tạo session Claude mới, **Then** session vẫn mở với các skill hợp lệ còn lại và Herdsman nêu rõ skill bị bỏ qua cùng lý do.
4. **Given** có lỗi khi lưu lựa chọn, **When** người dùng bật hoặc tắt skill, **Then** Settings báo lỗi và hiển thị trạng thái đã lưu.
5. **Given** project A có một skill Claude tự nạp và một skill khác đã bật trong Herdsman, **When** tạo session Claude mới ở thư mục làm việc có cả hai skill, **Then** Claude có thể sử dụng cả hai. Khi worktree thiếu skill tự nạp đó, session mới vẫn nhận skill đã bật trong Herdsman.

---

### User Story 3 - Quản lý thư mục nguồn của project (Priority: P2)

Developer thêm thư mục skill có sẵn để dùng riêng cho một project và gỡ thư mục khi project không còn cần.

**Why this priority**: Người dùng có thể tái sử dụng skill của cá nhân hoặc nhóm ngay tại nơi chúng đang được lưu.

**Independent Test**: Thêm một thư mục có skill hợp lệ vào A, bật skill, kiểm tra B rồi gỡ thư mục khỏi A và kiểm tra bản gốc.

**Acceptance Scenarios**:

1. **Given** một thư mục local đọc được chứa skill hợp lệ, **When** thêm vào A, **Then** skill xuất hiện để chọn ở A và cấu hình nguồn của B giữ nguyên.
2. **Given** A có skill đang bật từ một thư mục bổ sung, **When** gỡ nguồn, **Then** người dùng thấy skill nào bị ảnh hưởng trước khi xác nhận, session Claude mới ngừng nhận các skill đó và nội dung gốc vẫn nguyên vẹn.
3. **Given** thư mục không tồn tại, không đọc được hoặc đã được thêm qua một đường dẫn khác, **When** thử thêm, **Then** Settings báo lý do và giữ danh sách đã lưu.
4. **Given** hai nguồn cung cấp skill cùng tên, **When** xem danh sách hoặc gỡ nguồn đang được ưu tiên, **Then** Settings giải thích mục nào có thể bật và mục nào bị trùng. Skill từ nguồn khác chỉ được cấp cho session sau khi người dùng bật mục đó.

### Edge Cases

- Nguồn đã lưu tạm thời mất hoặc không đọc được. Settings báo nguồn không khả dụng và giữ lựa chọn đã lưu để người dùng có thể làm mới khi nguồn trở lại.
- Skill thiếu định nghĩa hoặc mô tả hợp lệ. Settings nêu lý do và vô hiệu hóa thao tác bật trên mục đó.
- Skill từ thư viện hoặc nguồn bổ sung trùng tên với skill Claude tự nạp. Settings chỉ ra xung đột và ưu tiên bản Claude tự nạp khi bản đó khả dụng trong thư mục làm việc của session.
- Người dùng đổi project khi một thao tác lưu hoặc làm mới đang chạy. Kết quả chỉ xuất hiện cho đúng project và thay đổi chỉ lưu vào project mà thao tác bắt đầu.
- App đóng giữa lúc lưu. Khi mở lại, lựa chọn của project phản ánh trạng thái trước thao tác hoặc toàn bộ thay đổi đã lưu thành công. Session đang chạy tiếp tục hoạt động.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Settings MUST có mục **Skills** để người dùng chọn một project local đã có trong Herdsman, thấy tên project đang xem và nhận hướng dẫn khi chưa có project.
- **FR-002**: Herdsman MUST liệt kê skill từ thư viện dùng chung và các nguồn bổ sung của project, với tên, mô tả nếu đọc được, nguồn và trạng thái khả dụng hoặc bật/tắt. Herdsman MUST tự phát hiện các skill Claude nạp từ thư mục project, hiển thị nguồn của chúng và hiển thị các skill Claude toàn cục. Cả hai nhóm chỉ để xem.
- **FR-003**: Người dùng MUST có thể tìm theo tên hoặc mô tả và làm mới danh sách để thấy thay đổi ở thư mục nguồn. Settings MUST phân biệt đang tải, trống, không có kết quả tìm kiếm và nguồn không khả dụng.
- **FR-004**: Người dùng MUST có thể bật hoặc tắt từng skill hợp lệ cho project đã chọn. Herdsman MUST lưu lựa chọn qua lần mở lại app và giữ cấu hình của các project khác nguyên vẹn.
- **FR-005**: Session Claude tạo mới qua Herdsman MUST nhận các skill hợp lệ đã bật cho project chứa workspace, áp dụng giống nhau cho workspace dùng thư mục chính hoặc worktree riêng. Session mới cũng MUST nhận skill Claude tự nạp theo thư mục làm việc của session. Việc lưu, đổi project hoặc đóng app MUST giữ session đang chạy tiếp tục hoạt động. Khi không thể cấp một skill đã bật, Herdsman MUST báo mục bị bỏ qua và lý do, đồng thời cho phép tạo session với các skill còn khả dụng.
- **FR-006**: Người dùng MUST có thể thêm thư mục local đọc được làm nguồn cho project và gỡ nguồn đã thêm. Herdsman MUST từ chối đường dẫn không hợp lệ hoặc một thư mục đã có trong danh sách nguồn của project. Khi gỡ nguồn có skill đang bật, Herdsman MUST liệt kê các skill bị ảnh hưởng trước khi xác nhận và bỏ các lựa chọn tương ứng sau khi gỡ thành công.
- **FR-007**: Khi nhiều nguồn của project có cùng tên skill, Herdsman MUST ưu tiên thư viện dùng chung trước, rồi các nguồn bổ sung theo thứ tự thêm. Settings MUST chỉ rõ các mục bị trùng. Một lựa chọn đã lưu MUST gắn với đúng nguồn đã chọn để bản trùng tên không tự thay thế khi nguồn đó biến mất. Skill có định nghĩa không hợp lệ hoặc trùng tên với skill Claude toàn cục MUST có lý do hiển thị và không thể bật. Khi skill đã bật trùng tên với skill Claude tự nạp từ project trong thư mục làm việc của session mới, Herdsman MUST báo xung đột và chỉ cấp bản Claude tự nạp.
- **FR-008**: Thao tác trong mục Skills MUST giữ nguyên nội dung skill tại mọi nguồn và cấu hình skill toàn cục. Nếu lưu thất bại, Herdsman MUST báo lỗi và giữ trạng thái đã lưu. Khi app mở lại sau gián đoạn trong lúc lưu, cấu hình MUST phản ánh một trạng thái hoàn chỉnh. Chuyển project trong khi đang tải hoặc lưu MUST giữ dữ liệu và kết quả thao tác gắn với project tương ứng.
- **FR-009**: Nhãn, hướng dẫn, trạng thái và lỗi do Herdsman cung cấp MUST dùng tiếng Anh. Tên và mô tả từ nguồn skill MUST giữ nguyên ngôn ngữ gốc.

### Key Entities *(include if feature involves data)*

- **Project** — Project local đã được thêm vào Herdsman, có một cấu hình skill dùng cho các workspace thuộc project.
- **Skill** — Hướng dẫn có tên, mô tả, nguồn và trạng thái khả dụng.
- **Nguồn skill** — Thư mục local cung cấp skill cho thư viện dùng chung hoặc cho một project.
- **Lựa chọn skill** — Liên kết giữa project và skill từ một nguồn cụ thể, xác định skill được cấp cho session Claude mới.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ít nhất 9/10 developer trong bài kiểm tra sử dụng lần đầu tìm và bật đúng một skill cho project được giao trong vòng 60 giây kể từ khi mở Settings, không cần hướng dẫn ngoài giao diện.
- **SC-002**: Trong ma trận kiểm thử gồm hai project, thư mục chính, worktree và lần mở lại app, 100% session Claude mới nhận đúng bộ skill đã bật qua tính năng này và giữ quyền sử dụng các skill Claude tự nạp ở thư mục làm việc. Ma trận gồm cả trường hợp worktree có hoặc thiếu skill tự nạp và xung đột tên.
- **SC-003**: Với hai project và ít nhất 50 skill trong thư viện, 95% lượt chuyển project hiển thị đúng danh sách và lựa chọn trong vòng 2 giây trên máy kiểm thử.
- **SC-004**: Trong các kịch bản gỡ nguồn, lưu thất bại và đóng app giữa lúc lưu, 100% lần kiểm thử giữ nguyên nội dung skill gốc, cấu hình của project khác và hoạt động của session đang chạy.

## Assumptions

- Tham chiếu chức năng là tab **Skills** của mod **Project Settings** trong bản herdr-app cài trên máy. Herdsman áp dụng luồng chọn theo project vào Settings hiện có.
- Phiên bản đầu áp dụng lựa chọn theo project cho session Claude mới, theo bản tham chiếu. Codex, cấp lại skill cho session đang chạy, quản lý MCP, cài từ catalog trực tuyến và chỉnh sửa nội dung skill nằm ngoài phạm vi.
- Thư viện dùng chung và nguồn bổ sung chứa các thư mục skill local có định nghĩa `SKILL.md`. Có thể bắt đầu với thư viện trống và thêm nguồn đã có.
- Lựa chọn và nguồn bổ sung là thiết lập local của Herdsman, độc lập với branch Git và dùng chung giữa các workspace thuộc cùng project.
