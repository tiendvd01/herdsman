# Tasks: Hiện toàn bộ lệnh shell

## Setup và nền tảng

- [X] T001 Xác nhận dependencies và ignore hiện có trong package.json và .gitignore, xác nhận dữ liệu lệnh hiện có trong src/components/conversation/ToolCard.tsx.

## User Story 1 — Đọc lệnh đã chạy

Kiểm tra độc lập bằng cách mở thẻ Bash có lệnh nhiều dòng, so sánh văn bản và xác nhận output.

- [X] T002 [US1] Bổ sung kiểm tra hồi quy cho văn bản lệnh, output và fallback trong tests/unit/toolCard.test.tsx.
- [X] T003 [US1] Hiển thị lệnh Bash khi mở và giữ cách trình bày dự phòng trong src/components/conversation/ToolCard.tsx.

## Kiểm tra chung

- [X] T004 Chạy kiểm tra tự động theo specs/conversation/078-show-shell-command/quickstart.md và cập nhật specs/README.md, specs/technical.md.

## Dependencies & Implementation Strategy

T001 → T002 → T003 → T004. Một user story là toàn bộ MVP. Các phép kiểm tra tự động ở T004 có thể chạy đồng thời.
