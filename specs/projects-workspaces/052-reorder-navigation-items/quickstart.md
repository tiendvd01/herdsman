# Quickstart — Navigation Reordering

1. Chạy `pnpm test`, `pnpm typecheck` và `pnpm build`.
2. Chạy `pnpm tauri dev` trên macOS có các project, workspace và runtime đang dùng.
3. Kéo tab session, terminal, file và diff qua nhau. Lặp lại bằng Option + mũi tên trái/phải. Kiểm tra tab đang xem và terminal đang chạy.
4. Kéo các workspace trong một project và các project trong thanh bên. Thử thả workspace sang project khác. Lặp lại điều hướng bằng Option + mũi tên lên/xuống.
5. Chuyển workspace, trở lại rồi thoát và mở lại ứng dụng. So sánh thứ tự những mục còn hiển thị. Thử thoát trong lúc đang kéo và xác nhận thứ tự đã lưu cùng runtime trước đó.
6. Thử giao diện sáng và tối. Chỉ báo vị trí chèn phải rõ và các nút mở, đóng và menu vẫn dùng được.

## Kết quả xác minh

- Vitest đạt 250 test trên 43 tệp. Kiểm tra được thứ tự tab hỗn hợp, giữ terminal đang chọn, hủy khi đích biến mất và khôi phục khi lưu thất bại.
- TypeScript và bản build Vite chạy thành công.
- Smoke test Chromium với dữ liệu mẫu xác nhận kéo thả cả ba danh sách, từ chối chuyển workspace sang project khác, khôi phục thứ tự sau khi đổi workspace và tải lại, chỉ báo kéo ở theme sáng và tối, cùng phím tắt sắp xếp tab.
- Nghiệm thu bằng Tauri với agent và terminal thật, cùng chỉ số thử lần đầu SC-003, chưa được đo.
