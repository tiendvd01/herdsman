# Tasks — Đổi giao diện nút chỉnh cỡ chữ code

## Phase 1 — Setup

- [x] T001 Xác nhận style New York và token giao diện từ `components.json` và `src/components/ui/button.tsx`.

## Phase 2 — Foundational

- [x] T002 Đối chiếu giá trị mặc định, giới hạn và Reset theo `src/stores/useUiStore.ts` và `specs/appearance-shortcuts/038-restyle-size-stepper/data-model.md`.

## Phase 3 — User Story 1 (P1, MVP)

Kiểm thử độc lập bằng cách mở Appearance và tăng hoặc giảm cỡ chữ trong cụm.

- [x] T003 [US1] Căn giữa giá trị trong khung nền chung và đặt hai Button đối xứng ở `src/components/settings/SettingsDialog.tsx`.

## Phase 4 — Polish & Cross-Cutting Concerns

- [x] T004 Chạy bộ test hiện có tại `tests/unit/settingsDialog.test.tsx` và kiểm tra kiểu theo `tsconfig.json`.
- [x] T005 Kiểm tra giao diện sáng/tối, bàn phím và giá trị biên theo `specs/appearance-shortcuts/038-restyle-size-stepper/quickstart.md`.

## Dependencies & Execution Order

T001 và T002 cung cấp ngữ cảnh cho T003. T004 và T005 có thể xác nhận độc lập sau T003.

## Implementation Strategy

Triển khai toàn bộ US1 trong component hiện có rồi xác nhận hồi quy và giao diện.
