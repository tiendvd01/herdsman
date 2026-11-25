# Research

- **Decision** — Lấy trạng thái checkout từ trường worktreepath của mỗi branch local. **Rationale** — Danh sách base branch vẫn gồm cả branch đang checkout, còn Existing branch có thể chỉ cho chọn branch rảnh. **Alternative** — Chỉ kiểm tra branch hiện tại, khi đó sẽ bỏ sót các linked worktree.
- **Decision** — Checkout branch bằng tên local với chế độ không tự suy đoán remote. **Rationale** — Git áp dụng quy tắc checkout, kể cả khi trạng thái thay đổi trước lúc tạo. **Alternative** — Checkout commit trực tiếp sẽ làm mất liên kết HEAD với branch.

- **Decision** — Một ô Branch với gợi ý theo giao diện app và dùng thanh cuộn mảnh chung. Nếu tên chưa có, backend phân giải nhánh mặc định từ branch local tương ứng với origin/HEAD, rồi main, master và cuối cùng là branch hiện tại nếu xác định được. **Rationale** — Có thể chọn hoặc nhập tên ở cùng một chỗ và backend kiểm tra lại tại thời điểm tạo.
