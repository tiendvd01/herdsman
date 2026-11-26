# Quickstart

1. Chạy `pnpm install --frozen-lockfile` nếu chưa cài dependency. Chạy `pnpm test tests/unit/pullRequests.test.tsx tests/unit/settingsView.test.tsx` và `pnpm typecheck`.
2. Chạy `pnpm tauri dev`. Với hai project có PR và cấu hình Skills khác nhau, mở lần lượt hai màn từ toolbar. Chọn project khác rồi quay về Projects. Đối chiếu phạm vi nội dung, mục được chọn và workspace với [UI contract](contracts/project-sidebar.md).
3. Trong Pull Requests, chọn `All projects`, đổi chế độ rồi mở thông báo của project khác. Kiểm tra mục đang chọn và PR đích.
4. Với 20 project và cửa sổ chỉ hiện 8 mục, dùng Tab và Enter để chọn mục cuối. Lặp lại ở hai màn với toolbar mở rộng và thu gọn, theme sáng và tối.
5. Thử danh sách trống, tên trùng và project bị gỡ. Kiểm tra trạng thái và lựa chọn dự phòng.
6. Để nghiệm thu SC-003, đo thời gian từ lúc sidebar hiện đến khi người dùng mới chỉ đúng mục ban đầu và chọn đúng mục yêu cầu. Ngưỡng đạt là 9/10 người trong 10 giây trên mỗi màn.

## Kết quả kiểm tra

- Typecheck và 287 test frontend đạt, gồm điều hướng từ thông báo PR và áp dụng cấu hình Skills theo ID project.
- Kiểm tra Chrome với dữ liệu mô phỏng đạt cho bố cục, danh sách 20 project, tên trùng, danh sách trống, thao tác chuột và bàn phím, theme sáng và tối, toolbar thu gọn và mở rộng.
- SC-003 cần buổi thử với 10 người dùng. Luồng với dữ liệu thật cần chạy trong Tauri.
