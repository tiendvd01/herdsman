# Quickstart: kiểm tra bộ khoảng cách

## Tự động

```sh
pnpm test -- spacingScale   # kiểm tra mọi token spacing thuộc bộ chung (contracts/spacing-scale.md)
pnpm typecheck
pnpm test                   # toàn bộ unit test vẫn qua
```

Thử hỏng: thêm `px-2.5` vào một className bất kỳ → `spacingScale` thất bại và in `file:dòng px-2.5`. Bỏ đi → qua.

## Bằng mắt (Playwright, `?mock`)

1. `pnpm dev` (port 1420), mở `http://localhost:1420/?mock`.
2. Chụp sidebar sáng / tối. Đo mép phải (bounding box) của:
   - nút "New project" ở dòng "Projects",
   - nút "New workspace in …" của từng project,
   - nút "Options for workspace …" (rê chuột vào hàng workspace).
   → cùng giá trị `right` (SC-001).
3. Kéo sidebar về hẹp nhất và rộng nhất → lặp lại bước 2.
4. Đo `bottom` của ba header (sidebar, vùng giữa, side panel) → bằng nhau (SC-004).
5. So ảnh trước / sau cùng kích thước cửa sổ: số hàng workspace và dòng hội thoại thấy được chênh không quá ±10% (SC-005).
6. Mở hộp thoại tạo workspace, command palette (⌘K), tab side panel → không vỡ bố cục.
