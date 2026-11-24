# Data Model

| Entity | Fields | Rules |
|---|---|---|
| File Tree entry | `name`, `path`, `kind` từ listing hiện có | `path` tương đối với project, phân tách bằng slash. Chỉ file được đối chiếu trạng thái. |
| Changed file | `path`, `status` | `path` trong snapshot project tương đối với project. Với snapshot workspace giữ ngữ nghĩa API đang có. So khớp toàn bộ đường dẫn, phân biệt hoa thường theo kết quả Git. |
| Snapshot | Phạm vi project hoặc workspace, danh sách changed file | Cache theo phạm vi và ID. Mỗi snapshot project tạo một map từ path sang status cho cả cây. |
| Status presentation | Nhóm màu, ký hiệu, tên truy cập tiếng Anh | Một phép ánh xạ dùng cho cả hai panel. `??` thuộc nhóm thêm với ký hiệu `U` và nhãn “Untracked”. Mã còn lại giữ nguyên. |
| Material icon | Loại entry, tên file hoặc hậu tố, URL asset | Chỉ truy cập asset trong tập đóng gói. File chưa biết và thư mục có icon mặc định riêng. |

## State transitions

- Khi mở cây và chưa có snapshot, icon và thao tác cây hoạt động với màu mặc định.
- Khi truy vấn thành công, snapshot mới thay toàn bộ trạng thái cũ. File biến mất khỏi snapshot trở về màu mặc định.
- Khi đổi project, cây chỉ dùng snapshot thuộc project mới.
- Khi lần cập nhật gần nhất lỗi, cây tiếp tục hoạt động. Nếu còn snapshot thành công của đúng project thì có thể giữ kết quả đã xác nhận trong khi chờ lần đọc tiếp theo.
