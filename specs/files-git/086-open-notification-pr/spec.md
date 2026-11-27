# Feature Specification: Mở chi tiết PR từ thông báo

**Feature Branch**: `master`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "Bấm một mục trong PR Notifications để mở chi tiết PR trong app."

## User Scenarios & Testing

### User Story 1 - Xem PR từ thông báo (Priority: P1)

Người dùng chọn thông báo để xem PR ngay trong Herdsman.

**Why this priority** — Người dùng xem được nội dung PR mà không rời luồng làm việc.

**Independent Test** — Chọn một thông báo về PR đã merge, rồi dùng Back to list.

**Acceptance Scenarios**

1. Khi chọn một thông báo ở Overview hoặc Notifications, Herdsman mở chi tiết đúng repository và số PR, kể cả PR đã rời danh sách theo dõi.
2. Khi nhiều project dùng chung repository và chưa có project được ưu tiên, người dùng chọn project trước khi mở chi tiết và đánh dấu đã đọc.
3. Khi chọn Back to list, người dùng quay về tab đã mở chi tiết. Nút Open on GitHub vẫn mở PR trên trình duyệt khi được chọn.
4. Khi chi tiết không tải được, Herdsman hiển thị thông báo lỗi trong màn chi tiết.

### Edge Cases

- PR đã đóng hoặc merge hiển thị đúng trạng thái khi tải được dữ liệu.
- Thông báo vẫn mở qua nút View trên toast theo cùng quy tắc chọn project.
- Khi đổi tài khoản, chi tiết đang mở được đóng.

## Requirements

### Functional Requirements

- **FR-001** — Mở chi tiết trong Herdsman từ mục thông báo hoặc hành động View trên toast.
- **FR-002** — Giữ quy tắc chọn project và đánh dấu thông báo đã đọc sau khi chọn được đích.
- **FR-003** — Hiển thị chi tiết của PR ngoài danh sách theo dõi, với trạng thái tải hoặc lỗi trong ứng dụng.
- **FR-004** — Cung cấp Back to list và Open on GitHub trong màn chi tiết.

### Key Entities

- **Thông báo PR** — Sự kiện có repository, số PR, tiêu đề, project liên quan và trạng thái đã đọc.
- **Chi tiết PR** — Nội dung và trạng thái của PR thuộc repository và tài khoản đang xem.

## Success Criteria

### Measurable Outcomes

- **SC-001** — Với mỗi thông báo có đích duy nhất, một lần chọn mở đúng màn chi tiết và không tự mở trình duyệt.
- **SC-002** — Với thông báo cần chọn project, chi tiết mở ngay sau lần chọn project và thông báo được đánh dấu đã đọc.
- **SC-003** — Một lần chọn Back to list quay lại tab trước đó, kể cả khi tải chi tiết thất bại.

## Assumptions

- Quyền xem PR theo tài khoản GitHub hiện tại. Project đã chọn tiếp tục là phạm vi khi quay lại danh sách.
