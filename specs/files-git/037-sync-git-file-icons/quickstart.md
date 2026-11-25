# Quickstart

Chạy từ gốc repo sau khi cài dependency.

```sh
pnpm typecheck
pnpm exec vitest run tests/unit/gitFiles.test.tsx
```

Trong app, đối chiếu icon của `src/main.ts`, `README.md`, `package.json`, `Dockerfile` và file đuôi lạ trong hai panel. Kiểm tra thêm file đã xóa và file đổi tên sang loại khác. Chọn dòng để mở diff bằng chuột và phím Enter, rồi kiểm tra ký hiệu trạng thái ở theme sáng và tối. Xem [UI contract](contracts/git-file-icons.md).
