# Quickstart

1. Chạy `pnpm test` và `pnpm typecheck`.
2. Chạy `pnpm dev`, mở `http://localhost:1420/?mock` nếu dùng cổng mặc định của dự án. So sánh 100% mới với 110% cũ trên cùng màn hình, cỡ cửa sổ và tùy chọn cỡ chữ. Đo phần tử đại diện trong các khu vực của FR-001.
3. Ở 960 × 600, thử 100% và 150% với cỡ chữ tối đa. Mở workspace, đọc hội thoại, soạn tin và mở hộp thoại. Xác nhận các thao tác đều truy cập được và cửa sổ không cuộn ngang.
4. Đổi zoom và cỡ chữ qua [điều khiển hiện có](contracts/ui-zoom.md), nhập bản nháp, đặt lại zoom, rồi thử mở lại với giá trị đã lưu.
5. Dùng `pnpm tauri dev` để lặp lại kiểm tra với WebView desktop, menu View, Log và phiên agent đang chạy.
