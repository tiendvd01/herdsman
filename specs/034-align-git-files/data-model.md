# Data Model

- File thay đổi gồm đường dẫn tương đối và mã trạng thái, thuộc workspace đang xem.
- Tab diff gồm project, workspace, đường dẫn, tên hiển thị và định danh duy nhất theo workspace và đường dẫn. Tab được tạo khi kích hoạt file, tồn tại trong phiên ứng dụng và được bỏ khi đóng.
- Nội dung diff có trạng thái đang tải, có kết quả, rỗng hoặc lỗi. Tab chỉ đọc và không mang bản sửa editor.
