# Quickstart

1. Mở app với một project đã có commit và tạo branch local khả dụng bằng `git branch workspace-check`.
2. Mở New workspace, dùng ô Branch để chọn `workspace-check`. Nhấn Create workspace. Kiểm tra branch, nội dung file và session trống, rồi xác nhận checkout chính giữ nguyên.
3. Mở lại hộp thoại. Xác nhận branch trên vắng mặt trong gợi ý và gõ tên branch sẽ hiện lỗi. Xoá worktree bằng lifecycle hiện có và kiểm tra branch xuất hiện lại như lựa chọn khả dụng.
4. Chọn một branch rảnh, checkout nó ở nơi khác, rồi xác nhận hộp thoại báo lỗi và giữ tên workspace. Thử lại bằng tên branch khác hoặc Project folder.
5. Nhập một tên branch mới và kiểm tra worktree bắt đầu từ nhánh mặc định khi project đang checkout branch khác.
6. Chạy `pnpm typecheck`, `pnpm test` và `cargo test --manifest-path src-tauri/Cargo.toml`.

## Kết quả kiểm thử

- TypeScript typecheck và 235 bài kiểm thử frontend đều đạt.
- Cargo có 32 bài đạt và 2 phép đo hiệu năng được đánh dấu chạy riêng.
- Browser preview xác nhận có thể chọn branch rảnh, tên branch đang checkout bị chặn và tên mới dùng nhánh mặc định.
- Git test trên repository tạm xác nhận đúng commit, giữ checkout chính, từ chối branch không khả dụng và giữ lại branch sau khi gỡ worktree.
- Việc đo mốc 30 giây với người dùng nằm trong bước xác nhận thủ công.
