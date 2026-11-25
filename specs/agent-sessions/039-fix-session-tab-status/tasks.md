# Tasks: Sửa đèn báo khi đóng tab Session

**Propagated**: 2026-11-24 — Bổ sung truy vết FR-004 và nghiệm thu SC-001.

## Phase 1: Setup

- [X] T001 Xác nhận thứ tự sự kiện đóng và checklist trong `src-tauri/src/agent.rs` và `specs/agent-sessions/039-fix-session-tab-status/checklists/requirements.md`.

## Phase 2: Foundational

Luồng đóng tab, spinner và hạ tầng kiểm thử hiện có đáp ứng các phụ thuộc.

## Phase 3: User Story 1 (P1)

**Independent test** — Xác nhận đóng một Session hoạt động rồi theo dõi đèn cho đến khi tab biến mất.

- [X] T002 [US1] Kiểm thử FR-001 đến FR-004, gồm sự kiện Done đến khi đang đóng, hủy, lỗi và hoàn thành tự nhiên trong `tests/unit/lastSessionClose.test.tsx`.
- [X] T003 [US1] Hiển thị trạng thái đang đóng theo ID Session và xử lý đóng thành công, hủy hoặc lỗi cho FR-001 đến FR-003 trong `src/components/layout/WorkspaceView.tsx`.

- [X] T005 [US1] Phát và chuyển tiếp tín hiệu lượt thành công cho FR-004 từ `sidecar/src/index.mjs`, `sidecar/src/engines/claude.mjs` và `sidecar/src/engines/echo.mjs` qua `src-tauri/src/agent.rs`. Hiển thị Done trên tab còn mở trong `src/components/layout/WorkspaceView.tsx`. Xác minh bằng `src-tauri/tests/flow.rs` và các test hiện có trong `sidecar/test/`.

## Final Phase: Validation

- [X] T004 Chạy kiểm thử và typecheck, đối chiếu với `specs/agent-sessions/039-fix-session-tab-status/spec.md` và ghi kết quả trong `specs/agent-sessions/039-fix-session-tab-status/quickstart.md`.

- [ ] T006 Nghiệm thu SC-001 qua 40 lượt đóng trên desktop ở cả hai theme và ghi kết quả trong `specs/agent-sessions/039-fix-session-tab-status/quickstart.md`.
- [ ] T007 Xác minh lượt bị ngắt không báo Done theo FR-004 và hoàn tất đối chiếu bảy kịch bản SC-002 trong `specs/agent-sessions/039-fix-session-tab-status/quickstart.md`.

## Dependencies & Implementation Strategy

T001 → T002 → T003 → T004 cho luồng đóng. T005 bổ sung luồng hoàn thành lượt. T006 cần T003, T007 cần T005. US1 là toàn bộ MVP. Typecheck và bộ kiểm thử có thể chạy song song sau khi hoàn tất bản sửa.
