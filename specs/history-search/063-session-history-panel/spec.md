# Feature Specification: Panel History cho phiên agent

**Feature Branch**: `master`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Xem lại các session, kể cả session Claude Code CLI, trong một panel History."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem lại phiên Herdsman (Priority: P1)

Developer mở tab **History** trong panel bên phải, chọn một phiên trước đây và đọc hội thoại trong vùng làm việc chính. Danh sách vẫn hiện để có thể chuyển sang phiên khác.

**Why this priority** — Việc xem lại nhiều phiên liên tiếp là thao tác chính của panel.

**Independent Test** — Tạo một workspace có một phiên đang chạy và một phiên đã kết thúc. Mở History rồi chọn lần lượt hai phiên bằng bàn phím.

**Acceptance Scenarios**

1. **Given** workspace có phiên đang chạy, phiên đã kết thúc và phiên chưa đặt tên, **When** mở History, **Then** danh sách mặc định hiển thị cả ba phiên theo lần hoạt động gần nhất, với nhãn thay thế cho phiên chưa đặt tên.
2. **Given** History đang mở, **When** chọn một phiên đã kết thúc, **Then** hội thoại mở trong tab phiên tạm và History vẫn hiện. Khi chọn phiên đang chạy, app chuyển đến phiên đó mà không khởi chạy thêm tiến trình.

### User Story 2 - Xem lại phiên Claude Code CLI (Priority: P1)

Developer tìm lại hội thoại đã chạy trực tiếp trong Claude Code CLI, kể cả từ thư mục chưa được thêm vào Herdsman.

**Why this priority** — Lịch sử cần bao quát các phiên người dùng đã làm việc ngoài Herdsman.

**Independent Test** — Chuẩn bị một hội thoại CLI thuộc workspace hiện tại, một hội thoại từ thư mục chưa được thêm và một hội thoại đã có trong Herdsman. Duyệt cả hai phạm vi và mở phiên CLI.

**Acceptance Scenarios**

1. **Given** có phiên CLI liên kết được với workspace hiện tại và phiên CLI từ thư mục chưa được thêm, **When** duyệt History, **Then** phiên liên kết xuất hiện ở **This workspace** và cả hai phiên xuất hiện ở **All projects**, với nguồn và ngữ cảnh thư mục hiển thị rõ.
2. **Given** một phiên Claude xuất hiện ở cả lịch sử Herdsman lẫn lịch sử CLI, **When** duyệt hoặc tìm thấy phiên đó, **Then** có một dòng kết quả và việc chọn dòng đó mở phiên Herdsman đã có.
3. **Given** một phiên CLI có hội thoại đọc được, **When** chọn phiên, **Then** app mở đúng hội thoại đã lưu mà không khởi chạy agent. Khi đóng và mở lại app, phiên gốc vẫn có thể được xem lại.

### User Story 3 - Tìm phiên trong History (Priority: P2)

Developer tìm theo tiêu đề hoặc nội dung để mở lại một phiên dù không nhớ workspace ban đầu.

**Why this priority** — Tìm kiếm giúp định vị phiên khi danh sách đã dài hoặc workspace đã archive.

**Independent Test** — Chuẩn bị các hội thoại Herdsman và Claude Code CLI trùng từ khóa ở nhiều workspace. Đổi phạm vi rồi mở kết quả bằng bàn phím.

**Acceptance Scenarios**

1. **Given** từ khóa khớp nội dung các phiên ở nhiều workspace, gồm một workspace đã archive, **When** đổi từ **This workspace** sang **All projects**, **Then** truy vấn được giữ và danh sách mở rộng ra mọi phiên phù hợp, kèm đoạn trích khi khớp nội dung.
2. **Given** truy vấn có kết quả, **When** dùng bàn phím chọn một dòng, **Then** đúng hội thoại được mở. Khi xóa truy vấn, panel trở lại danh sách duyệt trong phạm vi đang chọn.

### Edge Cases

