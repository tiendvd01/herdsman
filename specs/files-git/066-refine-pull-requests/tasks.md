---
description: "Tasks for refining the Pull Requests screen"
---

# Tasks: Tinh chỉnh giao diện Pull Requests

**Input** — `specs/files-git/066-refine-pull-requests/`

**Prerequisites** — spec.md, plan.md, research.md, data-model.md, contracts/ và quickstart.md.

## Format and Path Conventions

Dùng ID tuần tự, đường dẫn tính từ gốc repo, `[P]` cho việc độc lập và `[USn]` cho user story.

## Phase 1: Setup

- [X] T001 Kiểm tra cấu hình thành phần hiện có trong `components.json`, checklist yêu cầu và quy tắc ignore trong `.gitignore`.

## Phase 2: Foundational

- [X] T002 [P] Bổ sung `headRefName` và `updatedAt` là chuỗi tùy chọn, snapshot cũ thiếu hai trường vẫn hợp lệ trong `src-tauri/src/pull_requests.rs`.
- [X] T003 [P] Chuẩn bị trạng thái dùng chung trong `src/components/layout/PullRequestDetails.tsx`, gồm CI, review và tình trạng nhánh đích.

## Phase 3: User Story 1 - Lướt danh sách và đổi chế độ xem (P1)

**Goal** — Bốn chế độ xem trực tiếp và các hàng PR dễ đọc.

**Independent Test** — Với hai project, chọn từng tab và đổi phạm vi, rồi nhận biết PR đang lỗi CI.

- [X] T004 [US1] Cập nhật kiểm thử chọn tab, phạm vi, bộ đếm và trạng thái hàng trong `tests/unit/pullRequests.test.tsx`.
- [X] T005 [US1] Thay dropdown, dựng hàng PR và trình bày trạng thái tải, trống và lỗi trong `src/components/layout/PullRequests.tsx`.

## Phase 4: User Story 2 - Đọc trạng thái PR trong Herdsman (P1)

**Goal** — Xem tiến độ chỉ đọc, mở GitHub và khôi phục ngữ cảnh danh sách.

**Independent Test** — Mở PR từ hàng đã cuộn, kiểm tra tiến độ và quay lại đúng hàng.

- [X] T006 [US2] Bao phủ mở chi tiết, link repository chính xác, quay lại và làm mới theo quyền trong `tests/unit/pullRequests.test.tsx`.
- [X] T007 [US2] Dựng chi tiết và nối điều hướng, cuộn và focus trong `src/components/layout/PullRequestDetails.tsx` và `src/components/layout/PullRequests.tsx`.

## Phase 5: User Story 3 - Mở đúng PR từ thông báo (P2)

**Goal** — Đếm thông báo theo phạm vi và mở đúng PR.

**Independent Test** — Mở thông báo thuộc project khác có PR trùng số, xem chi tiết và xác nhận số chưa xem giảm.

- [X] T008 [US3] Kiểm thử thông báo trùng số PR, đích GitHub khi PR rời danh sách và lựa chọn project trong `tests/unit/pullRequests.test.tsx`.
- [X] T009 [US3] Nối thông báo và toast tới chi tiết, giữ quy tắc đếm và lựa chọn project trong `src/components/layout/PullRequests.tsx`.

## Final Phase: Cross-Cutting Validation

- [X] T010 Chạy kiểm thử TypeScript, Rust và kiểm tra giao diện theo `specs/files-git/066-refine-pull-requests/quickstart.md`.

## Dependencies & Execution Order

T001 → T002/T003 → US1 → US2 → US3 → T010. US2 dùng hàng PR của US1, và US3 dùng chi tiết của US2.

## Parallel Examples

T002 và T003 ở hai lớp riêng. Trong mỗi story, kiểm thử và thay đổi cùng màn hình được thực hiện theo thứ tự để xác nhận hiệu lực của bài thử.

## Implementation Strategy

Giao diện danh sách là MVP. Hoàn thiện chi tiết chỉ đọc và luồng thông báo theo hai bước tiếp theo. Kiểm tra mỗi bước qua cùng điểm vào Pull Requests trong AppShell.
