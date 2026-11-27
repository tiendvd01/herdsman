# Data Model

- **Thẻ công cụ** — Dùng loại công cụ và `input.file_path` từ dữ liệu hội thoại. Thẻ Read và Write có đường dẫn kiểu chuỗi, khác rỗng, nhận điều khiển mở tệp.
- **Đích mở** — ID session và đường dẫn gốc. Bộ mở tệp của session kiểm tra đích trong workspace và xác định tab tương ứng.
- **Trạng thái giao diện** — Thu gọn và mở rộng thuộc về thẻ. Lần mở thành công chọn tab tệp. Lần mở thất bại báo lỗi tại hội thoại.
