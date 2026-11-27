# Research

- **Nguồn thư mục cá nhân.** Gói Tauri hiện có cung cấp `homeDir(): Promise<string>`. Chọn nguồn này để hỗ trợ tài khoản khác và vị trí home tùy chỉnh. Suy ra từ hai đoạn đầu của đường dẫn có thể nhận nhầm home của người khác.
- **Vị trí định dạng.** CodeGraph cho thấy `toolSummary` trả về cả đường dẫn, lệnh, pattern và URL tùy tên công cụ. Chọn nhánh có ngữ nghĩa đường dẫn để định dạng. Thay chuỗi trong toàn bộ summary hoặc transcript có thể sửa lệnh hay nội dung nguyên văn.
- **Nhãn ngoài hội thoại.** CommandDialog dùng trực tiếp đường dẫn project làm mô tả, ProjectSkillsSection hiển thị đường dẫn skill. Dùng chung quy tắc tại nơi dựng nhãn giúp cả các màn hình này và hội thoại cũ nhận cùng cách viết.
