# Data Model: Light theme — Paper style

## Thiết lập giao diện (trong `useUiStore`, persist cục bộ)

| Field | Kiểu | Mặc định | Ghi chú |
|-------|------|----------|---------|
| `theme` | `'system' \| 'light' \| 'dark'` | `'system'` | đã có, không đổi |
| `lightStyle` | `'default' \| 'paper'` | `'default'` | mới; chỉ có tác dụng khi Light hiệu lực |

**Validation**: khi khôi phục từ storage, `lightStyle` không thuộc tập giá trị → `'default'`.

**Giá trị suy ra (không lưu)**: `effectiveDark = theme==='dark' || (theme==='system' && macOS dark)`; `paperActive = !effectiveDark && lightStyle==='paper'`.

## Trạng thái giao diện trên `<html>`

| effectiveDark | lightStyle | class trên `<html>` |
|---|---|---|
| true | bất kỳ | `dark` |
| false | default | (không có) |
| false | paper | `paper` |

Chuyển trạng thái: đổi `theme`, đổi `lightStyle`, hoặc macOS đổi appearance (khi System) → tính lại bảng trên.
