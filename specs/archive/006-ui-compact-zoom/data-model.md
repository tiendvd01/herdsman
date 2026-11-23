# Data Model: Giao diện gọn hơn và zoom chữ / giao diện

Chỉ có tuỳ chọn giao diện cục bộ, lưu trong `useUiStore` (persist key `herdsman-ui`, localStorage).

## UiState — field mới

| Field | Kiểu | Mặc định | Ràng buộc |
|---|---|---|---|
| `zoom` | number | `1` | Một trong `ZOOM_STEPS = [0.8, 0.9, 1, 1.1, 1.2, 1.35, 1.5]`; giá trị khác → bậc gần nhất; không phải số hữu hạn → `1` |
| `contentStep` | number (nguyên) | `0` | `-2 … 4`; làm tròn rồi kẹp; không phải số → `0` |

Hành động: `zoomIn()`, `zoomOut()`, `zoomReset()`, `contentBigger()`, `contentSmaller()`, `contentReset()`. Tại giới hạn, hành động không đổi state (chỉ báo vẫn hiện, kèm nhãn giới hạn).

## Migration

- Persist version 1 → 2: thêm `zoom = 1`, `contentStep = 0`. `merge` luôn đi qua `clampZoom` / `clampContentStep` (giống cách 004 kẹp độ rộng).

## Giá trị dẫn xuất

- Cỡ chữ nội dung hiệu dụng = `(13 + contentStep) × zoom` px (thân), `(12 + contentStep) × zoom` px (code).
- Viewport CSS khi zoom gốc = `innerWidth` (đã chia theo zoom) → `layoutWidths` của 004 dùng trực tiếp.
