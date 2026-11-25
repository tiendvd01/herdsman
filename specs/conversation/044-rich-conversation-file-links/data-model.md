# Data Model

- **Tham chiếu tệp** có đường dẫn khác rỗng và mã session chứa tin nhắn. Tồn tại khi hiển thị, không ghi ngược vào hội thoại.
- **Tệp đích** có mã project, khóa đường dẫn của tab hiện có và tài liệu văn bản. Đích thực tế phải nằm trong thư mục làm việc của session.
- **Thao tác mở** chuyển từ đọc sang mở hoặc kích hoạt tab khi thành công. Khi thất bại chỉ hiển thị lỗi. Bản nháp của tab đã mở thuộc về tab đó.
