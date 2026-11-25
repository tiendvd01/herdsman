# Research — Navigation Reordering

- Dùng Pointer Events để thao tác nội bộ trong WebView và tránh phụ thuộc luồng kéo thả file của cửa sổ Tauri. Tái sử dụng nút hiện có làm điểm kéo và điều khiển bàn phím.
- Dùng localStorage cho tùy chọn giao diện theo phạm vi. Cách này giữ việc sắp xếp độc lập với dữ liệu project, workspace và runtime trong SQLite.
- Dùng một thứ tự tab chung để thứ tự hiển thị, điều hướng bàn phím và chọn tab kế tiếp sau khi đóng nhất quán.
