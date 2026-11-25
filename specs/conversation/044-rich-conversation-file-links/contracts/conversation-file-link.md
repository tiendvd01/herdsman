# Conversation File Link

- Kích hoạt bằng chuột hoặc Enter. Chỉ đọc tệp tại thời điểm kích hoạt.
- `session_file_exists` kiểm tra tệp trong thư mục làm việc của session, chỉ trả về có hay không. Trong lúc kiểm tra hoặc khi không xác nhận được, tham chiếu giữ nguyên định dạng.
- `session_file_read` nhận `sessionId` và `path`, trả về `projectId`, `path` dùng cho tab và `document` gồm `text` và `writable`.
- Tệp trong thư mục project dùng khóa tương đối của Files. Tệp trong worktree riêng dùng khóa tuyệt đối và chế độ đọc của tab cho đường dẫn tuyệt đối.
- Khi đọc thất bại, hiện lỗi tiếng Anh trong giao diện và giữ tab hiện tại.
