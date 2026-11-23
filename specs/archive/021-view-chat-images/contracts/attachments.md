# Chat attachment contract

- Socket protocol v1 vẫn nhận `prompt.images` gồm `media_type` và `data_b64`. `user_message.images` có thêm trường tùy chọn `attachment_id` và giữ nguyên thứ tự. Replay trả về các mã đã phát.
- `session_image(id, attachmentId)` trả base64 của ảnh từ session đã biết. Mã không hợp lệ bị từ chối. Ảnh thiếu hoặc hỏng hiển thị trạng thái không khả dụng.
- Bấm hình thu nhỏ mở đúng ảnh. Escape hoặc nút Close đóng khung. Nút Remove của bản nháp chỉ gỡ ảnh.
