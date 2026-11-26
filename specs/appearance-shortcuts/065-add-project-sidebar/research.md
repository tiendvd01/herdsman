# Research

| Decision | Rationale | Alternatives considered |
| --- | --- | --- |
| Đặt một component sidebar tại AppShell | AppShell sở hữu thanh điều hướng và bố cục màn hình | Đặt sidebar riêng trong từng màn sẽ lặp bố cục |
| Dùng Button hiện có và `aria-current` | Hỗ trợ Tab, Enter và Space theo hành vi nút chuẩn | Listbox đòi hỏi thêm điều hướng và quản lý focus |
| Dùng lựa chọn PR hiện có và state Skills tại AppShell | Đồng bộ điều hướng từ thông báo và giữ phạm vi từng màn | Dùng chung lựa chọn workspace sẽ thay đổi project làm việc |
| Đọc thứ tự điều hướng đã lưu | Hiển thị cùng thứ tự với Projects kể cả sau khi người dùng sắp xếp | Cài hook kéo thả vào sidebar chọn project làm phát sinh hành vi ngoài phạm vi |
