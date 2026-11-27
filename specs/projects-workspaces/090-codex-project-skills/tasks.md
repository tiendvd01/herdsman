---
description: "Task list for Codex project skills"
---

# Tasks: Dùng skill trong project với Codex

**Input**: [Spec](spec.md), [plan](plan.md), [research](research.md), [data model](data-model.md), [contract](contracts/codex-skills.md) và [quickstart](quickstart.md).

## Phase 1: Setup

- [X] T001 Xác nhận schema Codex 0.172.0 và nguồn skill bằng probe App Server, ghi tại `research.md`.

## Phase 2: Foundational

- [X] T002 Tạo catalog tại `sidecar/src/engines/codex-skills.mjs`. Tên do Codex xác thực và dùng để gọi skill. Tên phân biệt hoa thường. Mô tả bắt buộc, là chuỗi có nội dung. Tệp phải tồn tại, đọc được và nằm trong workspace. Nguồn đầu tiên được ưu tiên nếu tên trùng.

## Phase 3: User Story 1 - Gọi skill đã có trong repo (P1)

**Independent test** — Chọn skill từ menu và gọi trực tiếp trên repo có từng kiểu nguồn. Kiểm tra cùng định nghĩa và giữ phần yêu cầu gửi kèm.

- [X] T003 [P] [US1] Kiểm tra hợp đồng socket cho hai thư mục, symlink, tên trùng, đăng ký root, đầu vào native, lỗi nguồn mất và quyền trong `sidecar/test/codex.contract.test.mjs` (FR-001–FR-003, FR-005–FR-006).
- [X] T004 [P] [US1] Kiểm tra menu và lời gọi trực tiếp Codex trong `src/components/composer/Composer.tsx` và `tests/unit/composerExpand.test.tsx` (FR-002).
- [X] T005 [US1] Liệt kê và gửi skill đến App Server, giữ yêu cầu, tệp đính kèm và quyền của lượt trong `sidecar/src/engines/codex.mjs` (FR-001–FR-003, FR-005–FR-006).

## Phase 4: User Story 2 - Dùng bộ skill của đúng workspace (P1)

**Independent test** — Dùng cùng tên skill ở thư mục chính và worktree, rồi ngắt kết nối và mở lại. Kiểm tra mỗi lượt dùng nội dung của đúng thư mục.

- [X] T006 [US2] Kiểm thử hai workspace, symlink đi ra ngoài, workspace trống, ngắt kết nối, tiếp tục session và đọc bản cập nhật trên đĩa qua `sidecar/test/codex.contract.test.mjs` (FR-004–FR-005).

## Final Phase: Verification

- [X] T007 Chạy contract test, suite frontend, typecheck và smoke test giao thức với Codex App Server cài sẵn theo `quickstart.md`. Ghi rõ phạm vi nghiệm thu thủ công còn lại.

## Dependencies & Execution Order

T001 → T002 → T005 → T006 → T007. T003 bổ sung contract trước T005 và có thể thực hiện song song với T004 vì hai bước chạm hai bộ test khác nhau. US2 sử dụng đường gọi skill đã hoàn thành của US1.

## Implementation Strategy

US1 là luồng tối thiểu dùng được. US2 khóa phạm vi workspace cho các phiên mới và phiên tiếp tục. Kiểm tra cuối đối chiếu SC-001–SC-004 với hợp đồng, test Composer và kịch bản nghiệm thu.
