# UI Contract: phím tắt sidebar (`src/lib/sidebarShortcuts.ts`)

```ts
type SidebarSide = 'left' | 'right';

interface ShortcutCtx { isMac: boolean; dialogOpen: boolean }

/** Trả cột cần ẩn/hiện, hoặc null nếu phím không phải phím tắt sidebar. */
function matchSidebarShortcut(e: Pick<KeyboardEvent, 'key' | 'code' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'repeat'>, ctx: ShortcutCtx): SidebarSide | null;

/** Gắn listener keydown (capture) lên window; trả hàm gỡ. */
function installSidebarShortcuts(): () => void;

const SHORTCUT_LABEL: Record<SidebarSide, string>; // '⌘B' / '⌘R' trên macOS, 'Ctrl+B' / 'Ctrl+R' nơi khác
```

| Đầu vào | Kết quả |
|---|---|
| ⌘B (mac) / Ctrl+B | `'left'` |
| ⌘R (mac) / Ctrl+R | `'right'` |
| kèm Shift hoặc Alt, hoặc sai modifier | `null` |
| `repeat === true` | `null` |
| `dialogOpen` | `null` |

Nhận phím theo `e.code` (`KeyB`, `KeyR`) để không phụ thuộc bố cục bàn phím, và theo `e.key` khi `code` trống.

Khi khớp: `preventDefault()`, `stopPropagation()`, đổi `sidebarOpen` / `rightOpen`, rồi chuyển focus theo research R5.
