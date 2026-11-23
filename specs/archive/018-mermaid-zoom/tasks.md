# Tasks: Zoom Mermaid diagram trong rich conversation

**Input**: `specs/018-mermaid-zoom/` (plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md)
**Tests**: Có — hàm thuần và viewer (vitest, jsdom).

## Phase 1: Setup

- [x] T001 Tạo `src/components/conversation/mermaidZoom.ts` với hàm thuần: `MIN_SCALE=0.25`, `MAX_SCALE=8`, `clampScale(s)`, `fitScale(boxW, boxH, svgW, svgH, pad=24)` (min của 2 tỉ lệ, tối đa không phóng quá 1× kích thước gốc không bắt buộc), `zoomAt(state, factor, px, py)` giữ điểm dưới con trỏ cố định, `centerOffset(boxW, boxH, svgW, svgH, scale)`; state `{scale, tx, ty}`.

## Phase 2: Foundational

- [x] T002 [P] Viết `tests/unit/mermaidZoom.test.ts`: clamp [0.25, 8], fitScale cho diagram rộng/cao, zoomAt giữ nguyên điểm neo, centerOffset.

## Phase 3: User Story 1 - Khung phóng to (P1) 🎯 MVP

**Independent Test**: diagram đã render có nút "Zoom diagram"; bấm mở dialog vừa khít; Esc / nút Close / nền đóng; lỗi/chưa render không có nút.

- [x] T003 [US1] Tạo `src/components/conversation/MermaidViewer.tsx`: dùng `Dialog`/`DialogContent` từ `@/components/ui/dialog` (class gần toàn màn hình, `data-testid="mermaid-viewer"`, title ẩn cho a11y), render `svg` bằng `dangerouslySetInnerHTML` (svg đã qua mermaid strict) trong wrapper transform; đo kích thước SVG qua `viewBox`/`getBBox` fallback `width/height`; tính fit bằng `mermaidZoom.ts`, tính lại khi khung đổi kích thước (ResizeObserver, có guard jsdom).
- [x] T004 [US1] Sửa `src/components/conversation/Mermaid.tsx`: state `zoomOpen`; thêm nút `aria-label="Zoom diagram"` (icon `Maximize2` lucide) trong figcaption chỉ khi `svg` có; render `<MermaidViewer svg={svg} open onOpenChange />`. Không đổi render lười/cache/lỗi.
- [x] T005 [P] [US1] Viết `tests/unit/mermaidViewer.test.tsx`: mock `mermaid` render ra svg mẫu; có nút phóng to sau render, bấm mở `mermaid-viewer`, Esc đóng, không có nút khi lỗi. Chạy lại `tests/unit/render.test.tsx` để chắc không hồi quy.

## Phase 4: User Story 2 - Zoom & pan (P2)

**Independent Test**: +/−, Ctrl/Cmd+wheel, kéo, Reset, % cập nhật, chạm giới hạn thì nút vô hiệu.

- [x] T006 [US2] Trong `MermaidViewer.tsx`: thanh công cụ `Zoom in`, `Zoom out` (×1.25 / ÷1.25, `disabled` ở giới hạn), `Reset zoom`, nhãn `data-testid="mermaid-zoom-level"` hiển thị `%` tương đối mức fit, nút `Close`.
- [x] T007 [US2] Trong `MermaidViewer.tsx`: wheel (non-passive, listener gắn bằng ref) — Ctrl/Cmd zoom quanh con trỏ (`zoomAt`), wheel thường pan; kéo chuột bằng pointer events + pointer capture, con trỏ grab/grabbing; phím `+`/`=`, `-`, `0`, mũi tên pan; mỗi lần mở bắt đầu ở fit (reset state khi `open` đổi).
- [x] T008 [P] [US2] Bổ sung vào `tests/unit/mermaidViewer.test.tsx`: bấm Zoom in tăng % (125%), Zoom out, Reset về 100%, nút disabled ở giới hạn, phím `0`/`+`.

## Phase 5: User Story 3 - Theme & nhiều diagram (P3)

- [x] T009 [US3] Nền/viền/toolbar của viewer chỉ dùng token màu theme (`bg-background`, `border-border`, `text-foreground`…); xác nhận khi `svg` prop đổi (đổi theme) viewer cập nhật mà không mất trạng thái mở. Mỗi `Mermaid` có state riêng nên mỗi diagram phóng to độc lập.
- [x] T010 [P] [US3] Test trong `tests/unit/mermaidViewer.test.tsx`: render 2 diagram, mở từng cái chỉ hiện svg tương ứng, mức zoom bắt đầu 100%.

## Phase 6: Polish

- [x] T011 Chạy `pnpm typecheck` và `pnpm test`, sửa lỗi.
- [x] T012 Kiểm UI qua Playwright mở web view `?mock` theo `quickstart.md`, chụp ảnh khung phóng to.

## Dependencies

T001 → T002, T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012. MVP = Phase 1–3.
Song song: T002 với T003; T005/T008/T010 (file test) độc lập với code khác khi code đã xong.
