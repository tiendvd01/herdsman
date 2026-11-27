# Research

- Dùng CodeMirror trực tiếp theo mẫu FileEditor. Các extension có sẵn hỗ trợ số dòng, lịch sử, phím soạn thảo và nạp ngôn ngữ shell từ đuôi `.sh`.
- Dùng lại theme token và `codeHighlightStyle` để cú pháp đồng nhất với Files.
- Đọc nội dung đang sửa từ editor khi bấm Save. Cách này tránh đồng bộ một bản nháp thứ hai giữa React và CodeMirror.
- Giữ API project hiện có vì backend lưu nguyên văn giá trị và đã xử lý trường hợp chỉ có khoảng trắng.
