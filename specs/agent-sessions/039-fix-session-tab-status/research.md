# Research

`src-tauri/src/agent.rs` phân loại terminal thoát với mã 0 hoặc bị kill là `done`. Sự kiện này có thể đến trước khi lệnh đóng trả về. Tab đọc trạng thái trực tiếp và ánh xạ `done` thành xanh.

Quyết định giữ quy ước trạng thái terminal hiện tại để lịch sử và resume tiếp tục dùng cùng dữ liệu. Dùng spinner trung tính của ứng dụng trên đúng tab đang đóng và giữ tab hiển thị đến khi có kết quả. Chỉ đổi màu `Done` sẽ làm mất ý nghĩa hoàn thành trên các tab bình thường.

Để báo hoàn thành tự nhiên, dùng `idle` kèm `turn_complete` trên kênh trạng thái sẵn có. Cách này cho phép tab báo `Done` mà không ảnh hưởng đến việc giữ tab mở và nhận prompt.
