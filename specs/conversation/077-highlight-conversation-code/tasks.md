# Tasks — Highlight code trong Rich Conversation

## Setup và nền tảng

- [X] T001 Xác nhận Shiki, cỡ chữ và ignore hiện có trong package.json, src/styles/globals.css và .gitignore.

## User Story 1 — Đọc code và diff có tô màu

- [X] T002 [P] [US1] Nhận diện khối một dòng và giữ fallback trong src/components/conversation/Markdown.tsx và src/components/conversation/CodeBlock.tsx, dùng bộ nạp tương thích WebKit trong src/lib/highlightCode.ts (FR-001, FR-003, FR-005).
- [X] T003 [US1] Tô màu diff dựa trên đường dẫn/hunk trong src/components/conversation/lineDiff.ts, src/components/conversation/Diff.tsx, src/components/conversation/highlightPatch.ts và các điểm gọi trong ToolCard.tsx, PermissionCard.tsx, FileChanges.tsx (FR-002, FR-003, FR-005).

Kiểm tra độc lập bằng khối có nhãn và diff thêm/xóa/ngữ cảnh ở hai theme (SC-001, SC-003).

## User Story 2 — Cỡ chữ code

- [X] T004 [P] [US2] Dùng cỡ code chung trong src/styles/globals.css và trên khối code/diff (FR-004).

Kiểm tra độc lập bằng Settings với 14 px, 18 px, mở lại và Reset (SC-002).

## Kiểm tra chung

- [X] T005 Kiểm tra regression trong tests/unit/render.test.tsx và xác nhận typecheck, test theo quickstart.md.

## Dependencies & Strategy

T001 trước triển khai. T002 và T003 tạo MVP của US1. Phần CSS ở T004 có thể thực hiện song song với T003. T005 chạy sau hai user story.
