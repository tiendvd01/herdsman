# Data Model

- **Search query** gồm project ID và chuỗi nhập. Bỏ khoảng trắng hai đầu. Chuỗi rỗng chuyển về chế độ duyệt. Khi đổi project, truy vấn được khởi tạo lại.
- **File match** dùng kiểu hàng file hiện có với tên, đường dẫn tương đối duy nhất trong project và `directory: false`.
- Các trạng thái là duyệt, đang tìm, có kết quả, rỗng và lỗi. Thử lại giữ truy vấn hiện tại. Trạng thái mở thư mục và tab được quản lý độc lập với tìm kiếm.
