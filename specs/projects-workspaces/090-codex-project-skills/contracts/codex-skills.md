# Contract: Gọi skill local của Codex

- `list_commands` trả về tên và mô tả của từng skill khả dụng, đánh dấu `builtin: false`, cùng với lệnh compact của Codex. Composer tìm được skill khi gõ `/name` hoặc `$name`. Chọn mục chèn `$name`.
- `prompt` chấp nhận `/name [yêu cầu]` hoặc `$name [yêu cầu]` ở đầu lượt. Với tên skill local hợp lệ, cả hai dạng chọn cùng định nghĩa. Tệp đính kèm và phần yêu cầu tiếp tục theo lượt.
- Adapter đăng ký từng thư mục skill hợp lệ trong `.claude/skills` qua `skills/extraRoots/set` trên App Server riêng của session và đối chiếu `skills/list` theo cwd. Skill khả dụng được gửi dưới dạng `UserInput::Skill`. Codex đọc định nghĩa từ tệp gốc.
- Nếu nguồn của tên đã được gợi ý không còn khả dụng, session báo lỗi bằng tiếng Anh có tên và lý do. Tin nhắn thường, các lệnh hiện có và hoạt động của engine khác giữ luồng hiện có.
