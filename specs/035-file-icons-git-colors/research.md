# Research

## Nguồn icon

**Quyết định** — Đóng gói một tập SVG từ một bản phát hành cố định của Material Icon Theme. Ghi tag hoặc commit nguồn và giữ thông báo MIT của upstream. Ưu tiên tên file chính xác, rồi hậu tố dài nhất có hỗ trợ, rồi icon file chung. Dùng URL asset tĩnh và ảnh trang trí không có tên truy cập riêng. [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) · [Giấy phép MIT](https://github.com/material-extensions/vscode-material-icon-theme/blob/main/LICENSE)

**Lý do** — Icon có sẵn offline và tên file vẫn là nhãn truy cập của dòng.

**Phương án đã xem xét** — Đóng gói toàn bộ extension hoặc tải ảnh qua mạng. Tập SVG nhỏ phục vụ phạm vi này với ít asset hơn và hoạt động offline.

## Phạm vi truy vấn Git

**Quyết định** — Thêm truy vấn chỉ đọc theo project ID. Tái sử dụng parser porcelain v1 NUL của `git::changed_files`. Resolve Git top-level và đường dẫn project trước khi lọc theo thành phần đường dẫn và chuyển kết quả về đường dẫn tương đối với project. Dùng đích cho rename/copy. Giữ `files_changed` và `file_diff` làm luồng workspace.

**Lý do** — Workspace luôn có thể trỏ tới worktree khác. Project cũng có thể bắt đầu ở thư mục con của repo. Dòng trong cây dùng đường dẫn tương đối với project.

**Phương án đã xem xét** — Dùng kết quả workspace hoặc gọi Git cho từng thư mục. Truy vấn project riêng đáp ứng cả trường hợp chưa có workspace, và một snapshot đủ cho tất cả thư mục.

## Trạng thái, màu và làm mới

**Quyết định** — Dùng một hàm phân loại cho cả hai panel và token theme cho tên file. Hiển thị ký hiệu chữ có màu ở mép phải, không nền, không viền và cung cấp tên trạng thái tiếng Anh cho công nghệ hỗ trợ. Ưu tiên các mã xung đột chính xác, rồi nhóm xóa, đổi tên/sao chép, thêm và sửa. Với trạng thái hỗn hợp, giữ nguyên mã hiển thị và đọc đủ thông tin trạng thái trong tên truy cập. Mã không nhận diện được dùng màu trung tính.

**Lý do** — Hai panel cùng diễn giải một snapshot Git. Quy tắc ưu tiên rõ ràng cho các mã ghép như `RM` và `AM`.

**Phương án đã xem xét** — Tô nền cả dòng hoặc gắn màu cứng. Tô tên file giữ chỗ cho trạng thái chọn, hover và focus. Dùng lại vai trò màu phù hợp như `diff-add-fg`, `warn-fg` và `diff-del-fg` khi đạt độ tương phản. Bổ sung vai trò cho xanh dương nếu bộ token hiện tại thiếu.

**Quyết định về cache** — Dùng khóa project riêng trong prefix `['files']`, ví dụ `['files', 'project', projectId]`, để hưởng invalidation từ lưu file. Refresh trong Git vô hiệu hóa khóa workspace và project thích hợp. Khi File Tree đang mở, cập nhật mỗi 5 giây như Git Changes. Khi mở lại cây, truy vấn stale được tải lại. Kết quả thành công thay thế map cũ, kể cả khi rỗng.
