# Tài liệu tính năng Herdsman

Mỗi hàng trỏ tới spec hiện hành của một feature. Khi hành vi thay đổi, cập nhật spec của feature liên quan. Với Spec Refine, nêu rõ đường dẫn `spec.md` trong yêu cầu.

| Feature | Spec trước khi gộp |
| --- | --- |
| [Project, workspace và worktree](028-projects-workspaces/spec.md) | 001, 002 |
| [Vòng đời session, quyền và quan sát agent](029-agent-sessions/spec.md) | 001, 005, 008, 014, 017, 020, 022 |
| [Hội thoại và soạn tin](030-conversation-composer/spec.md) | 001, 012, 013, 018, 019, 021, 027 |
| [Lịch sử, tìm session và Command Palette](031-session-history-search/spec.md) | 001, 023, 027 |
| [Duyệt, sửa file và xem Git](032-project-files-git/spec.md) | 001, 026, 027 |
| [Giao diện, bố cục và khả năng tiếp cận](033-app-shell-appearance/spec.md) | 001, 003, 004, 006, 007, 009, 010, 011, 015, 016, 024, 025, 027 |

[Kiến trúc kỹ thuật](technical.md) và [yêu cầu kinh doanh](business-requirement/BR-001.md) cung cấp bối cảnh toàn app.

[Kho lưu trữ](archive/) giữ các spec, plan, tasks, quickstart và contract trước khi gộp. Mã FR và task ID trong đó thuộc từng spec cũ. Đường dẫn ghi trong bản lưu trữ phản ánh cấu trúc tại thời điểm viết. Các spec hiện hành ghi lại yêu cầu của sản phẩm; hãy kiểm tra code và test khi cần xác nhận mức độ triển khai.
