# Nghiên cứu

- **Quyết định** — Ghi lựa chọn từ thao tác đổi model được xác nhận và cập nhật cùng model của session. Model engine báo qua sự kiện chỉ cập nhật session. Dùng chung lại bảng settings. Ghi theo mọi sự kiện model sẽ biến lần khởi tạo hoặc phát lại lịch sử thành lựa chọn người dùng.
- **Quyết định** — Ghi model ban đầu cùng lúc tạo session mới ở hai lối vào backend. `/clear` đã đi qua lối tạo session thông thường. Mở lịch sử và resume dùng dữ liệu riêng đã có. Đọc lại thiết lập toàn app lúc gửi prompt sẽ làm lựa chọn của session thay đổi sau khi tạo.
- **Quyết định** — Truyền snapshot vào tùy chọn model của Claude Agent SDK trước lượt đầu. Dùng lỗi có cấu trúc `model_not_found` của SDK để chuyển sang mặc định một lần trước khi có đầu ra hoặc công cụ. Danh sách gợi ý model có thể thiếu mã vẫn dùng được, nên không dùng sự vắng mặt làm bằng chứng từ chối.
