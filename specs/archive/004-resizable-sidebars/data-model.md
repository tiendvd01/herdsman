# Data Model: Kéo đổi độ rộng hai sidebar

Không có dữ liệu ở backend/SQLite. Chỉ là tuỳ chọn giao diện lưu trong store `useUiStore` (persist `herdsman-ui`, localStorage).

## Trường mới / đổi trong `useUiStore`

| Trường | Kiểu | Mặc định | Persist | Ghi chú |
|---|---|---|---|---|
| `sidebarWidth` | number (px) | 256 | có | Độ rộng lưu của sidebar trái, luôn trong [200, 480] |
| `rightWidth` | number (px) | 340 | có | Độ rộng lưu của side panel phải, luôn trong [280, 720]. Thay `rightWide` |
| ~~`rightWide`~~ | boolean | — | — | Bỏ; migrate sang `rightWidth` |

Action: `setSidebarWidth(px)`, `setRightWidth(px)` — luôn làm tròn và kẹp vào [min, max] trước khi lưu.

## Hằng số (`src/lib/layout.ts`)

| Tên | Giá trị |
|---|---|
| `LEFT` | `{ min: 200, max: 480, def: 256 }` |
| `RIGHT` | `{ min: 280, max: 720, def: 340, wide: 560 }` |
| `MAIN_MIN` | 400 |
| `KEY_STEP` | 16 |

## Quy tắc

- **Đọc dữ liệu lưu**: giá trị không phải số hữu hạn → mặc định; ngoài giới hạn → kẹp (edge case dữ liệu hỏng).
- **Độ rộng hiển thị** = `layoutWidths(...)` (research R5): không đổi giá trị lưu.
- **Migration persist v0 → v1**: `rightWidth = rightWide ? 560 : 340`, `sidebarWidth = 256`, xoá `rightWide`.
- Thu gọn/đóng sidebar không đụng tới độ rộng lưu (FR-006).
