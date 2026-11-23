# Quickstart: kiểm tra kéo đổi độ rộng hai sidebar

## Chuẩn bị

```bash
pnpm install
pnpm dev            # http://localhost:1420
```

Mở `http://localhost:1420/?mock`, cửa sổ trình duyệt ≥ 1440px.

## Kịch bản

1. **Kéo sidebar trái** — rê chuột vào mép phải sidebar trái: con trỏ `col-resize`, vạch mép đổi màu. Kéo sang phải 100px: sidebar rộng ~356px. Kéo hết cỡ: dừng ở 480px; kéo về trái: dừng ở 200px. (US1, FR-001–003)
2. **Không bôi đen/bấm nhầm** — kéo chậm qua vùng hội thoại có chữ: không có chữ nào bị chọn; thả chuột ngoài cửa sổ: kéo dừng. (FR-005)
3. **Kéo side panel phải** — mở tab Log, kéo mép trái sang trái: panel rộng ra (tối đa 720px), đổi tab vẫn giữ độ rộng. (US2)
4. **Nút widen/narrow** — sau khi kéo panel lên 600px, nút hiện "Narrow side panel"; bấm → 340px; bấm lại → 560px. (FR-008)
5. **Nhớ độ rộng** — reload trang: cả hai sidebar giữ độ rộng; thu gọn sidebar trái rồi mở lại: giữ độ rộng. (US3, FR-006)
6. **Nhấp đúp** — nhấp đúp mép sidebar trái: về 256px; panel phải không đổi. (FR-007)
7. **Bàn phím** — Tab tới mép, mũi tên phải 3 lần: +48px; Home/End: min/max. (US4)
8. **Cửa sổ hẹp** — đặt cả hai sidebar ở max rồi thu cửa sổ về 960px: vùng hội thoại vẫn ≥ 400px, không có thanh cuộn ngang; mở rộng cửa sổ lại: hai sidebar trở về độ rộng đã lưu. (FR-004, SC-004)

## Tự động

```bash
pnpm typecheck
pnpm test           # gồm tests/unit/layout.test.ts, tests/unit/resizeHandle.test.tsx
```

Kiểm giao diện bằng Playwright trên `?mock`: kéo mép bằng `mouse.down/move/up`, đo `getBoundingClientRect().width` của hai `<aside>`, chụp màn hình light/dark.
