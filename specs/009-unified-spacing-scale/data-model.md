# Data Model: Thống nhất bộ khoảng cách

Không có dữ liệu lưu trữ. Các "thực thể" là hằng số trong code (`src/lib/spacing.ts`).

## SpacingStep

| Field | Kiểu | Mô tả |
|-------|------|-------|
| `step` | string | bậc Tailwind: `'0.5' \| '1' \| '1.5' \| '2' \| '3' \| '4' \| '6' \| '8'` |
| `px` | number | giá trị ở zoom 100% (`step × 4`) |
| `role` | string | vai trò gợi ý (xem research D1) |

Ràng buộc: tối đa 8 bậc (FR-001); `0` luôn được phép (reset) và không tính là bậc.

## SpacingException

| Field | Kiểu | Mô tả |
|-------|------|-------|
| `file` | string | đường dẫn tương đối từ gốc repo |
| `token` | string | token nguyên văn, ví dụ `ml-[15px]` |
| `reason` | string | lý do bắt buộc, không rỗng |

Ràng buộc: mỗi ngoại lệ khớp đúng một cặp file + token; ngoại lệ không còn được dùng trong file làm test thất bại (tránh danh sách cũ mục).

## Quy tắc căn hàng (AlignmentRule — chỉ là tài liệu)

- R1: nút hành động cuối hàng trong cùng cột → cùng mép phải, cùng kích thước nút (`icon-sm` trong sidebar).
- R2: mỗi cấp thụt lề = một bậc trong bộ (ngoại lệ: đường cây căn theo tâm icon).
- R3: header của sidebar trái, vùng giữa, side panel phải cao 56px (`h-14` / `min-h-14`).
- R4: nút chỉ hiện khi hover/focus dùng `opacity` hoặc `absolute` để không đẩy nút khác.
