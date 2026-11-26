# Research: Chi tiết Pull Request

- **Workflow** — Lọc run theo SHA hiện tại và lấy job theo run attempt. Cách này ngăn gắn bước của lần chạy trước vào một lần chạy lại. [GitHub workflow runs](https://docs.github.com/en/rest/actions/workflow-runs), [GitHub workflow jobs](https://docs.github.com/en/rest/actions/workflow-jobs)
- **Review** — Đọc nhận xét review và review threads, phân trang các thread và phản hồi. Thread có trạng thái giải quyết, vị trí hiện tại và vị trí gốc.
- **Lỗi một phần** — Tách check, workflow, review và thread thành kết quả riêng. Đọc metadata trước để xác thực quyền và xác định phiên bản. Tải chung với danh sách sẽ tăng lưu lượng cho mọi PR kể cả khi người dùng không mở chi tiết.
- **Markdown** — Dùng renderer Markdown đã cài để đọc heading, danh sách, code và liên kết HTTP(S). Chặn HTML nhúng và tài nguyên tải ngầm.
