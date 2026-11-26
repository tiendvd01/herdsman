# Quickstart

1. Cài dependencies bằng `pnpm install` nếu cần.
2. Chạy `pnpm test tests/unit/workspaceTerminal.test.tsx tests/unit/lastSessionClose.test.tsx`.
3. Trong ứng dụng desktop, mở một workspace đang hoạt động không có tab. Xác nhận nút **Create new session** nằm giữa vùng nội dung trong cả hai theme.
4. Mở menu bằng nút giữa hoặc phím tắt tạo session, rồi chọn một agent. Xác nhận tab mới được chọn và nút tạo session chuyển về thanh tab.
5. Đóng session cuối để trở về project. Xác nhận hành động **Create new workspace** vẫn khả dụng.
