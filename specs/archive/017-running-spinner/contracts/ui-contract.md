# UI Contract

## `Spinner` (`src/components/ui/spinner.tsx`)
- Props: `className?`, `label?` (mặc định `"Working"`).
- Render: icon xoay, `role="img"`, `aria-label={label}`, màu `st-working`, `shrink-0`.
- Với `prefers-reduced-motion`: không xoay.

## `StatusDot`
- Thêm prop `spin?: boolean` (mặc định `false`).
- `spin && status === 'working'` → `Spinner`; còn lại hành vi hiện tại, `aria-label` không đổi.

## Thanh tab (`WorkspaceView`)
- Phiên `working` → vòng quay tại vị trí chấm, trong ô cố định không dịch bố cục.

## Hàng workspace (`Sidebar`)
- Có ≥ 1 phiên `working` → đúng một `Spinner` (`label="Agent running"`) cạnh tên; chấm `blocked` hiện có giữ nguyên; số đếm hiện có giữ nguyên.
- Không `working` → không có spinner.
