# PR Detail Contract

`pull_request_detail` nhận repository, number, githubAccount và expectedAccount. Metadata và kết quả từng phần được trả cho tài khoản đã xác thực. Tài khoản lệch hoặc PR không còn quyền đọc trả lỗi toàn bộ. Section gồm giá trị hoặc lỗi và có thể thử lại từ UI. Workflow và jobs dùng run ID và attempt. UI loại kết quả từ scope khác, giữ mục mở khi tương ứng với cùng định danh và giữ cache trong bộ nhớ 5 phút sau khi đóng. Khi mở lại, UI hiển thị cache ngay và tự làm mới mỗi 5 giây trong lúc đang xem.
