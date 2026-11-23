# Research

- **Decision** — Ghi từng ảnh dưới dạng base64 trong thư mục session và chỉ phát mã tham chiếu trong event. **Rationale** — Khôi phục được sau khi mở lại ứng dụng, giữ log và payload replay nhỏ. **Alternative** — Base64 trực tiếp trong log làm tăng kích thước mỗi lần đọc và phát lại.
- **Decision** — Dùng lại Radix Dialog và danh sách ảo. **Rationale** — Escape và focus theo hành vi chung, chỉ tải ảnh ở các hàng đang hiển thị. **Alternative** — Cửa sổ riêng sẽ đưa người dùng ra khỏi ngữ cảnh hội thoại.
