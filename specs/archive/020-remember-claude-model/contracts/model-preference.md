# Hợp đồng chọn model Claude

- Đổi model thành công qua bộ chọn Claude cập nhật model của session và lựa chọn mặc định. Thất bại trả lỗi hiện hành và giữ mặc định trước đó.
- Tạo hội thoại Claude mới sử dụng mặc định đã lưu từ lượt đầu. Luồng mở hội thoại cũ tiếp tục theo model riêng của hội thoại.
- Tín hiệu `model_not_found` khi chưa có đầu ra thực tế hoặc công cụ ở lượt đầu dùng model kế thừa cho phép một lần thử với mặc định. Sự kiện `model_fallback` đưa model bị từ chối và thông báo tới giao diện. Model thực tế được cập nhật khi agent báo lại.
- Prompt đến trong lúc đang xác định model ban đầu chờ kết quả lượt đầu để giữ thứ tự. Log vẫn có đúng một tin nhắn người dùng cho mỗi lần gửi.
