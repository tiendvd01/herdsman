# Quyết định thiết kế

- **Liệt kê qua Codex.** Giao thức do Codex CLI cục bộ sinh ra xác nhận có bộ lọc tài khoản, nguồn, thư mục và phân trang. Codex trả lần cập nhật theo giây. Toàn app dùng danh sách toàn cục để thấy thư mục ngoài Herdsman. Đọc trực tiếp định dạng lưu transcript sẽ làm tính năng phụ thuộc vào cấu trúc nội bộ của Codex.
- **Xem lại bằng yêu cầu đọc.** Dùng `thread/read` để lấy lời nhắn đã lưu qua kết nối metadata. Xác nhận định danh còn xuất hiện trong danh sách CLI của tài khoản trước khi đọc. Bản xem phục vụ cả phiên còn hoạt động và thư mục đã di chuyển.
- **Gộp theo engine và định danh.** Các phiên liên kết giữ vị trí Herdsman. Phiên CLI độc lập được lọc theo đường dẫn, kể cả đường dẫn tương đương qua symlink. Tìm tên và phần xem trước từ danh sách đã tải giúp tránh thăm dò cho mỗi truy vấn.
