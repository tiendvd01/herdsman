# UI Contract — Đóng session

| Điều kiện | Kết quả |
| --- | --- |
| Xác nhận đóng tab session duy nhất | Trở về project và giữ khả năng mở lại workspace |
| Session đang chạy hoặc chờ duyệt | Cảnh báo việc dừng agent trước khi xác nhận |
| Còn tab sau khi đóng | Giữ workspace, lấy tab tiếp theo hoặc trước đó nếu tab đang xem bị đóng |
| Hủy hoặc đóng thất bại | Giữ tab và workspace. Hiển thị lỗi khi thao tác thất bại |
| Đã điều hướng sang workspace khác | Giữ lựa chọn hiện tại |
