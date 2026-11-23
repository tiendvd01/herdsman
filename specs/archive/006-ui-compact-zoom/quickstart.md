# Quickstart: kiểm tra giao diện gọn và zoom

## Chuẩn bị

```sh
pnpm install
pnpm test          # unit: bậc zoom, clamp, khớp phím, migrate
pnpm typecheck
pnpm dev           # Vite :1420
```

Mở `http://localhost:1420/?mock` bằng Playwright (cửa sổ 1440×900), chụp sáng và tối.

## Kịch bản

1. **Gọn hơn (US1)**: so ảnh trước/sau ở cùng workspace mock: số hàng workspace trong sidebar và số dòng hội thoại tăng ≥ 15% (SC-001); không có chữ bị cắt; hộp thoại thêm project, command palette, thẻ duyệt quyền đều theo cỡ mới.
2. **Zoom (US2)**: focus composer, gõ "abc", nhấn ⌘= ba lần → chỉ báo "110%", "120%", "135%"; nội dung composer vẫn "abc". ⌘0 → 100%. Nhấn ⌘− tới 80% rồi nhấn thêm → giữ 80%, chỉ báo ghi giới hạn.
3. **Cỡ chữ (US3)**: ⌥⌘= hai lần → chữ hội thoại, code và Log to lên, sidebar/header không đổi. ⌥⌘0 → về mặc định; zoom không đổi.
4. **Nhớ (US4)**: đặt 120% + cỡ chữ +1, tải lại trang → hiện ngay 120% và +1. ⌘K gõ "zoom" → thấy 6 lệnh kèm phím.
5. **Cửa sổ hẹp**: 960px, zoom 150% → vùng hội thoại vẫn ≥ 400px CSS, không thanh cuộn ngang; kéo mép sidebar vẫn bám chuột.
6. **App thật (Tauri)**: `pnpm tauri dev`, menu View có Zoom In / Zoom Out / Actual Size; dùng menu và phím đều đổi đúng một bậc.
