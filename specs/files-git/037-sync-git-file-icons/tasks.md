# Tasks: Đồng bộ icon file trong Git Changes

**Input** — [spec](spec.md), [plan](plan.md) và [quickstart](quickstart.md).

## Phase 1 — Setup

Dùng asset Material và công cụ kiểm thử của repo.

## Phase 2 — Foundational

Dùng hợp đồng dòng thay đổi hiện có.

## Phase 3 — User Story 1 · Nhận diện file trong Git Changes (P1, MVP)

**Kiểm tra độc lập** — Đối chiếu icon của năm file mẫu, file đã xóa và đích đổi tên rồi thử mở diff.

- [X] T001 [US1] Dùng bộ chọn icon Material theo basename và ảnh alt rỗng trong `src/components/panels/RightPanel.tsx`. Xóa bộ chọn icon cũ hết caller ở `src/components/files/fileRows.ts`.

## Phase 4 — Validation

- [X] T002 Chạy typecheck và kiểm tra icon, trạng thái và mở diff theo `specs/files-git/037-sync-git-file-icons/quickstart.md` bằng bộ kiểm tra `tests/unit/gitFiles.test.tsx`.

## Dependencies & Execution Order

T001 → T002. Phạm vi chỉ một story và một thay đổi nhỏ, nên thứ tự tuần tự giữ các sửa đổi dễ kiểm tra.

## Implementation Strategy

Giao US1 sau khi xác nhận icon, khả năng truy cập và luồng mở diff.
