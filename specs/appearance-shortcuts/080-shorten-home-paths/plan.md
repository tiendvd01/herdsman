# Implementation Plan: Rút gọn đường dẫn thư mục cá nhân

Feature `080-shorten-home-paths` · Git `master` · 2026-11-26 · [Đặc tả](spec.md)

## Summary

Khi dựng nhãn tệp, dùng thư mục cá nhân của tài khoản đang chạy app để chuyển tiền tố thành `~`. Giữ đường dẫn gốc cho thao tác mở tệp, sao chép đường dẫn và các yêu cầu quyền.

## Technical Context

Herdsman desktop dùng React, TypeScript và Tauri. Lấy thư mục cá nhân qua `homeDir()` một lần cho mỗi cửa sổ. Trong lúc chờ hoặc nếu đọc thất bại, hiển thị đường dẫn gốc. Chia sẻ kết quả với các nhãn đang hiển thị để chúng cập nhật khi giá trị sẵn sàng. Dữ liệu chỉ tồn tại trong bộ nhớ. Kiểm thử bằng Vitest và React Testing Library.

## Constitution Check

Đã đối chiếu trước và sau thiết kế. Việc đóng app chỉ giải phóng trạng thái hiển thị trong cửa sổ. Agent tiếp tục chạy độc lập. Khi mở lại, giao diện dựng nhãn từ sự kiện gốc. Nội dung diff và lệnh chờ duyệt giữ nguyên để người dùng kiểm tra thao tác thực tế.

## Project Structure

1. Trong `src/lib/`, thêm hàm thuần định dạng nhãn theo quy tắc trong [hợp đồng](contracts/path-label.md). Tách việc lấy thư mục cá nhân khỏi hàm này để kiểm thử cả khi chạy ngoài desktop.
2. Trong `src/components/conversation/ToolCard.tsx`, áp dụng cho trường `file_path` của Read, Edit, MultiEdit và Write trước khi cắt chữ. Rà nhãn của Diff, PermissionCard và liên kết tệp trong hội thoại. Chỉ định dạng phần chữ do app tạo.
3. Rà các nhãn đường dẫn và tooltip trong toàn bộ frontend. Các điểm đã xác định gồm chi tiết project ở CommandDialog, đường dẫn skill ở ProjectSkillsSection, tiêu đề FileEditor, FileChanges và tab ở WorkspaceView. Các nhãn tương đối đi qua nguyên dạng. Giữ giá trị gốc trong callback và thuộc tính đích của liên kết.
4. Bổ sung ca kiểm thử hàm định dạng, tiêu đề Write và đích mở tệp vào `tests/unit/`. Kiểm tra phiên phát lại và tooltip theo [hướng dẫn xác minh](quickstart.md).
