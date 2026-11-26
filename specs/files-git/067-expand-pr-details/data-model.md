# Data Model

- **Detail** — Repository, số PR và tài khoản xác thực xác định phạm vi. SHA hiện tại gắn với snapshot CI.
- **Workflow** — Run ID cùng attempt xác định lần chạy. Job ID và thứ tự bước xác định dữ liệu chi tiết; tên trùng không đại diện cùng job.
- **Review thread** — ID ổn định, tác giả và thời điểm nullable, đường dẫn và vị trí dòng nếu có; phản hồi theo thời gian.
- **Section** — Dữ liệu hoặc lỗi có mã. Chỉ lỗi tạm thời được giữ bản trước của cùng phạm vi; CI còn cần trùng SHA.
