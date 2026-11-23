# Tasks: Chuyển vòng quay lên đầu hàng workspace

**Input**: spec.md, plan.md và tài liệu thiết kế trong thư mục feature.

## Phase 1: Setup

- [X] T001 Kiểm tra script Node và phạm vi ignore trong `package.json` và `.gitignore`.

## Phase 2: Foundational

- [X] T002 Xác nhận quy tắc trạng thái trong `src/components/layout/Sidebar.tsx` và hành vi truy cập trong `src/components/ui/spinner.tsx`.

## Phase 3: User Story 1 (P1)

**Goal**: Nhận ra workspace đang chạy và mở menu mà bố cục hàng giữ nguyên.

**Independent Test**: Dùng workspace tên dài và một phiên làm việc. Kiểm tra lúc rê chuột, lúc mở menu và lúc phiên ngừng.

- [X] T003 [US1] Đưa spinner cùng kích thước vào vị trí icon của hai loại workspace trong `src/components/layout/Sidebar.tsx` (FR-001, FR-002, FR-004).
- [X] T004 [US1] Cố định vùng menu, tên và số đếm trong `src/components/layout/Sidebar.tsx` và `src/components/workspace/WorkspaceMenu.tsx` (FR-003, FR-004).

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T005 Chạy kiểm tra theo `specs/022-move-workspace-spinner/quickstart.md` (SC-001 đến SC-003).

## Dependencies & Execution Order

Setup → Foundational → US1 → kiểm tra. T003 và T004 cùng sửa Sidebar nên thực hiện tuần tự. Ở T005, bộ test và typecheck có thể chạy song song.

## Implementation Strategy

US1 là MVP và toàn bộ phạm vi. Kiểm tra cả workspace dùng thư mục dự án lẫn worktree.
