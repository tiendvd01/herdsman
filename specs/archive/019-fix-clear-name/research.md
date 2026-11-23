# Nghiên cứu `/clear [name]`

## Nhận diện lệnh trong composer

- **Quyết định** — Kiểm tra nội dung một dòng trong `Composer.send` trước `onNeedResume` và `api.sessionPrompt`. Bổ sung mục `/clear [name]` kể cả khi danh sách do engine trả về thiếu `/clear`. Gộp mục trùng theo tên lệnh.
- **Lý do** — Composer hiện chuyển nguyên nội dung cho `session_prompt`. `/clear` trong danh sách dự phòng hiện chỉ là gợi ý. Xử lý tại composer cho phép cùng một hành vi trên Claude, Codex và Echo.
- **Phương án đã cân nhắc** — Chuyển lệnh cho từng engine sẽ phụ thuộc vào cách nhận đối số của engine và khó đồng bộ việc mở session mới trong giao diện.

## Lưu tên khi tạo

- **Quyết định** — Thêm `title` tùy chọn vào `session_create` và truyền giá trị vào thao tác ghi session ban đầu. Dùng cùng luồng tạo sidecar và dọn bản ghi khi khởi động thất bại.
- **Lý do** — `Session.title` đã tồn tại. `session_prompt` chỉ lấy tiêu đề từ prompt đầu tiên nếu trường này chưa có giá trị. Các nơi tạo session hiện tại tiếp tục bỏ qua tên và dùng quy tắc mặc định.
- **Phương án đã cân nhắc** — Đổi tên bằng lệnh gọi thứ hai tạo khoảng thời gian session đã được tạo mà tên chưa được lưu, khiến lỗi hoặc việc đóng app giữa hai bước khó phục hồi.

## Chuyển session sau khi tạo

- **Quyết định** — Đưa session mới vào cache trước khi chọn. Tái sử dụng luồng đã có trong `src/lib/actions.ts` và cho composer nhận được kết quả thất bại. Dọn draft của session gốc sau thành công và giữ draft khi lỗi.
- **Lý do** — WorkspaceView có thể tự chọn tab khác nếu ID vừa chọn chưa có trong cache. Composer phải nhận được kết quả thật để giữ đúng nội dung có thể thử lại.
- **Phương án đã cân nhắc** — Chỉ chờ truy vấn tải lại trước khi chuyển tab tạo thêm một phụ thuộc mạng nội bộ giữa hai bước và kéo dài thời gian phản hồi.
