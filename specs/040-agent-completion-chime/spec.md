# Feature Specification: Tiếng báo khi agent hoàn thành

**Feature Branch**: `master`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Làm chức năng notification app khi agent hoàn thành, thì thông báo bằng tiếng ting giống herdr-app"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Nghe tiếng báo khi agent làm xong (P1)

Là người dùng Herdsman, tôi muốn nghe một tiếng “ting” ngắn khi agent hoàn thành lượt để biết khi nào có thể quay lại xem kết quả.

**Why this priority** — Người dùng có thể chuyển sang ứng dụng khác hoặc theo dõi nhiều Session cùng lúc mà vẫn nhận ra lúc agent làm xong.

**Independent Test** — Giao một lượt cho agent, chuyển sang ứng dụng khác, rồi kiểm tra tiếng báo và thông báo hệ điều hành khi lượt kết thúc. Lặp lại khi Herdsman đang có focus.

**Acceptance Scenarios**

1. **Given** Herdsman đang chạy ở nền và hệ điều hành cho phép thông báo có âm thanh, **When** agent hoàn thành một lượt thành công, **Then** người dùng nhận một thông báo nhận diện được Session và nghe đúng một tiếng “ting”.
2. **Given** Herdsman đang có focus, **When** agent hoàn thành thành công ở tab đang xem hoặc tab khác, **Then** người dùng nghe đúng một tiếng “ting” nếu hệ điều hành cho phép âm thanh. Tab của phiên đang xem tự về **Idle**. Tab ở nền báo **Done** cho tới khi người dùng xác nhận đã xem theo [đặc tả 049](../049-acknowledge-agent-completion/spec.md).
3. **Given** agent đang làm việc, **When** lượt bị ngắt, đóng giữa chừng hoặc kết thúc có lỗi, **Then** ứng dụng không phát tiếng báo hoàn thành.
4. **Given** người dùng đã nghe tiếng báo hoặc lượt đã kết thúc trước khi mở lại app, **When** Herdsman đọc lại kết quả cũ, **Then** app không phát lại tiếng báo hay gửi lại thông báo hoàn thành cho lượt đó.

### Edge Cases

- Hai Session hoàn thành gần nhau. Mỗi lượt đủ điều kiện có một tiếng báo và thông báo nền tương ứng, kể cả khi cả hai kết thúc theo thứ tự khác với lúc bắt đầu.
- Chế độ im lặng, cài đặt thông báo hoặc **Do Not Disturb** có thể chặn âm thanh hay thông báo. Đèn tab vẫn cho biết trạng thái.
- Một Session có thể hoàn thành nhiều lượt liên tiếp. Mỗi lượt thành công mới có tiếng báo riêng.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Khi một lượt agent hoàn thành thành công và Herdsman đang chạy, ứng dụng MUST phát đúng một tiếng “ting” nếu cài đặt hệ điều hành cho phép. Quy tắc áp dụng cho mọi loại tác vụ và cả khi Herdsman có focus hoặc chạy ở nền.
- **FR-002** — Khi Herdsman ở nền và thông báo hệ điều hành được phép, ứng dụng MUST hiển thị một thông báo hoàn thành có nhãn **Agent finished** và tên Session khi có. Nếu chưa có tên, dùng nhãn **Session**.
- **FR-003** — Ứng dụng MUST xác định hoàn thành theo kết quả của cả lượt. Đóng Session, ngắt lượt, lỗi, chờ duyệt, kết thúc một lệnh con hoặc phát lại lịch sử MUST NOT kích hoạt tiếng báo hoàn thành.
- **FR-004** — Tiếng báo MUST là một âm “ting” ngắn, rõ và tự kết thúc, theo phong cách Herdr App. Ứng dụng MUST tôn trọng quyền thông báo, chế độ im lặng và **Do Not Disturb** của hệ điều hành.
- **FR-005** — Khi nhận trùng thông tin về cùng một lượt, ứng dụng MUST chỉ thông báo hoàn thành một lần. Lượt thành công mới ở cùng Session hoặc Session khác MUST được xử lý riêng.

### Key Entities *(include if feature involves data)*

- **Lượt agent** — Một lượt xử lý có kết quả thành công, lỗi hoặc bị ngắt và thuộc đúng một Session.
- **Thông báo hoàn thành** — Tín hiệu âm thanh của một lượt thành công, kèm thông báo hệ điều hành có tên Session khi Herdsman ở nền.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Trong 10 lượt thành công khi Herdsman có focus và 10 lượt khi ở nền, mỗi lượt phát đúng một tiếng báo trong vòng 2 giây kể từ khi ứng dụng nhận kết quả hoàn thành, với âm thanh và quyền thông báo được bật. Cả 10 lượt nền có thông báo nhận diện được Session.
- **SC-002** — Trong các kịch bản ngắt, lỗi, đóng giữa chừng, phát lại lịch sử và nhận kết quả trùng, có 0 thông báo hoàn thành ngoài dự kiến.
- **SC-003** — Người nghiệm thu nghe một tiếng “ting” riêng biệt dài dưới 1 giây và nhận biết đó là tiếng báo hoàn thành lượt trong các lần thử bật âm thanh.

## Assumptions

- Herdr App là tham chiếu về âm sắc và độ ngắn của tiếng báo. Một âm tương tự đáp ứng yêu cầu.
- Tính năng áp dụng khi tiến trình Herdsman đang chạy. Nếu agent hoàn thành trong lúc app đã thoát, khi mở lại người dùng vẫn xem được trạng thái Session.
- Quyền thông báo và âm lượng thiết bị do hệ điều hành quản lý.
