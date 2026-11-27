# Research

## Khám phá skill theo workspace

Đọc `.agents/skills` trước `.claude/skills` tại thư mục làm việc của session. So sánh đường dẫn đã phân giải và giữ một mục theo tên. Link hợp lệ trong workspace dùng được cùng tài nguyên đi kèm. Link đi ra ngoài thư mục làm việc không thuộc catalog local của feature này. Cách này tránh lấy nhầm bản skill từ thư mục chính khi đang ở worktree.

Dùng tên và mô tả do Codex đọc từ front matter. Probe với bản cài 0.172.0 xác nhận liên kết nội bộ có thể được trả về dưới đường dẫn đích trong `.claude/skills`. Xếp ưu tiên dựa trên thư mục phát hiện đã phân giải.

## Gọi skill trong Codex

Schema sinh từ Codex CLI 0.172.0 xác nhận `skills/list` nhận `cwds` và `forceReload`. `turn/start` chấp nhận đầu vào skill gồm tên và đường dẫn. Chọn qua cấu trúc này chỉ có hiệu lực khi engine đã biết đường dẫn. [Mã nguồn chọn skill của Codex 0.172.0](https://github.com/openai/codex/blob/rust-v0.172.0/codex-rs/skills/src/selection.rs)

Dùng `skills/extraRoots/set` để đăng ký từng thư mục skill trong `.claude/skills` riêng cho từng tiến trình App Server. Probe xác nhận Codex theo liên kết ra ngoài khi đăng ký thư mục cha. Đăng ký từng thư mục đã xác thực giữ đúng phạm vi và vẫn nhận skill chỉ có trong `.claude/skills`. Codex gọi bằng đường dẫn đã đăng ký. [Schema extra roots](https://github.com/openai/codex/blob/rust-v0.172.0/codex-rs/app-server-protocol/src/protocol/v2/plugin.rs#L16-L44)

## Giữ đường gửi và quyền hiện có

Composer dùng API danh sách lệnh rồi gửi lời nhắn dạng văn bản như trước. Adapter phân giải tiền tố `/name` hoặc `$name` tại lúc chạy. Session tiếp tục dùng socket, lịch sử và chính sách duyệt của lượt Codex hiện có.
