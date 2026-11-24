# Quickstart

1. Chạy `pnpm test tests/unit/workspaceTerminal.test.tsx tests/unit/lastSessionClose.test.tsx` rồi chạy `pnpm typecheck`.
2. Trong app đang kết nối runtime, mở hai terminal trong một workspace. Bấm đóng một terminal đang chạy. Kiểm tra shell dừng sau một thao tác và terminal còn lại vẫn nhận lệnh.
3. Đóng terminal bằng bàn phím với một tab khác còn mở, rồi lặp lại khi terminal là tab duy nhất. Kiểm tra focus lần lượt đến tab còn lại và nút tạo phiên.
