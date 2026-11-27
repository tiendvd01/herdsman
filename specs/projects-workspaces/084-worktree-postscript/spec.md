# Feature Specification — Worktree Postscript

**Feature Branch** — `master`

**Created** — 2026-11-27

**Status** — Draft

**Input** — “Làm chức năng worktree postscript tham khảo herdr-app”

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Tự động chuẩn bị worktree mới (P1)

Developer lưu một lệnh chuẩn bị trong cài đặt project để mỗi worktree mới có sẵn môi trường làm việc, ví dụ các tệp cấu hình phát triển được tạo từ mẫu.

**Giá trị** — Bỏ bước chạy lệnh thủ công sau mỗi lần checkout.

**Kiểm thử độc lập** — Lưu lệnh tạo tệp đánh dấu, tạo một worktree từ branch mới và một worktree từ branch local có sẵn. Kiểm tra mỗi thư mục mới có đúng một dấu chạy.

1. **Given** project có postscript, **When** Herdsman tạo thành công workspace với một checkout mới từ một trong hai loại branch, **Then** postscript tự khởi chạy một lần trong thư mục worktree mới và kết quả hiện ở workspace đó.
2. **Given** project có postscript, **When** tạo workspace dùng thư mục project, mở lại workspace, khôi phục app hoặc tạo thêm session, **Then** không có lượt chạy mới.
3. **Given** bước tạo checkout hoặc workspace thất bại, **When** Herdsman báo lỗi tạo workspace, **Then** postscript chưa được chạy.

### User Story 2 — Quản lý lệnh theo project (P2)

Developer xem, lưu, sửa hoặc xoá lệnh trong cài đặt của từng project Git.

**Giá trị** — Mỗi project có bước chuẩn bị riêng và người dùng quyết định lệnh nào được chạy.

**Kiểm thử độc lập** — Cấu hình hai project với lệnh khác nhau, mở lại app, kiểm tra giá trị từng project rồi xoá lệnh ở một project và tạo worktree ở cả hai.

1. **Given** hai project có lệnh riêng, **When** lưu và mở lại app, **Then** mỗi project hiển thị và dùng đúng lệnh đã lưu của mình.
2. **Given** người dùng sửa hoặc xoá lệnh, **When** lưu và tạo worktree tiếp theo, **Then** Herdsman dùng lệnh mới hoặc bỏ qua bước chuẩn bị nếu giá trị trống.
3. **Given** repository chứa tệp đề xuất lệnh nhưng người dùng chưa lưu postscript, **When** tạo worktree, **Then** không có lệnh postscript nào được chạy.

### User Story 3 — Theo dõi kết quả chuẩn bị (P2)

Developer biết postscript đang chạy, đã thành công, thất bại hay bị gián đoạn để quyết định bước tiếp theo.

**Giá trị** — Có thể chẩn đoán lỗi và tiếp tục làm việc với checkout đã tạo.

**Kiểm thử độc lập** — Dùng một lệnh chạy chậm rồi thoát lỗi kèm thông báo. Kiểm tra trạng thái, đầu ra và khả năng tiếp tục mở workspace.

1. **Given** postscript đang chạy, **When** mở workspace, **Then** người dùng thấy trạng thái đang chạy và vẫn có thể sử dụng workspace.
2. **Given** postscript không thể khởi chạy hoặc kết thúc lỗi, **When** xem kết quả, **Then** người dùng thấy lỗi khởi chạy hoặc mã thoát cùng đầu ra có sẵn, và vẫn có thể dùng checkout để xử lý thủ công.
3. **Given** app đóng trong lúc postscript đang chạy, **When** mở lại workspace, **Then** người dùng thấy trạng thái mới nhất xác định được, hoặc trạng thái gián đoạn nếu không xác định được kết quả. Herdsman không tự chạy lại.
4. **Given** postscript kết thúc thành công, **When** quay lại workspace, **Then** người dùng thấy kết quả thành công và có thể xem đầu ra của lượt chạy.

### Edge Cases

