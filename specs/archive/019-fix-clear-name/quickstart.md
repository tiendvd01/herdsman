# Nghiệm thu `/clear [name]`

Chuẩn bị các phụ thuộc của repo, Rust, Node.js và `hc`. Cấu hình Claude và Codex để kiểm tra trên cả hai engine. Có thể dùng Echo trong môi trường kiểm thử để xác nhận luồng tạo session mà không cần tài khoản.

```bash
pnpm test
pnpm typecheck
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri dev
```

Chạy hồi quy hợp đồng sidecar bằng `node --test sidecar/test/*.contract.test.mjs` từ thư mục gốc sau khi đã cài phụ thuộc của sidecar.

1. Trong một workspace đã có lịch sử, gửi `/clear Sửa bộ lọc`. Kiểm tra một session mới, cùng engine, đúng tên và không có nội dung hội thoại cũ. Gửi tin nhắn đầu tiên. Tên phải vẫn là “Sửa bộ lọc”. Mở lại session gốc để đọc lịch sử.
2. Lặp lại với tên một từ, tên trùng, tên có khoảng trắng hai đầu, `/clear` và `/clear   `. Chọn lệnh từ menu một lần. Gửi `/clearance` và kiểm tra luồng gửi tin nhắn thông thường.
3. Gửi `/clear Kiểm tra song song` khi session gốc đang làm việc hoặc chờ duyệt. Kiểm tra lượt chạy và yêu cầu duyệt trong session gốc. Tin nhắn đầu tiên ở session mới phải dùng ngữ cảnh mới.
4. Đóng app ngay sau khi tạo xong, sau đó mở lại. Kiểm tra đúng một session mới với đúng tên và lịch sử cũ còn đọc được. Đóng app khi một lần tạo khác đang xử lý rồi mở lại và xác nhận session gốc vẫn hoạt động. Nếu lần tạo đã hoàn tất, session mới phải có đúng tên.
5. Trong môi trường kiểm thử, mô phỏng lỗi khởi động session. Xác nhận có thông báo lỗi, session cũ đang mở và lệnh vẫn trong composer. Bỏ lỗi mô phỏng, gửi lại và kiểm tra chỉ có một session mới được tạo thành công.
