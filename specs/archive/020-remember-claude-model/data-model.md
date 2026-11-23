# Mô hình dữ liệu

| Đối tượng | Quy tắc |
| --- | --- |
| Lựa chọn Claude toàn app | Chưa có giá trị hoặc chứa mã model do người dùng đổi thành công gần nhất. Giá trị tồn tại qua lần khởi động lại. |
| Model ban đầu của session | Snapshot lựa chọn tại thời điểm tạo hội thoại Claude mới. Session khác, hội thoại cũ và session resume giữ dữ liệu của chúng. |
| Model thực tế | Giá trị agent xác nhận cho session. Khi fallback, bỏ override ban đầu và cập nhật từ model agent thực sự dùng. |
| Trạng thái model kế thừa | Metadata session phân biệt model được áp dụng từ lựa chọn chung với model riêng đã xác nhận hoặc mặc định sau fallback. |

Lựa chọn Claude toàn app chỉ thay đổi khi có thao tác đổi được agent xác nhận.
