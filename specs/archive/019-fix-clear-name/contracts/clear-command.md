# Hợp đồng `/clear [name]`

| Nội dung một dòng trong composer | Kết quả |
| --- | --- |
| `/clear` hoặc chỉ có khoảng trắng sau lệnh | Mở session mới với quy tắc đặt tên mặc định. |
| `/clear   Tổng hợp lỗi   ` | Mở session mới có tên “Tổng hợp lỗi”. |
| `/clearance` hoặc lệnh khác | Đi theo luồng gửi hiện có. |

Lệnh phân biệt hoa thường và chỉ khớp token chính xác `/clear`, ngăn với tên bằng khoảng trắng. Nội dung nhiều dòng và nội dung có ảnh đính kèm đi theo luồng chat thông thường để người dùng giữ đầy đủ nội dung đã soạn. Menu lệnh hiển thị đúng một mục `/clear [name]`; chọn mục này điền `/clear ` và đưa con trỏ về composer.

Composer gọi `session_create` với `workspaceId`, `engine` và `title` tùy chọn. Kết quả là `Session` mới với tiêu đề đã lưu nếu có. Khi báo lỗi, composer giữ nội dung đã nhập và session đang xem. Lệnh hợp lệ không được chuyển thành prompt của session gốc.
