# Research

## Phân loại theo Git

- **Decision** — Gửi tên các mục của từng thư mục đang duyệt cho `git check-ignore -z --stdin`, phân tách bằng NUL. Thêm tiền tố `./` để tên bắt đầu bằng dấu hai chấm được đọc như tên tệp.
- **Rationale** — Git xử lý quy tắc phân cấp, ngoại lệ và mục đang được theo dõi. Xử lý theo thư mục giới hạn công việc ở các mục đang tải.
- **Alternatives considered** — Tự phân tích mẫu sẽ phải tái hiện ngữ nghĩa Git. Quét toàn bộ repository làm thêm việc với các thư mục chưa mở.

## Hiển thị và cập nhật

- **Decision** — Dùng token `text-muted-foreground` cho tên và tải lại dữ liệu khi cây được gắn lại.
- **Rationale** — Token có sẵn cho cả hai theme. Tải lại khi mở bảo đảm thay đổi quy tắc được đọc ngay cả khi cache còn mới.
- **Alternatives considered** — Theo dõi thay đổi quy tắc thời gian thực đòi hỏi thêm cơ chế theo dõi ngoài phạm vi.
