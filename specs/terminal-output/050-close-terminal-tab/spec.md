# Feature Specification: Đóng tab terminal bằng một thao tác

**Feature Branch**: `master`

**Created**: 2026-11-24

**Status**: Ready for planning

**Input**: “Lúc tắt tab terminal không cần hỏi đâu”

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đóng tab terminal trực tiếp (Priority: P1)

Là người dùng Herdsman, tôi muốn bấm đóng tab terminal một lần để dừng shell và dọn tab khỏi workspace.

**Why this priority** — Người dùng đã thể hiện ý định đóng bằng nút đóng của chính tab.

**Independent Test** — Mở một terminal trong workspace và dùng nút đóng khi shell đang chạy. Tab biến mất sau khi shell dừng mà không cần xác nhận thêm.

**Acceptance Scenarios**

1. Khi terminal đang chạy và người dùng bấm đóng, ứng dụng dừng shell cùng lệnh đang chạy trong đó rồi bỏ tab sau khi thao tác thành công.
2. Khi shell đã thoát và tab vẫn còn, một lần bấm đóng sẽ bỏ tab.
3. Khi việc đóng thất bại, tab vẫn hiện, người dùng thấy thông báo lỗi và có thể thử lại.
4. Khi đóng tab đang chọn thành công bằng bàn phím, lựa chọn và focus chuyển theo quy tắc điều hướng tab của workspace.

### Edge Cases

- Khi yêu cầu đang xử lý, nút đóng tạm thời bị vô hiệu hóa để tránh gửi yêu cầu lặp.
- Khi đóng tab cuối cùng, focus chuyển đến điều khiển còn khả dụng của workspace.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Một lần kích hoạt nút đóng terminal MUST bắt đầu thao tác đóng ngay với cả shell đang chạy lẫn shell đã thoát.
- **FR-002** — Ứng dụng MUST dừng đúng terminal được yêu cầu và chỉ bỏ tab sau khi đóng thành công.
- **FR-003** — Nếu thao tác thất bại, ứng dụng MUST giữ tab và hiển thị lỗi để người dùng có thể thử lại.
- **FR-004** — Đóng tab đang chọn MUST áp dụng quy tắc chọn tab và chuyển focus hiện có của workspace.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Cả hai ca shell đang chạy và shell đã thoát đóng được bằng đúng một lần kích hoạt, với 0 hộp thoại xác nhận.
- **SC-002** — Trong ca mô phỏng lỗi, tab vẫn mở và lần thử lại thành công chỉ cần một thao tác.
- **SC-003** — Trong hai ca đóng tab đang chọn bằng bàn phím, focus đến tab kế bên khi có tab khác và đến điều khiển còn khả dụng khi hàng tab trống.

## Assumptions

- Phạm vi áp dụng là nút đóng tab Terminal của workspace. Việc chuyển tab hoặc thoát ứng dụng vẫn cho phép nối lại shell.
- Tab phiên agent và tab tài liệu tiếp tục theo quy tắc đóng riêng.
