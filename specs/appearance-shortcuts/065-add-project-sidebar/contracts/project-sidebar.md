# Project Sidebar UI Contract

- Hai màn hiển thị toolbar, sidebar `Select project`, rồi vùng nội dung chính.
- Mỗi project có một nút. Mục hiện tại có `aria-current="true"`. Nút dùng Tab rồi Enter hoặc Space và tự cuộn vào vùng hiển thị khi nhận focus.
- Chỉ Pull Requests có mục `All projects`. Thao tác đổi project giữ chế độ xem PR và phạm vi workspace. Điều hướng từ thông báo cập nhật mục hiện tại.
- Sidebar phân biệt đang tải, lỗi tải project và danh sách trống. Với lỗi tải nội dung, các mục project vẫn chọn được.
