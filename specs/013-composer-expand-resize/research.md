# Research: Resize ô chat ở chế độ mở rộng

## R1. Tay nắm: tái dùng `ResizeHandle` hay viết mới?
- **Decision**: Tổng quát hoá `ResizeHandle` (spec 004) thêm trục dọc: prop `orientation?: 'vertical' | 'horizontal'` (mặc định `'vertical'` = tay nắm cột hiện có, không đổi hành vi). Với trục ngang (tay nắm nằm ngang ở cạnh trên composer): `role="separator"` `aria-orientation="horizontal"`, `cursor-row-resize`, dùng `clientY`, kéo lên = cao thêm, phím ↑/↓ bước `KEY_STEP`, Enter/double-click = reset.
- **Rationale**: logic pointer capture, rAF throttle, `resizing` body class, bù zoom (`currentZoomFactor`) đã đúng và có test; "nhất quán với tay nắm sidebar" (FR-004).
- **Alternatives**: viết handle riêng cho composer (trùng lặp logic) — loại; dùng thư viện resize — thêm dependency, loại.

## R2. Lưu chiều cao ở đâu?
- **Decision**: `useUiStore` (persist `herdsman-ui`) thêm `composerHeight: number` + `setComposerHeight`, kẹp bằng `clampWidth`-kiểu helper với `COMPOSER = { min: 120, max: 1200, def: 300 }`; `merge` kẹp lại giá trị đọc từ localStorage. Không cần bump version/migration vì khoá mới có default khi thiếu.
- **Rationale**: đúng cách lưu độ rộng sidebar; dùng chung mọi session (FR-006).
- **Alternatives**: state cục bộ trong Composer (mất khi mở lại app) — loại; theo từng session — không yêu cầu.

## R3. Giới hạn theo cửa sổ (FR-003, FR-007)
- **Decision**: giá trị lưu là "ý muốn" của người dùng; chiều cao hiệu lực = `min(saved, maxByViewport)` với `maxByViewport = floor(0.8 * viewportHeight / zoom)`, tính bằng hàm thuần `effectiveComposerHeight` trong `src/lib/layout.ts`, kèm `useViewportHeight` cạnh `useViewportWidth`. Textarea giữ `shrink` + `min-h-0` của 012 làm lưới an toàn để thanh công cụ không rời màn hình khi khung hội thoại thấp (thẻ xin quyền).
- **Rationale**: giá trị đã chọn không bị mất khi cửa sổ tạm thấp (giống `layoutWidths`).
- **Alternatives**: chỉ dùng CSS `max-h-[80vh]` — không bù zoom CSS ở bản preview trình duyệt, loại.

## R4. Chiều cao áp lên đâu
- **Decision**: textarea mở rộng dùng `style={{ height: effective }}` thay `h-[65vh]` (giữ `shrink`). Tay nắm là phần tử `absolute inset-x-0 -top-1` trên khung viền của composer, chỉ render khi `expanded`.
- **Rationale**: composer neo đáy, kéo cạnh trên là tự nhiên; không đổi bố cục ở chế độ thường.

## R5. Hiệu năng khi kéo
- **Decision**: `onChange` đã được rAF-throttle trong `ResizeHandle`; chỉ Composer re-render (hội thoại là `flex-1`, không bị ảnh hưởng nhờ Zustand selector hẹp).
