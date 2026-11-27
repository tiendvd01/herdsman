# Rà soát luồng đọc thư mục

- **Files và tìm kiếm đường dẫn** — Cùng đọc thư mục bằng `project_files::read_entries`. Thư mục bắt đầu bằng dấu chấm được liệt kê và tìm kiếm, ngoại trừ metadata `.git`. Cây Files đánh dấu mục bị Git ignore. Ô tìm kiếm hiện chỉ định tuyến đường dẫn bắt đầu bằng `/` sang luồng mở ngoài project. Chuẩn hóa `~/` trước khi tìm.
- **Liên kết hội thoại** — Read và Write đã gọi bộ mở tệp theo workspace. Ảnh hiển thị thẻ Edit, vốn chưa hiện liên kết. Thẻ Edit có một đường dẫn tệp nên dùng cùng hành động.
- **Lịch sử Claude** — Đọc project dưới `CLAUDE_CONFIG_DIR` hoặc `~/.claude/projects`, chọn transcript JSONL và ghi nhận lỗi đọc trong tìm kiếm.
- **Skills** — Rà các nguồn project, worktree và cấu hình cá nhân, gồm `.claude/skills`. Bộ khám phá bỏ tên thư mục skill trực tiếp bắt đầu bằng dấu chấm. Luồng kiểm tra thư mục trống và sao chép skill đọc các entry riêng theo mục đích của từng thao tác.
- **Theme tùy chỉnh** — Đọc tệp JSON ở thư mục theme. Lọc theo định dạng tệp, còn lọc theo dấu chấm trong Settings áp dụng cho tên font.
- **Sidecar** — Các engine khám phá công cụ theo cơ chế của engine. Cây Files của Herdsman đọc qua backend Rust.
