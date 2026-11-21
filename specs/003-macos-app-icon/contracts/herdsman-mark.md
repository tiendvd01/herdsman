# UI Contract: HerdsmanMark và lệnh sinh icon

## `HerdsmanMark` (`src/components/layout/Sidebar.tsx`)

```ts
export function HerdsmanMark(props: { className?: string }): JSX.Element
```

- Render một `<img>` có `src` là URL của `src/assets/herdsman-mark.svg`.
- Trang trí thuần: `alt=""`, `aria-hidden="true"`, không kéo thả được.
- `className` quyết định kích cỡ (sidebar dùng `size-4`).
- Không đổi màu theo theme.

## `pnpm icons`

- Input: `src/assets/herdsman-mark.svg`.
- Output: ghi đè `src-tauri/icons/icon.svg` và bộ icon liệt kê trong [data-model.md](../data-model.md); không để lại thư mục `android/` hay `ios/`.
- Exit code ≠ 0 nếu file gốc thiếu hoặc `tauri icon` lỗi.
- `tauri.conf.json` → `bundle.icon` giữ nguyên danh sách file.
