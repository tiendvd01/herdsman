# Data Model

- **Chế độ xem** nhận List hoặc Tree, bắt đầu ở List mỗi lần chạy.
- **File thay đổi** có đường dẫn tương đối và trạng thái Git lấy từ danh sách workspace. Đường dẫn đầy đủ trong workspace định danh dòng và diff.
- **Thư mục** có tên và các mục con. Mỗi cấp chỉ có một thư mục cho mỗi thành phần tên. Thư mục chỉ tồn tại khi có file thay đổi bên dưới và bắt đầu ở trạng thái mở. Trạng thái gắn với cây của workspace hiện tại.
