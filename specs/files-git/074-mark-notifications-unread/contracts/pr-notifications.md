# Pull Request Notification Contract

`pull_requests_set_read` nhận tài khoản, trạng thái đọc đích và các khóa sự kiện nhóm theo repository. Lệnh lưu các mục khớp trong một giao dịch. Mục đã biến mất được bỏ qua. Giao diện chỉ cập nhật trạng thái đọc sau khi lệnh thành công và cho phép thử lại khi có lỗi.

Overview và Notifications cùng hiển thị `Mark all as read` và `Mark all as unread` cạnh tiêu đề thông báo. Nút vô hiệu hóa khi mọi mục trong phạm vi đã có trạng thái đích hoặc yêu cầu đang chạy.
