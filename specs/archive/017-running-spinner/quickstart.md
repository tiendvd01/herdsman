# Quickstart: kiểm tra vòng quay

## Chuẩn bị
`pnpm install`; chạy web view mock theo ghi chú "UI check with Playwright" (`?mock`).

## Kiểm thử tự động
`pnpm test tests/unit/runningSpinner.test.tsx` (hoặc `pnpm test`). Kỳ vọng:
- Tab của phiên `working` có spinner (`aria-label` "Working"); tab `done`/`blocked` thì không.
- Workspace có phiên `working` có đúng một spinner; không có thì không.
- `blocked` không sinh spinner và vẫn giữ chấm chờ duyệt.
- Đổi trạng thái trong store → spinner biến mất không cần tải lại.

## Kiểm thử trực quan (Playwright, `?mock`)
1. Mở workspace có ≥ 2 phiên, đặt 1 phiên `working`: tab có vòng quay, workspace ở thanh bên có vòng quay.
2. Chuyển phiên sang `done`: cả hai vòng quay mất, bố cục không dịch (so ảnh chụp).
3. Lặp ở Light, Paper, Dark; bật reduce-motion trong emulation: vòng không xoay.
4. Tên workspace dài: tên cắt bớt, số đếm vẫn thấy.
