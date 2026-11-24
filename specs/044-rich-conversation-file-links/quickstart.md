# Quickstart

1. Chạy `pnpm tauri dev`. Mở một project local và một workspace có worktree riêng với tệp cùng tên nhưng nội dung khác project.
2. Tạo tin nhắn có đường dẫn tương đối dạng văn bản, đường dẫn tuyệt đối trong mã nội dòng, đường dẫn chứa khoảng trắng và liên kết Markdown đến tệp. Bấm hoặc dùng Tab/Enter và xác nhận tệp đúng worktree.
3. Quay lại hội thoại, mở lại tệp đã có tab. Thử trường hợp tệp project có bản nháp và xác nhận bản nháp còn nguyên. Mở lại session từ lịch sử và thử liên kết cũ.
4. Thử `close/minimize/maximize`, đường dẫn chưa tồn tại, thư mục và đích bên ngoài workspace. Xác nhận chúng hiển thị dạng văn bản. Xóa tệp sau khi liên kết đã hiện, bấm vào liên kết và xác nhận thông báo lỗi tiếng Anh, vị trí đọc và tab được giữ. So sánh URL web và khối mã giữa theme sáng và tối.
5. Đóng rồi mở lại app khi agent đang chạy. Kiểm tra agent tiếp tục làm việc và liên kết vẫn hoạt động khi session được khôi phục.
6. Đo 20 lần mở tệp đọc được dưới 100 KB và ghi nhận thao tác ở lần thử đầu của 5 người dùng theo SC-002 và SC-004.
7. Chạy `pnpm test`, `pnpm typecheck` và `cargo test --manifest-path src-tauri/Cargo.toml`.

## Kết quả kiểm tra

- Bản build production thành công. Vitest chạy 232 bài kiểm thử, gồm nhận diện đường dẫn, cách ly Markdown preview, giữ bản nháp và không đổi tab khi đọc thất bại.
- Cargo chạy 30 bài kiểm thử thành công, gồm đọc trong worktree, loại đích ngoài workspace và luồng khôi phục session hiện có. Hai benchmark có sẵn được đánh dấu bỏ qua.
- Chromium với backend mô phỏng mở được liên kết bằng Enter trong theme sáng và tối. Cả 20 lượt mở dưới 2 giây, tab được dùng lại, và tham chiếu tệp thiếu giữ nguyên dạng văn bản.
- Còn cần đo SC-002 trên desktop với tệp thật và thực hiện thử nghiệm người dùng của SC-004.
