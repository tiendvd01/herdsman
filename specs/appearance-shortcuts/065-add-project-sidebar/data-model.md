# Data Model

- **Project** gồm ID, tên và đường dẫn đã đăng ký. ID xác định duy nhất một mục. Khi trùng tên, hiển thị thêm đường dẫn.
- **Thứ tự** lấy từ Projects, bỏ qua ID đã gỡ và thêm project mới theo thứ tự nguồn.
- **Phạm vi Pull Requests** là một ID hợp lệ hoặc `All projects`. Mở thông báo có thể đặt ID đích. ID thiếu hoặc bị gỡ chuyển về `All projects`.
- **Phạm vi Skills** là một ID hợp lệ hoặc chưa có project. Lần đầu ưu tiên project workspace hợp lệ, sau đó dùng mục đầu tiên nếu cần. UI tải nội dung và gửi thay đổi theo ID đang chọn.
