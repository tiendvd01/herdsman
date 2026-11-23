# Nghiệm thu ghi nhớ model Claude

1. Chạy `pnpm typecheck`, `pnpm test --maxWorkers=2`, `cargo test --manifest-path src-tauri/Cargo.toml --locked` và `node --test sidecar/test/*.contract.test.mjs`.
2. Trong Claude đã cấu hình, đổi model ở một session. Tạo session qua New Session, workspace mới trong project khác và `/clear`. Xác nhận từng lượt đầu dùng model vừa chọn.
3. Mở lại Herdsman rồi tạo session Claude. Đổi lựa chọn ở một session khác và đối chiếu model riêng của các session đã tạo hoặc tiếp tục.
4. Trong môi trường kiểm thử, mô phỏng Claude trả `model_not_found`, sau đó trả lời bằng model mặc định. Kiểm tra thông báo, chỉ một tin nhắn người dùng trong giao diện và lựa chọn chung vẫn được giữ. Mô phỏng lỗi kết nối để xác nhận ứng dụng giữ lựa chọn cũ.
