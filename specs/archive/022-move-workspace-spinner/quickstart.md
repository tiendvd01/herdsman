# Kiểm tra thay đổi

Từ thư mục gốc, dùng môi trường Node và pnpm của dự án.

```sh
pnpm test
pnpm typecheck
```

Chạy ứng dụng bằng `pnpm tauri dev` với môi trường desktop đã thiết lập. Kiểm tra một workspace dùng thư mục dự án và một worktree, gồm tên ngắn và tên dài bị cắt.

1. Bắt đầu một phiên làm việc. Xác nhận vòng quay nằm ngay trước tên và phần cuối hàng vẫn hiện số đếm khi có.
2. Rê chuột vào và ra khỏi hàng, mở và đóng menu. So sánh vị trí icon, vùng tên, điểm cắt, số đếm và vùng dành cho nút menu. Xác nhận menu mở được bằng bàn phím.
3. Bắt đầu thêm một phiên đang làm việc, dừng một phiên rồi dừng phiên còn lại. Kiểm tra chuỗi một vòng quay, một vòng quay, icon loại workspace.
4. Với một phiên đang làm việc và một phiên cần chú ý, kiểm tra đồng thời cả hai dấu hiệu. Bật tùy chọn giảm chuyển động và kiểm tra vòng quay vẫn có nhãn truy cập, ở trạng thái tĩnh.
