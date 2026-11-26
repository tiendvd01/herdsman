# Data Model: Tinh chỉnh giao diện Pull Requests

| Đối tượng | Trường và quy tắc |
| --- | --- |
| Phạm vi | Project cụ thể hoặc `All projects`, chế độ xem trong bốn tab hiện có và lựa chọn tài khoản GitHub. |
| PR | Định danh bằng project, repository và số PR trong UI. `headRefName` và `updatedAt` là chuỗi tùy chọn, snapshot cũ thiếu hai trường vẫn hợp lệ. Nhánh đích dùng `baseRefName` hiện có. |
| Chi tiết | Mục tiêu chứa project, repository, số PR và tài khoản thực tế từ snapshot. Mục tiêu chỉ hợp lệ trong phạm vi có quyền. Mở từ hàng lưu vị trí cuộn và hàng để khôi phục focus. |
| Thông báo | Định danh theo repository và event key. Bộ đếm trong tab lấy giao của thông báo chưa xem và phạm vi project. Bộ đếm thanh điều hướng dùng tất cả project đủ điều kiện. |

Đổi project hoặc tab đóng chi tiết. Đổi quyền hoặc tài khoản loại mục tiêu ngoài quyền truy cập. Khi làm mới với lỗi mạng tạm thời, dữ liệu cũ vẫn thuộc cùng lựa chọn tài khoản và có thông báo trạng thái.
