# Data Model

## Skill local

- `name` — Tên do Codex xác thực và dùng để gọi skill. Tên phân biệt hoa thường.
- `description` — Mô tả bắt buộc, là chuỗi có nội dung.
- `path` — Đường dẫn tuyệt đối của `SKILL.md` sau khi phân giải. Tệp phải tồn tại, đọc được và nằm trong workspace.
- `source` — `.agents/skills` hoặc `.claude/skills`. Nguồn đầu tiên được ưu tiên nếu tên trùng.

## Workspace

Thư mục làm việc của session là phạm vi khám phá. Mỗi session nhận danh sách từ chính workspace của nó. Không có migration hoặc cấu hình mới trên đĩa.
