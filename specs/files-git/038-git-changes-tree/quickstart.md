# Quickstart

1. Chạy `pnpm exec vitest run tests/unit/gitFiles.test.tsx` và `pnpm typecheck`.
2. Trong một workspace, tạo thay đổi cho file gốc, hai file trùng tên ở các cấp thư mục khác nhau, một file đã xóa và một file đổi tên.
3. Mở Git Changes. Đối chiếu số file, icon và trạng thái trong List và Tree với [hợp đồng giao diện](contracts/git-changes-tree.md). Mở diff của từng file trùng tên.
4. Dùng Tab và Enter để bật Tree, thu gọn rồi mở lại thư mục và chọn một file. Đổi về List và kiểm tra dấu chọn diff.
5. Làm mới với file thêm hoặc bỏ, đổi tab rồi đổi workspace. Kiểm tra lựa chọn chế độ, cây và số file theo [đặc tả](spec.md). Kiểm tra các nút và dấu chọn trong theme sáng và tối.
