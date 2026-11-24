# File Search Contract

`project_files_search` nhận `projectId` và `query`. Trả về các hàng file khớp trong cùng phạm vi mà cây có thể duyệt hoặc lỗi truy cập. So khớp chuỗi con không phân biệt hoa thường trên đường dẫn tương đối. Truy vấn chỉ chứa khoảng trắng trả về mảng rỗng.

Tại Files, nhập truy vấn sẽ hiện trạng thái đang tìm, kết quả có đường dẫn, thông báo rỗng hoặc lỗi có thể thử lại. Tab chuyển từ ô tìm đến kết quả, phím mũi tên di chuyển và Enter mở file. Xóa truy vấn hiện lại cây với các thư mục đã mở.

Đường dẫn tuyệt đối hiện thành một hàng kết quả và mở khi xác nhận bằng Enter hoặc chọn hàng file trong kết quả. Lệnh `absolute_file_read` chỉ nhận đường dẫn tuyệt đối tới file và trả về tài liệu chỉ đọc. Đường dẫn trực tiếp dưới thư mục project dùng luồng mở file của project.

`absolute_files_search` trả về file khớp chính xác, các file trực tiếp trong thư mục khớp chính xác, hoặc các file khớp phần cuối của đường dẫn dưới thư mục cha. Các hàng dùng đường dẫn tuyệt đối để mở đúng file.
