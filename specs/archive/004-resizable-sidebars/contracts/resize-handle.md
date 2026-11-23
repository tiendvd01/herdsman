# UI Contract: `ResizeHandle` và bố cục AppShell

## `ResizeHandle` (`src/components/layout/ResizeHandle.tsx`)

```ts
interface ResizeHandleProps {
  side: 'left' | 'right';   // mép nằm ở cạnh nào của vùng giữa: 'left' = cạnh phải sidebar trái
  label: string;            // aria-label
  value: number;            // độ rộng đang hiển thị
  min: number;
  max: number;              // max hiệu lực (đã trừ chỗ cho vùng giữa)
  onChange: (px: number) => void;
  onReset: () => void;      // nhấp đúp / Enter
}
```

Hành vi bắt buộc:

| Đầu vào | Kết quả |
|---|---|
| hover / focus | con trỏ `col-resize`, vạch mép đổi màu |
| pointerdown + move | `onChange(start + dx)` (side `'right'`: `start - dx`), kẹp [min, max], tối đa 1 lần/frame |
| pointerup / pointercancel / lostpointercapture | kết thúc kéo, gỡ class kéo khỏi `<body>` |
| dblclick, Enter | `onReset()` |
| ArrowLeft / ArrowRight | ∓/± 16px (đảo chiều với side `'right'`) |
| Home / End | min / max |

DOM: `role="separator"`, `aria-orientation="vertical"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `tabIndex=0`, **không** có `data-tauri-drag-region`. Nằm `absolute` đè lên border của `<aside>` (vùng bắt chuột ~8px, không chiếm chỗ trong bố cục).

## `layoutWidths` (`src/lib/layout.ts`)

```ts
layoutWidths(input: { left: number; right: number; leftOpen: boolean; rightOpen: boolean; viewport: number })
  : { left: number; right: number; leftMax: number; rightMax: number }
```

- Thiếu chỗ cho `MAIN_MIN`: co `right` trước (tới `RIGHT.min`), rồi `left` (tới `LEFT.min`).
- `leftMax` / `rightMax` = max của sidebar đó mà vẫn chừa `MAIN_MIN` (không dưới min).
- Sidebar đóng tính là 0px.

## Thay đổi ở component hiện có

- `Sidebar`: `<aside>` bỏ `w-[256px]`, dùng `style={{ width }}`, thêm `relative` và `ResizeHandle side="left"`.
- `RightPanel`: bỏ `w-[340px]/w-[560px]`, dùng `style={{ width }}` + `ResizeHandle side="right"`; nút widen/narrow theo research R6.
