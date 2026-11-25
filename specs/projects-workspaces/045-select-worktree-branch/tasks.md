# Tasks — Chọn branch có sẵn cho workspace worktree

## Phase 1 — Setup

- [x] T001 Đồng bộ phạm vi workspace trong .specify/memory/constitution.md, specs/business-requirement/BR-001.md, specs/projects-workspaces/028-projects-workspaces/spec.md và specs/technical.md.

## Phase 2 — Foundational

- [x] T002 Mở rộng hợp đồng lựa chọn thư mục và trạng thái branch trong src/lib/api.ts và src-tauri/src/commands.rs.

## Phase 3 — US1 Tiếp tục trên branch có sẵn

- [x] T003 [US1] Kiểm thử checkout branch khả dụng, branch đang được dùng và branch đã mất trong src-tauri/src/git.rs.
- [x] T004 [US1] Kết nối tạo worktree và xử lý lỗi trong src-tauri/src/git.rs và src-tauri/src/commands.rs.
- [x] T005 [US1] Thêm lựa chọn Existing branch và cập nhật dữ liệu preview trong src/components/workspace/CreateWorkspaceDialog.tsx và src/lib/devMock.ts.

## Phase 4 — US2 Giữ luồng hiện tại

- [x] T006 [US2] Kiểm thử payload cho cả hai chế độ worktree và Project folder trong tests/unit/createWorkspaceDialog.test.tsx.

## Phase 5 — Verification

- [x] T007 Chạy kiểm thử và ghi kết quả trong specs/projects-workspaces/045-select-worktree-branch/quickstart.md.

T001 và T002 chuẩn bị phạm vi và hợp đồng. T003 xác lập các ca lỗi cho T004. T005 dùng hợp đồng của T002 và T004. T006 và T007 chạy sau khi nối giao diện.
