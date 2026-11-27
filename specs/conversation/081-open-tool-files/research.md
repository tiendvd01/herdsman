# Research

- **Mở tệp** — Dùng callback `openFile` trong `MessageList`, vốn gọi `openSessionFile` và báo lỗi. Đi trực tiếp qua API đọc tệp cần lặp lại xử lý session, tab và lỗi.
- **Tiêu đề thẻ** — Đặt liên kết cạnh nút thu gọn. `ToolCard` hiện đặt đường dẫn bên trong nút thu gọn, nên cần tách hai phần tử để mỗi phần tử nhận focus và thao tác riêng.
- **Đường dẫn** — Dùng `file_path` gốc để điều hướng. Nhãn qua `usePathLabel` có thể chứa dấu ~ hoặc bị cắt khi thiếu chỗ.
