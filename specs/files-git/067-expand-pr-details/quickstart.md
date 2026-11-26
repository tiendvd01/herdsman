# Quickstart

1. Chạy `pnpm test`, `pnpm build` và `cargo test --manifest-path src-tauri/Cargo.toml --lib`.
2. Mở một PR có Markdown, một review có nội dung và thread đã/chưa giải quyết. Đọc nội dung bằng bàn phím.
3. Thử workflow với hai job song song, một bước lỗi, sau đó chạy lại workflow. Kiểm tra tên từng bước, attempt và trạng thái hiện hành khi dữ liệu đổi.
4. Đổi PR hoặc tài khoản trong lúc tải. Kiểm tra nội dung cũ biến mất. Thử mở CI ở theme sáng và tối và xác nhận nhãn vẫn đọc được khi bỏ màu.

## Kết quả xác minh

- Build thành công. Vitest đạt 293 bài và Rust đạt 54 bài, với 4 bài Rust được đánh dấu ignored.
- Playwright xác minh thao tác bàn phím, workflow có hai job, thread có phản hồi, mô tả Markdown và focus khi quay lại ở 960 × 600 theme sáng và 1280 × 800 theme tối. Dữ liệu trình duyệt và GitHub CLI dùng mẫu mô phỏng.
- SC-001 cần đo với người dùng. Mục tiêu cập nhật với GitHub thực cần đo khi mở PR đang chạy CI.
