# Contract: Zoom và cỡ chữ (UI)

## Phím tắt (macOS; ngoài macOS ⌘ → Ctrl, ⌥ → Alt)

| Phím | `e.code` | Hành động |
|---|---|---|
| ⌘= / ⌘+ | `Equal` (có/không Shift), `NumpadAdd` | Phóng to một bậc |
| ⌘− | `Minus`, `NumpadSubtract` | Thu nhỏ một bậc |
| ⌘0 | `Digit0`, `Numpad0` | Zoom về 100% |
| ⌥⌘= | `Equal` + Alt | Tăng cỡ chữ nội dung |
| ⌥⌘− | `Minus` + Alt | Giảm cỡ chữ nội dung |
| ⌥⌘0 | `Digit0` + Alt | Đặt lại cỡ chữ |

- Listener `keydown` ở capture phase; khớp thì `preventDefault()` + `stopPropagation()` (không chèn ký tự, không tới terminal/ô nhập).
- Cho phép `repeat`. Bỏ qua khi có modifier thừa (Ctrl trên macOS).
- Không trùng với 007 (⌘B, ⌘R) hay ⌘K/⌘N/⌘T/⌘O/⌘⇧L.

## Event từ menu (Tauri → frontend)

- Tên: `ui-zoom`; payload: `"in" | "out" | "reset"`.
- Nguồn: menu View → Zoom In (`CmdOrCtrl+=`), Zoom Out (`CmdOrCtrl+-`), Actual Size (`CmdOrCtrl+0`).

## Lệnh command palette

| Nhãn | Phím hiện kèm | Ghi chú |
|---|---|---|
| Zoom in (`N%`) | ⌘= | |
| Zoom out (`N%`) | ⌘− | |
| Reset zoom | ⌘0 | |
| Increase text size (`Npx`) | ⌥⌘= | |
| Decrease text size (`Npx`) | ⌥⌘− | |
| Reset text size | ⌥⌘0 | |

Nhãn theo ngôn ngữ UI hiện tại của app (tiếng Anh). Gõ "zoom", "font", "text" đều ra các lệnh.

## Biến CSS

- `--content-step`: độ lệch cỡ chữ nội dung (px), đặt inline trên `<html>`.
- `.text-content` = `calc(13px + var(--content-step))`; `.text-content-code` = `calc(12px + var(--content-step))`.
