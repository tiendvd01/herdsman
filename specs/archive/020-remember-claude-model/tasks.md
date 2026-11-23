# Công việc ghi nhớ model Claude

**Đầu vào** — [Đặc tả](spec.md) và [kế hoạch](plan.md)

## Phase 1 — Setup

- [X] T001 Kiểm tra checklist, phụ thuộc và ignore theo `checklists/requirements.md`, `package.json` và `.gitignore`.

## Phase 2 — Foundational

- [X] T002 Thêm kiểm thử ghi nhớ và snapshot dưới `src-tauri/src/store.rs`.

## Phase 3 — US1, dùng lại model đã chọn (P1)

Kiểm tra độc lập bằng cách đổi model, tạo session Claude ở workspace khác và gửi lượt đầu.

- [X] T003 [US1] Lưu model khi agent xác nhận, chụp model cho các hội thoại Claude mới, giữ lựa chọn riêng cho resume và lịch sử trong `src-tauri/src/{commands,store,agent}.rs`.
- [X] T004 [US1] Dùng model đã lưu với Claude trước prompt đầu, giữ qua khởi động lại sidecar trong `sidecar/src/index.mjs`.

## Phase 4 — US2, xử lý trường hợp model không khả dụng (P2)

Kiểm tra độc lập với cấu hình không có lựa chọn, đổi model lỗi và model bị từ chối ở lượt đầu.

- [X] T005 [P] [US2] Thêm kiểm thử Claude giả lập vào `sidecar/test/claude-model.contract.test.mjs`.
- [X] T006 [US2] Xử lý từ chối có cấu trúc, thử mặc định tối đa một lần và giữ thứ tự prompt trong `sidecar/src/engines/claude.mjs`.
- [X] T007 [US2] Lưu và hiển thị thông báo cùng model thực tế qua `sidecar/src/index.mjs`, `src-tauri/src/agent.rs`, `src/lib/types.ts` và `src/stores/useSessionStore.ts`.

## Phase 5 — Nghiệm thu

- [X] T008 Chạy kiểm thử frontend, Rust và sidecar theo `specs/020-remember-claude-model/quickstart.md`.
- [ ] T009 Kiểm chứng trực tiếp bằng cửa sổ desktop với Claude theo `specs/020-remember-claude-model/quickstart.md`.

## Dependencies & Execution Order

Setup → ghi nhớ và tạo snapshot → xử lý fallback → kiểm thử tổng thể. T005 độc lập với mã Rust và có thể viết song song. MVP là US1, sau đó US2 bảo vệ luồng tạo session khi model bị từ chối.

## Kết quả kiểm chứng

- Frontend 190/190, kiểm tra kiểu TypeScript đạt.
- Rust 19/19, gồm kiểm tra lựa chọn tồn tại sau khi mở lại dữ liệu, áp dụng ở project khác và giữ model riêng cho session cũ.
- Hợp đồng sidecar 19/19, gồm model kế thừa trước lượt đầu, khôi phục sidecar, fallback và chặn thử lại sau khi có công cụ.
- Claude SDK thật xác nhận khởi tạo session với model Sonnet được truyền từ lựa chọn kế thừa. Lượt trả lời thật bị chặn bởi hạn mức 5 giờ. T009 còn nghiệm thu trực tiếp qua cửa sổ desktop.
