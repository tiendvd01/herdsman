# Data Model: Nút mở rộng ô chat

Không có dữ liệu bền.

## Trạng thái giao diện

| Tên | Kiểu | Mặc định | Ghi chú |
|-----|------|----------|---------|
| `expanded` | boolean | `false` | Trong `Composer`; reset khi đổi `session.id` |

## Chuyển trạng thái

- `false → true`: bấm nút Expand.
- `true → false`: bấm nút Collapse · Esc (không có danh sách `/`) · gửi tin thành công · đổi session.
- Gửi lỗi: giữ nguyên.
