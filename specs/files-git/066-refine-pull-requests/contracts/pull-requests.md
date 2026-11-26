# Pull Requests UI and Snapshot Contract

- Sidebar chọn project hoặc `All projects`. Tab giữ phạm vi và nằm ngoài vùng cuộn. Đổi project giữ tab, đổi tab giữ project.
- Hàng PR mở chi tiết chỉ đọc. `Open on GitHub` gọi `pull_request_open` với repository và số PR. `Back to list` trả về tab phù hợp và khôi phục vị trí nếu mở từ hàng.
- Mở thông báo chọn project đích, rồi dùng `pull_requests_read` với tài khoản, repository và event key. Nếu PR đã rời danh sách, mở GitHub khi còn quyền truy cập.
- `pull_requests_refresh` giữ shape hiện có. `headRefName` và `updatedAt` là chuỗi tùy chọn, snapshot cũ thiếu hai trường vẫn hợp lệ.
- Lỗi `offline` toàn màn cho phép hiển thị lại snapshot của cùng tài khoản đã chọn, kèm cảnh báo. Lỗi quyền hoặc xác thực ẩn nội dung và chỉ số không còn hợp lệ.
