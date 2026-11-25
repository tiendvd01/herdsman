# Quickstart

1. Chạy `pnpm test tests/unit/settingsDialog.test.tsx` và `pnpm typecheck`.
2. Chạy `pnpm dev`. Mở **Settings → Appearance** và chọn lần lượt theme **Light** và **Dark**. Kiểm tra khung nền chung, nút hai bên và số chính giữa.
3. Dùng Tab để kiểm tra focus. Dùng Enter hoặc Space để tăng từ 13 lên 14 và giảm về 13.
4. Thử hai giới hạn 10 và 24 theo [hợp đồng UI](contracts/settings-stepper.md). Đổi giá trị, tải lại app, kiểm tra giá trị đã lưu rồi dùng **Reset**.
