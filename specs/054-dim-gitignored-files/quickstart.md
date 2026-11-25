# Quickstart

Chạy từ thư mục gốc Herdsman.

```sh
pnpm typecheck
pnpm exec vitest run tests/unit/fileTreeSearch.test.tsx tests/unit/gitFiles.test.tsx
cargo test --manifest-path src-tauri/Cargo.toml --lib project_files::tests
```

Để kiểm tra trong ứng dụng desktop, chuẩn bị một repository tạm.

```sh
fixture=$(mktemp -d)
git -C "$fixture" init -q
mkdir -p "$fixture/cache" "$fixture/nested"
touch "$fixture/cache/output.txt" "$fixture/local.log" "$fixture/plain.txt"
touch "$fixture/tracked.log" "$fixture/nested/drop.tmp" "$fixture/nested/keep.tmp"
git -C "$fixture" add tracked.log
printf 'cache/\n*.log\n' > "$fixture/.gitignore"
printf '*.tmp\n!keep.tmp\n' > "$fixture/nested/.gitignore"
printf '%s\n' "$fixture"
```

Mở đường dẫn in ra dưới dạng dự án, vào Files và mở rộng `cache` và `nested`. Kiểm tra bốn mục `cache`, `output.txt`, `local.log` và `drop.tmp` mờ trong cả theme sáng và tối. Kiểm tra `plain.txt`, `tracked.log` và `keep.tmp` hiển thị bình thường. Dùng phím mũi tên và Enter để mở `local.log`. Gỡ quy tắc `*.log`, chuyển sang tab khác rồi quay lại Files để thấy tên `local.log` trở về bình thường. Thêm lại quy tắc và lặp lại để kiểm tra chiều ngược lại.

## Kết quả kiểm chứng

- Build frontend thành công. Vitest đạt 252 test, bao gồm làm mờ, mở tệp bằng bàn phím, mở lại cây và tìm kiếm.
- Nhóm kiểm thử Rust cho Files đạt 8 test. Một phép đo hiệu năng có sẵn được bỏ qua mặc định.
- Bộ Rust có 34 test đạt qua hai lượt. Test terminal cần chạy lại ngoài sandbox để khởi động hc. Hai phép đo hiệu năng có sẵn được bỏ qua mặc định.
- Kiểm tra trực quan và mốc 5 giây trên ứng dụng desktop chưa được đo.
