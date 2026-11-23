# UI Contract: Spacing scale

Hợp đồng giữa người viết giao diện và bước kiểm tra tự động.

## Module `src/lib/spacing.ts`

```ts
export const SPACING_STEPS: readonly { step: string; px: number; role: string }[];
export const SPACING_EXCEPTIONS: readonly { file: string; token: string; reason: string }[];
export function isAllowedSpacing(value: string): boolean; // value là phần sau tiền tố, ví dụ '2.5', '[3px]', 'px'
```

- `isAllowedSpacing('0')` → `true`; bậc trong `SPACING_STEPS` → `true`; mọi thứ khác (kể cả `px`, `auto` không áp dụng cho padding/gap, giá trị `[...]`) → `false`. `auto` chỉ hợp lệ cho margin, test xử lý riêng.

## Token được kiểm tra

Tiền tố (có thể có dấu `-` phía trước và tiền tố variant `xxx:`):
`p px py pt pr pb pl ps pe m mx my mt mr mb ml ms me gap gap-x gap-y space-x space-y`

Không kiểm tra: `top/left/right/bottom/inset` (vị trí), `h/w/size/min-*/max-*` (kích thước), CSS trong `globals.css`.

## Kết quả kiểm tra

- Qua: mọi token hợp lệ hoặc nằm trong `SPACING_EXCEPTIONS`.
- Lỗi: in danh sách `path:line token`; thêm lỗi riêng cho ngoại lệ không còn được dùng.
