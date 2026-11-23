# Quickstart: kiểm tra resize ô chat mở rộng

**Chuẩn bị**: `pnpm install`, `pnpm dev` → mở `http://localhost:1420/?mock`, cửa sổ ≥ 1100×800.

**Test tự động**: `pnpm vitest run tests/unit/composerResize.test.tsx tests/unit/layout.test.ts tests/unit/composerExpand.test.tsx`

**Kịch bản tay / Playwright** (xem [contracts](contracts/ui-contract.md), [data-model](data-model.md)):
1. Xoá `herdsman-ui` trong localStorage, mở session, bấm "Expand editor" → textarea cao 300px (SC-001).
2. Rê vào cạnh trên ô chat → con trỏ resize dọc, hiện đường kẻ; ở chế độ thường không có tay nắm.
3. Kéo lên 100px → cao ~400px; kéo xuống quá thấp → dừng ở 120px; kéo lên quá cao → dừng ở 80% cửa sổ.
4. Gõ vài dòng + đính ảnh trước khi kéo → nội dung, ảnh, con trỏ không đổi (SC-003).
5. Thu nhỏ rồi mở rộng lại, đổi session, reload trang → vẫn giữ chiều cao đã kéo (SC-005).
6. Double-click tay nắm → về 300px.
7. Thu cửa sổ xuống thấp → thanh công cụ vẫn hiện; nới lại → trở về chiều cao đã chọn (FR-007, SC-004).
8. Hồi quy 012: Esc thu nhỏ, gửi tin thu nhỏ, Enter/Shift+Enter không đổi.
