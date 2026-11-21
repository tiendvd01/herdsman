# UI Contract: Settings

## Điểm vào
| Cách | Kết quả |
|------|---------|
| Nút `aria-label="Settings"` ở footer sidebar | mở dialog |
| ⌘, (Ctrl+, ngoài macOS) | mở dialog |
| Command palette → "Open settings" | mở dialog |
| ⌘⇧L / "Toggle theme" | xoay theme System → Light → Dark (giữ nguyên) |

## Dialog
- `role="dialog"`, tiêu đề "Settings"; nav có mục "Appearance" (`aria-current="page"`).
- Theme: `role="radiogroup" aria-label="Theme"` với 3 `role="radio"`: System, Light, Dark.
- Interface font: nút chọn `aria-label="Interface font"`; Code font: `aria-label="Code font"`; mở popover có ô `Search …` và `role="listbox"` gồm các `role="option"` (aria-selected), mỗi mục hiển thị bằng chính font đó. Mũi tên lên/xuống di chuyển, Enter trong ô tìm chọn kết quả đầu.
- Backend: lệnh Tauri `font_families` → `string[]` (tên family, đã sắp xếp; rỗng ngoài macOS).
- Nút "Reset" chỉ hiện khi font khác mặc định.
- Đóng: Esc, nút Close, bấm overlay.

## Không còn
- Nút `aria-label^="Change theme"` ở header.
