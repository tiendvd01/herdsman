# Quickstart

## Chuẩn bị

Cần Git, dependency của repo đã cài và toolchain Tauri. Chạy từ thư mục gốc Herdsman.

```sh
pnpm typecheck
pnpm exec vitest run tests/unit/gitFiles.test.tsx
cargo test --manifest-path src-tauri/Cargo.toml git::tests
pnpm tauri dev
```

Chuẩn bị repo thử riêng với file TypeScript, Markdown, JSON, một đuôi lạ và hai thư mục có file trùng tên. Commit trạng thái ban đầu. Tạo một workspace dùng project và một workspace dùng worktree riêng.

## Xác nhận theo giao diện

1. Mở File Tree. Kiểm tra năm loại entry theo SC-001, mở file và đóng/mở thư mục bằng bàn phím.
2. Sửa file đã track, tạo file chưa track và stage file mới khác. Xóa một file đã track, dùng `git mv` để đổi tên một file khác và tạo một xung đột bằng merge hai nhánh cùng sửa một dòng. Làm mới Git Changes và đối chiếu màu, ký hiệu chữ không viền ở mép phải (`M` cho file sửa, `U` cho file chưa track) với [UI contract](contracts/file-status.md). Chỉ kiểm tra các entry còn hiện diện khi đối chiếu File Tree.
3. Trở một file về trạng thái sạch, làm mới và mở File Tree. Màu và ký hiệu biến mất. Với hai file trùng tên, chỉ file có đúng đường dẫn được tô.
4. Sửa một file chỉ trong worktree riêng. Git Changes của workspace đó hiển thị thay đổi. File Tree của project giữ màu mặc định cho file sạch cùng đường dẫn.
5. Đăng ký thư mục con của repo làm project và xác nhận file thay đổi trong thư mục con được tô đúng. Thử thêm một thư mục ngoài Git để kiểm tra icon và thao tác cây.
6. Lặp kiểm tra chọn dòng, hover, focus và đọc trạng thái qua ký hiệu trong theme sáng và tối. Mở diff và file để xác nhận các thao tác hiện tại.
