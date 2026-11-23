# Data Model

- Một `user_message` chứa danh sách ảnh theo thứ tự gửi. Mỗi ảnh có `media_type` và có thể có `attachment_id` (32 ký tự hex).
- Mỗi ảnh đã lưu thuộc một session. Xóa session dùng cơ chế dọn thư mục hiện có.
- Ảnh bản nháp dùng nguồn ảnh cục bộ và không tạo tệp lịch sử cho tới khi gửi.
- Ảnh có thể đang tải, sẵn sàng hoặc không khả dụng. Event cũ thiếu mã tham chiếu vào thẳng trạng thái không khả dụng.
