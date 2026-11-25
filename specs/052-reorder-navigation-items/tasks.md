# Tasks — Navigation Reordering

## Phase 1 — Setup

- [X] T001 Xác nhận luồng hiện tại và phạm vi trong specs/052-reorder-navigation-items/plan.md.

## Phase 2 — Foundation

- [X] T002 Kiểm tra sắp xếp, ghi lỗi và khôi phục thứ tự trong tests/unit/navigationOrder.test.tsx.
- [X] T003 Thêm thao tác con trỏ, bàn phím và lưu thứ tự theo phạm vi trong src/lib/useNavigationOrder.ts.

## Phase 3 — User Story 1

Đổi thứ tự tab giữa các loại, chuyển workspace và kiểm tra thứ tự khi quay lại.

- [X] T004 [US1] Dùng thứ tự chung trong src/components/layout/WorkspaceView.tsx.

## Phase 4 — User Story 2

Đổi thứ tự workspace trong project và thử thả sang project khác.

- [X] T005 [US2] Gắn sắp xếp workspace trong src/components/layout/Sidebar.tsx.

## Phase 5 — User Story 3

Đổi thứ tự project và kiểm tra lại sau khi tải lại giao diện.

- [X] T006 [US3] Gắn sắp xếp project trong src/components/layout/Sidebar.tsx.

## Final Phase — Verification

- [X] T007 Cập nhật mô tả kỹ thuật trong specs/technical.md và ghi kết quả unit test, build và smoke trình duyệt trong specs/052-reorder-navigation-items/quickstart.md.

## Dependencies & Execution Order

T001 → T002 → T003. Sau phần dùng chung, T004 có thể chạy song song với T005 → T006 vì khác tệp. T007 xác nhận cả ba luồng. Có thể nghiệm thu tab trước rồi bổ sung workspace và project.
