# Feature Specification: Project, workspace và worktree

## User Scenarios & Testing

Thêm project, tạo workspace có worktree riêng, đổi tên rồi archive và mở lại từ lịch sử.

## Requirements

### Functional Requirements

- **FR-001** Project gắn với thư mục local duy nhất, cho phép thêm, đổi tên và xoá. Khi xoá, liệt kê session và background task đang chạy trong hộp xác nhận, dừng chúng trước khi bỏ project. Giữ thư mục và transcript gốc.
- **FR-002** Sidebar liệt kê Project → Workspace. Mỗi workspace mới có một session trống. Người dùng có thể để trống tên và chọn thư mục project hoặc worktree từ một base branch. Các session dùng chung thư mục làm việc của workspace. Worktree có branch và checkout riêng.
- **FR-003** Với workspace hoặc session chưa được đặt tên trong Herdsman, ưu tiên tiêu đề người dùng đặt trong Claude, sau đó tiêu đề Claude tóm tắt, rồi đến “New workspace” hoặc “New session”.
- **FR-004** Menu workspace ở sidebar và header dùng chung luồng Rename, Archive và Delete. Nút menu ở sidebar hiện khi hover, focus và lúc mở, có nhãn chứa tên workspace, và việc mở menu giữ nguyên mục đang chọn.
- **FR-005** Archive ẩn workspace và giữ lịch sử để tìm, mở lại. Delete bỏ workspace và session khỏi app, giữ thư mục project và transcript engine. Cả hai thao tác phải xác nhận và dừng session đang chạy trước khi ẩn mục. Với worktree, có tùy chọn xoá và xác nhận riêng nếu có thay đổi chưa commit. Xem [vòng đời agent](../029-agent-sessions/spec.md).
- **FR-006** Đổi tên, archive và delete cập nhật ngay sidebar, header và tìm kiếm. Khi bỏ workspace đang mở, trở về màn hình chọn workspace của project; thao tác trên workspace khác giữ nguyên màn hình.

## Success Criteria

- **SC-001** Developer tạo xong workspace (để trống tên) và gửi prompt đầu tiên trong dưới 30 giây; workspace tự hiển thị tiêu đề khi Claude cung cấp.
- **SC-002** Hai workspace dùng worktree trong cùng project chạy song song, 0 lần thay đổi file đè lên nhau.

## Nguồn lịch sử

- [001-herdsman-use-cases](../archive/001-herdsman-use-cases/spec.md)
- [002-sidebar-workspace-remove](../archive/002-sidebar-workspace-remove/spec.md)