- Giá trị chỉ có khoảng trắng được xử lý như cấu hình trống.
- Hai worktree được tạo gần nhau nhận hai lượt chạy và kết quả riêng theo từng workspace.
- Nếu người dùng yêu cầu xoá checkout khi postscript đang chạy, Herdsman giữ checkout và báo chờ lệnh kết thúc.
- Lệnh đã chọn cho lượt chạy giữ nguyên nếu người dùng sửa cài đặt trong khi lượt đó đang chạy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Herdsman MUST cho người dùng xem, lưu, sửa và xoá một postscript trong cài đặt của mỗi project Git. Giá trị MUST được giữ qua lần mở lại app.
- **FR-002** — Herdsman MUST dùng lệnh do người dùng lưu cho project. Cấu hình trống mặc định bỏ qua postscript, kể cả khi checkout chứa tệp cấu hình lệnh.
- **FR-003** — Herdsman MUST tự khởi chạy postscript đúng một lần cho mỗi workspace mà Herdsman vừa tạo thành công cùng checkout mới, áp dụng cho cả branch mới và branch local có sẵn.
- **FR-004** — Thư mục làm việc ban đầu của postscript MUST là thư mục worktree mới. Mỗi lượt chạy MUST dùng lệnh đã lưu khi bắt đầu lượt đó và gắn kết quả với đúng workspace.
- **FR-005** — Herdsman MUST bỏ qua postscript khi tạo checkout hoặc workspace thất bại, khi dùng thư mục project, khi mở hoặc khôi phục workspace có sẵn, và khi tạo thêm session.
- **FR-006** — Người dùng MUST xem được trạng thái đang chạy, thành công, thất bại hoặc gián đoạn và đầu ra có sẵn trong workspace. Lỗi khởi chạy và mã thoát khác 0 MUST được hiển thị khi xác định được.
- **FR-007** — Workspace MUST sử dụng được trong khi postscript chạy và sau khi postscript thất bại. Herdsman MUST giữ checkout và workspace đã tạo trong cả hai trường hợp.
- **FR-008** — Khi mở lại app, Herdsman MUST hiển thị trạng thái mới nhất xác định được hoặc báo gián đoạn nếu kết quả chưa xác định được. Việc mở lại MUST không phát sinh lượt chạy thay thế.

### Key Entities *(include if feature involves data)*

- **Worktree Postscript** — Lệnh chuẩn bị tuỳ chọn do người dùng lưu cho một project Git.
- **Lượt chạy postscript** — Lần chuẩn bị gắn với một workspace worktree mới, có trạng thái và đầu ra để chẩn đoán.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Trong 10 lần tạo worktree thành công có cấu hình, gồm cả hai cách chọn branch, cả 10 worktree nhận đúng một lượt chuẩn bị trong thư mục tương ứng mà người dùng không cần thao tác thêm.
- **SC-002** — Với lệnh thử mất 30 giây, người dùng có thể mở workspace và thấy trạng thái chuẩn bị trong vòng 2 giây sau khi workspace xuất hiện.
- **SC-003** — Trong cả ba tình huống thử nghiệm lệnh không khởi chạy được, lệnh trả lỗi và app đóng giữa lượt chạy, người dùng xem được trạng thái tương ứng, vẫn mở được checkout và không phát sinh lượt chạy lại tự động.
- **SC-004** — Ít nhất 4 trong 5 người dùng thử có thể lưu lệnh, tạo worktree và tìm kết quả chuẩn bị ngay lần đầu mà không cần hướng dẫn trực tiếp.

## Assumptions

- Postscript là một bước chuẩn bị tuỳ chọn sau khi tạo checkout mới. Bản đầu dùng cấu hình cục bộ theo project và cho phép người dùng xử lý thủ công khi lệnh thất bại.
- Phạm vi gồm worktree cục bộ mới do Herdsman tạo. Chạy lại từ giao diện, chia sẻ cấu hình qua repository và chuẩn bị worktree từ xa nằm ngoài phạm vi.
- Herdr App là tham chiếu cho luồng tạo worktree và phân biệt checkout mới với checkout có sẵn. Hành vi postscript ở trên là quyết định của spec vì bản mã nguồn công khai được kiểm tra chưa xác nhận tính năng này. [Herdr App tại bản được đối chiếu](https://github.com/herdrdev/herdr-app/blob/1180a5cec3b8bd4dfebf4a9b217ab8cb59a96ffa/defaults/AGENTS.md)
