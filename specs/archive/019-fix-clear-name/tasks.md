# Công việc triển khai `/clear [name]`

**Đầu vào** — [Đặc tả](spec.md), [kế hoạch](plan.md), [mô hình dữ liệu](data-model.md), [hợp đồng lệnh](contracts/clear-command.md)

## Phase 1 — Setup

- [X] T001 Kiểm tra phụ thuộc và quy tắc ignore trong `package.json`, `sidecar/package.json` và `.gitignore`.

## Phase 2 — Foundational

- [X] T002 [P] Chuẩn bị tham số tiêu đề tùy chọn cho lệnh tạo session ở `src/lib/api.ts`.
- [X] T003 [P] Tách thao tác cập nhật cache session để tái sử dụng ở `src/lib/actions.ts`.

## Phase 3 — US1, tạo hội thoại mới có tên (P1)

Kiểm tra độc lập bằng cách gửi `/clear Sửa bộ lọc`, xác nhận hội thoại mới có tên và prompt đầu tiên không đổi tiêu đề.

- [X] T004 [P] [US1] Viết kiểm thử hồi quy lưu và đọc lại tên Unicode trong `src-tauri/src/store.rs`.
- [X] T005 [P] [US1] Viết kiểm thử gửi lệnh có tên và gợi ý menu trong `tests/unit/composerExpand.test.tsx`.
- [X] T006 [US1] Lưu title cùng bản ghi mới trong `src-tauri/src/store.rs` và truyền từ `src-tauri/src/commands.rs`. “Lưu toàn bộ tên một dòng sau khi bỏ khoảng trắng đầu cuối, kể cả Unicode và tên đã dùng. Giá trị trống được lưu như tên chưa đặt.”
- [X] T007 [US1] Xử lý lệnh có tên trước khi gửi prompt, mở session mới cùng workspace và engine, thêm gợi ý `[name]` trong `src/components/composer/Composer.tsx`.

## Phase 4 — US2, tạo hội thoại theo tên mặc định (P2)

Kiểm tra độc lập bằng `/clear`, `/clear   `, một lệnh có tiền tố giống và một lần tạo thất bại.

- [X] T008 [US2] Kiểm tra hồi quy cú pháp không tên, tiền tố giống và lỗi giữ draft trong `tests/unit/composerExpand.test.tsx`.
- [X] T009 [US2] Hỗ trợ Enter gửi lệnh không tên, giữ luồng cho tin nhắn thường và giữ draft khi tạo thất bại trong `src/components/composer/Composer.tsx`.

## Phase 5 — Polish & Cross-Cutting

- [X] T010 Chạy kiểm thử frontend, Rust và hợp đồng `sidecar/test/` theo `specs/019-fix-clear-name/quickstart.md`.
- [ ] T011 Kiểm tra app desktop qua `hc` và tình huống đóng, mở lại app theo `specs/019-fix-clear-name/quickstart.md`.

## Dependencies & Execution Order

Setup → nền tảng → US1 → US2 → nghiệm thu. T002 và T003 độc lập. Trong US1, T004 và T005 có thể làm song song. US2 dùng lại đường tạo session từ US1 và có kịch bản nghiệm thu riêng.

## Implementation Strategy

MVP gồm US1 với lệnh có tên và gợi ý menu. Sau đó xác nhận tên mặc định và xử lý lỗi của US2 trước khi chạy toàn bộ hồi quy.

## Kết quả kiểm chứng

- Frontend 189/189 với `pnpm test --maxWorkers=2`. TypeScript đã kiểm tra kiểu.
- Rust 18/18, gồm luồng đóng và dựng lại backend với `hc` thật, khôi phục session có tên trong khi session gốc vẫn chờ duyệt.
- Hợp đồng sidecar 15/15.
- T011 còn phần thao tác trực tiếp trong cửa sổ Tauri với Claude và Codex. Luồng composer đã có kiểm thử tự động và tình huống khôi phục backend đã được kiểm tra với Echo.
