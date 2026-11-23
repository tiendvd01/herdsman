# Dữ liệu hội thoại

| Trường | Quy tắc |
| --- | --- |
| `Session.id` | ID mới cho mỗi lần tạo thành công. |
| `Session.workspace_id` và `Session.engine` | Lấy từ session gửi lệnh. |
| `Session.title` | Tùy chọn. Lưu toàn bộ tên một dòng sau khi bỏ khoảng trắng đầu cuối, kể cả Unicode và tên đã dùng. Giá trị trống được lưu như tên chưa đặt. |
| Lịch sử và trạng thái | Session mới bắt đầu với lịch sử hội thoại trống. Lịch sử, lượt đang chạy và yêu cầu duyệt của session cũ vẫn gắn với ID cũ. |

Tiêu đề do người dùng nhập được lưu ngay khi tạo bản ghi. Session chưa đặt tên tiếp tục dùng prompt đầu tiên theo quy tắc hiện có. Sau khi tạo thành công và mở lại app, session giữ ID, tiêu đề và lịch sử. Lỗi khởi động áp dụng luồng dọn bản ghi tạo thất bại hiện có. Schema SQLite hiện tại đã đủ cho thay đổi này.
