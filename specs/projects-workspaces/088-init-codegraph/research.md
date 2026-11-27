# Research

- Cấu hình Herdr App cục bộ, spec 026 và `lib/codegraph.js`, cho thấy luồng Index trong Project Settings đọc `status --json`, chạy `init` hoặc `sync`, và bỏ qua index qua Git exclude cục bộ.
- CLI đã cài hỗ trợ `init --yes`, `sync` và dữ liệu `fileCount`, `nodeCount`, `lastIndexed`. Smoke trên Git fixture xác nhận init không sửa các tệp tracked của fixture.
- `git rev-parse --git-path info/exclude` phân giải file dùng chung với linked worktree. `check-ignore` kiểm tra hiệu lực quy tắc.
- Dùng terminal hc với argv cố định để lượt indexing tiếp tục nếu app đóng. Truy vấn ngắn chạy qua CLI cố định để lấy metadata.
