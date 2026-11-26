# Quickstart: Tinh chỉnh giao diện Pull Requests

## Kiểm tra tự động

Từ thư mục gốc chạy `pnpm test`, `pnpm build` và `cargo test --manifest-path src-tauri/Cargo.toml pull_requests`.

## Kiểm tra giao diện

1. Chạy `pnpm tauri dev` với GitHub CLI đã đăng nhập và hai project có PR trong Herdsman.
2. Mở Pull Requests. Dùng bàn phím chuyển tab và project. Kiểm tra số đếm, nhãn trạng thái, trạng thái trống và tiêu đề dài trong theme sáng và tối.
3. Cuộn xuống một PR. Mở chi tiết, kiểm tra nhánh và trạng thái, rồi chọn `Back to list`. Focus và vị trí bài đang đọc phải trở về hàng đó. Mở lại và kiểm tra `Open on GitHub`.
4. Mở thông báo ở project khác. Kiểm tra project đích, đúng số PR và số chưa xem giảm. Dùng PR trùng số ở hai repo để kiểm tra đích.
5. Ngắt kết nối rồi làm mới dữ liệu đã tải. Kiểm tra ghi chú dữ liệu cũ. Đổi tài khoản và kiểm tra nội dung cũ biến mất.
6. Dùng trình duyệt với dữ liệu mô phỏng ở 900 × 600 và 1280 × 800 để kiểm tra chiều ngang và thao tác bàn phím. Dùng kích thước tối thiểu 960 px khi kiểm tra cửa sổ desktop.

## Kết quả xác minh

- `pnpm test` đạt 291 bài kiểm thử và `pnpm build` thành công.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib` đạt 53 bài. Bốn bài mang cờ `ignored`.
- Playwright dùng dữ liệu mô phỏng với 30 PR để xác minh thứ tự Tab, khôi phục focus và vị trí cuộn, và chiều ngang ở cả hai kích thước và hai theme. SC-001 cần đo với nhóm người dùng.
