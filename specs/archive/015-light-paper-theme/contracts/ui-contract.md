# UI Contract: Light style

**Vị trí**: Settings → Appearance, hàng mới ngay dưới "Theme".

- Nhãn: `Light style`; gợi ý: "Applies when the theme is Light."
- Điều khiển: `role="radiogroup"` `aria-label="Light style"` với hai `role="radio"`: **Default**, **Paper** (cùng kiểu với ThemePicker).
- Chọn → hiệu lực ngay, lưu ngay. Khi Dark đang hiệu lực: vẫn chọn được, hàng hiện gợi ý "Shown when the theme is Light" (không đổi màu app).
- Phím tắt ⌘⇧L: không đổi (System → Light → Dark).
- Class trên `<html>`: `paper` khi Light + Paper; `dark` khi Dark; không bao giờ cả hai.
- Token: `.paper` ghi đè các biến màu của `:root` trong `globals.css`; token trạng thái (`--st-*`) phải ≥ 4.5:1 trên `--background` Paper.