- Khi chưa chọn workspace, **All projects** là phạm vi khả dụng. Nếu không có phiên, panel hiện trạng thái trống. Nếu truy vấn không khớp, panel báo không có kết quả.
- Khi một nguồn không đọc được hoặc một transcript biến mất sau khi được liệt kê, panel hiển thị lỗi phù hợp và giữ các kết quả khả dụng. Bản ghi hỏng không ngăn việc đọc các bản ghi khác.
- Các phiên CLI có thư mục làm việc không xác định hoặc không thể liên kết chắc chắn với một workspace chỉ xuất hiện ở **All projects**. Hai phiên cùng tiêu đề vẫn xuất hiện riêng nếu có định danh khác nhau.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Herdsman MUST cung cấp tab **History** trong panel bên phải thay cho popover lịch sử ở hàng tab phiên. Người dùng có thể duyệt, tìm kiếm và mở phiên bằng chuột hoặc bàn phím. Chọn một phiên giữ History mở và giữ truy vấn cùng phạm vi đang dùng nếu phạm vi đó còn khả dụng.
- **FR-002** — History MUST cung cấp **This workspace** và **All projects**, mặc định là workspace đang chọn nếu có. Phạm vi workspace chỉ hiển thị phiên Herdsman của workspace đó và phiên CLI có liên kết xác định. Phạm vi toàn app gồm phiên Herdsman có lịch sử còn lưu, kể cả trong workspace đã archive, cùng các phiên Claude Code CLI đọc được của người dùng hiện tại.
- **FR-003** — Danh sách MUST sắp xếp từ mới đến cũ theo lần hoạt động gần nhất. Mỗi dòng hiển thị tiêu đề hoặc nhãn thay thế, agent, nguồn và thời điểm hoạt động nếu biết. Trong **All projects**, hiển thị project/workspace hoặc thư mục làm việc nếu biết. Khi xác định hai nguồn cùng chỉ một phiên Claude, MUST hiển thị một dòng và ưu tiên phiên Herdsman đã có khi mở.
- **FR-004** — History MUST tìm trong tiêu đề và nội dung hội thoại có thể xem của cả hai nguồn trong phạm vi đã chọn. Kết quả khớp nội dung phải hiện đoạn trích. Đổi phạm vi giữ truy vấn và xóa truy vấn trả về danh sách duyệt.
- **FR-005** — Chọn dòng MUST mở đúng hội thoại trong vùng làm việc chính, dùng tab tạm cho phiên đã kết thúc và chuyển đến phiên hiện có khi đang chạy. Thao tác xem lại không được tự khởi chạy, tiếp tục hoặc gửi tin cho agent.
- **FR-006** — Herdsman MUST giữ nguyên dữ liệu hội thoại gốc và vòng đời agent khi duyệt, tìm, mở History hoặc đóng app giữa lúc xem lại. Mở lại app cho phép người dùng tìm và đọc các phiên còn lưu.
- **FR-007** — History MUST phân biệt trạng thái đang tải, không có phiên, không có kết quả và lỗi đọc dữ liệu. Lỗi một nguồn hoặc một bản ghi không được làm ẩn những kết quả đã đọc được. Nhãn và thông báo do app cung cấp phải dùng tiếng Anh, còn nội dung hội thoại giữ ngôn ngữ gốc.

### Key Entities *(include if feature involves data)*

- **Mục lịch sử phiên** — Định danh phiên, agent, nguồn, tiêu đề, lần hoạt động gần nhất và project, workspace hoặc thư mục làm việc nếu biết.
- **Hội thoại đã lưu** — Các lượt trao đổi có thể xem lại của một phiên. Một phiên Claude có thể được nhận diện từ cả Herdsman và CLI.
- **Phạm vi và kết quả tìm kiếm** — Workspace đang chọn hoặc toàn app, từ khóa hiện tại, các mục khớp và đoạn trích nếu có.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Ít nhất 9 trong 10 người dùng thử nghiệm mở History, tìm và mở đúng một phiên Herdsman trong 30 giây mà không cần hướng dẫn.
- **SC-002** — Ít nhất 9 trong 10 người dùng thử nghiệm tìm và mở được một phiên Claude Code CLI từ thư mục chưa thêm vào Herdsman trong 60 giây kể từ khi mở History.
- **SC-003** — Tìm theo nội dung trả về kết quả trong dưới 1 giây ở ít nhất 95% lượt đo trên bộ dữ liệu 1.000 phiên có cả hai nguồn.
- **SC-004** — Trong toàn bộ ca nghiệm thu mở lại phiên đang chạy, phiên đã kết thúc và phiên CLI, hội thoại mở đúng, History vẫn hiện, dữ liệu gốc được giữ nguyên và không có tiến trình agent mới.

## Assumptions

- History là một tab trong panel bên phải hiện có. Người dùng đọc hội thoại trong vùng làm việc chính và có thể tiếp tục chọn các phiên từ danh sách.
- Phạm vi phiên ngoài Herdsman giới hạn ở Claude Code CLI có dữ liệu local mà người dùng hiện tại đọc được. Các phiên Codex được Herdsman quản lý vẫn thuộc lịch sử Herdsman.
- Luồng mở hội thoại hiện có là điểm vào để xem lại. Quản lý dữ liệu nguồn, đồng bộ từ xa và thêm thao tác resume riêng trong History nằm ngoài phạm vi.
- Spec [031 · Lịch sử, tìm session và Command Palette](../031-session-history-search/spec.md) tiếp tục mô tả Command Palette. Spec này cập nhật điểm truy cập và trải nghiệm duyệt lịch sử phiên.
