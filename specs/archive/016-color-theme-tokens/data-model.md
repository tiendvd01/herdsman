# Data Model: Bộ mã màu theo tên

## ThemeFile (JSON, mỗi theme một file)

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|--------|------|----------|-----------|
| `name` | string | không | 1–40 ký tự; mặc định = tên file bỏ `.json`; MUST NOT trùng `light`/`paper`/`dark` |
| `appearance` | `"light" \| "dark"` | không | mặc định suy từ độ sáng `background` (< 0.5 → dark) |
| `background` | `#rrggbb` | **có** | đúng 6 chữ số hex |
| `foreground` | `#rrggbb` | **có** | đúng 6 chữ số hex |
| `selection` | `#rrggbb` | không | mặc định mix(background, foreground, 15%) |
| `ansi` | 16 × `#rrggbb` | không | đúng 16 phần tử nếu có; dùng để suy ra trạng thái |
| `colors` | `{ [roleKey]: #rrggbb }` | không | khóa MUST thuộc sổ vai trò; khóa lạ → cảnh báo (không lỗi); giá trị sai định dạng → lỗi theme |

Dung lượng file ≤ 256 KB. Không hỗ trợ alpha, **trừ riêng vai trò `scrim`** nhận `#rrggbbaa` (8 chữ số hex) vì lớp phủ cần độ mờ khác nhau theo theme (Light 0.5, Dark 0.7); `scrim` ở dạng `#rrggbb` thì dùng độ mờ mặc định 0.5.

## ColorRole (sổ vai trò, trong mã)

| Trường | Ý nghĩa |
|--------|---------|
| `key` | tên trong `colors` (snake_case) |
| `cssVar` | biến CSS tương ứng, ví dụ `--muted-foreground` |
| `derive(base)` | quy tắc suy ra khi theme không khai báo |
| `tailwind` | true nếu cần `--color-<name>` (để sinh `theme-roles.css`) |

### Vai trò hiện có (đều có ở mọi theme)

`background`, `foreground`, `surface`, `muted`, `muted_foreground`, `border`, `input`, `ring`, `primary`, `primary_foreground`, `accent`, `accent_foreground`, `destructive`, `code`, `working`, `blocked`, `error`, `done`, `idle`, `warn_bg`, `warn_fg`, `warn_border`, `warn_icon`, `danger_bg`, `diff_add`, `diff_del`, `diff_add_fg`, `diff_del_fg`, `term_bg`, `term_fg`, `scrim`, `scrollbar_thumb`, `scrollbar_thumb_hover`, `term_scrollbar_thumb`, `term_scrollbar_thumb_hover` (thanh cuộn trong vùng Log luôn tối).

### Alias tham chiếu Herdr (chỉ để đối chiếu, không dùng làm khóa)

| Herdr | Herdsman |
|-------|----------|
| `surface` (card) | `background` |
| `chrome`, `canvas` | `surface` |
| `raised` | `muted` |
| `hover` | `accent` |
| `selected` | `accent` (cùng màu hover hiện nay) |
| `muted` (chữ) | `muted_foreground` |
| `dim` | `ring` |
| `solid` / `solid_foreground` | `primary` / `primary_foreground` |
| `working`/`blocked`/`done`/`idle` | cùng tên; `error` là vai trò riêng của Herdsman |

## ResolvedTheme (suy ra lúc chạy, không lưu)

`{ id, name, appearance, source: 'builtin'|'custom', colors: Record<roleKey, hex> }` — `colors` luôn đủ mọi vai trò (khai báo thắng suy ra).

## ThemeCatalog

`{ themes: ResolvedTheme[], errors: { file, field?, message }[], warnings: { file, message }[] }`; id = tên file (bỏ `.json`) với built-in `light|paper|dark`. Trùng id với built-in → file custom bị bỏ qua + lỗi.

## Lựa chọn (trong `useUiStore`, key `herdsman-ui`, version 4)

| Field | Kiểu | Mặc định | Ghi chú |
|-------|------|----------|---------|
| `theme` | `system \| light \| dark` | `system` | chế độ, không đổi |
| `lightTheme` | string (id) | `light` | phải có `appearance=light`; không hợp lệ → `light` |
| `darkTheme` | string (id) | `dark` | phải có `appearance=dark`; không hợp lệ → `dark` |

Bỏ field `lightStyle`; migrate v3→v4: `lightStyle==='paper'` → `lightTheme='paper'`.

Chuyển trạng thái: đổi `theme`, `lightTheme`, `darkTheme`, macOS đổi giao diện (System), hoặc catalog đổi (nạp lại thư mục) → chọn theme hiệu lực → `apply`.
