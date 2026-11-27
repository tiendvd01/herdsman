# Xác minh sau khi triển khai

1. Trên macOS có Rust, Node và pnpm, chạy `pnpm install`, `pnpm typecheck`, `pnpm test` và `pnpm tauri dev` từ gốc repo.
2. Mở project dưới thư mục cá nhân. Yêu cầu agent dùng Write với đường dẫn tuyệt đối có dấu cách. Kiểm tra tiêu đề bắt đầu bằng `~/`, cả khi thu hẹp cửa sổ. So sánh với đường dẫn project trong Command Palette.
3. Mở lại phiên. Kiểm tra nhãn Write và nội dung diff, bao gồm một dòng mã chứa nguyên đường dẫn tuyệt đối. Chỉ nhãn tệp được rút gọn.
4. Từ hai liên kết tới hai tệp trùng tên trong hai worktree khác nhau, mở từng tệp và đối chiếu nội dung đặc trưng của từng worktree.
5. Đối chiếu kết quả test của hàm định dạng với từng dòng trong [hợp đồng](contracts/path-label.md), bao gồm home chưa sẵn sàng. Kiểm tra khi home được trả về, nhãn đang hiển thị cập nhật ngay.
