# Feature Specification: Cài đặt thông báo hoàn thành

**Feature Branch**: `master`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Làm phần setting notification trong app"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Chọn cách nhận thông báo khi agent hoàn thành (P1)

Là người dùng Herdsman, tôi muốn điều chỉnh thông báo và tiếng “ting” trong Settings để có thể nhận đầy đủ, nhận thông báo im lặng hoặc tắt thông báo hoàn thành.

**Why this priority** — Tiếng báo có ích khi làm việc ở ứng dụng khác, nhưng người dùng cần kiểm soát âm thanh khi cần tập trung.

**Independent Test** — Mở **Settings → Notifications**, tắt tiếng báo và cho agent hoàn thành một lượt. Xác nhận thông báo vẫn xuất hiện khi app chạy nền. Sau đó tắt thông báo hoàn thành và lặp lại.

**Acceptance Scenarios**

1. **Given** người dùng chưa từng đổi tùy chọn, **When** mở **Settings → Notifications**, **Then** **Agent completion notifications** và **Play completion sound** đều được bật.
2. **Given** thông báo hoàn thành đang bật, **When** người dùng tắt tiếng báo, **Then** lượt thành công kế tiếp gửi thông báo im lặng nếu hệ điều hành cho phép.
3. **Given** người dùng tắt thông báo hoàn thành, **When** agent hoàn thành một lượt thành công, **Then** app không gửi thông báo hoàn thành hay phát tiếng báo. Đèn **Done** trên tab vẫn phản ánh lượt thành công.
4. **Given** người dùng đã tắt thông báo hoặc tiếng báo, **When** đóng Settings hoặc khởi động lại app, **Then** mọi tùy chọn đã lưu vẫn được áp dụng.
5. **Given** thông báo hoàn thành đã được tắt, **When** người dùng bật lại, **Then** app dùng tùy chọn tiếng báo đã lưu trước đó và chỉ thông báo cho các lượt mới.

### Edge Cases

- Nếu người dùng đổi tùy chọn khi agent đang làm việc, áp dụng lựa chọn hiện tại khi lượt hoàn thành.
- Nếu hệ điều hành chặn thông báo hoặc âm thanh, bật tùy chọn trong Herdsman vẫn chịu các giới hạn đó.
- Khôi phục tùy chọn không phát lại những lượt đã hoàn thành trước đó.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — **Settings** MUST có mục **Notifications**, truy cập được bằng chuột và bàn phím, với hai tùy chọn **Agent completion notifications** và **Play completion sound**.
- **FR-002** — Tắt **Agent completion notifications** MUST tắt thông báo hoàn thành và tiếng báo. Tùy chọn tiếng báo MUST ngừng tương tác trong lúc thông báo tắt và giữ lựa chọn đã lưu khi người dùng bật lại.
- **FR-003** — Khi thông báo đang bật, tắt **Play completion sound** MUST giữ thông báo hoàn thành đủ điều kiện ở chế độ im lặng. Bật lại MUST khôi phục tiếng “ting” theo quyền và cài đặt hệ điều hành.
- **FR-004** — Tùy chọn MUST áp dụng cho mọi Session kể từ lượt đủ điều kiện tiếp theo mà không cần khởi động lại. App MUST lưu hai lựa chọn qua lần mở lại. Cả hai mặc định bật cho cấu hình chưa có tùy chọn.
- **FR-005** — Các tùy chọn MUST chỉ tác động đến thông báo hoàn thành. Đèn trạng thái Session và luồng báo cần phê duyệt hoặc lỗi tiếp tục hoạt động theo quy tắc hiện hành.

### Key Entities *(include if feature involves data)*

- **Tùy chọn thông báo hoàn thành** — Hai lựa chọn cấp ứng dụng về việc gửi thông báo và phát tiếng báo, dùng chung cho mọi Session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Người dùng tìm được mục **Notifications** và đổi được một tùy chọn từ cửa sổ Settings trong vòng 15 giây bằng chuột hoặc bàn phím.
- **SC-002** — Với quyền hệ điều hành được bật và app ở nền, kiểm tra 5 lượt thành công cho mỗi cấu hình. Cấu hình đầy đủ cho 5 thông báo có tiếng, cấu hình im lặng cho 5 thông báo không tiếng, cấu hình tắt cho 0 thông báo và 0 tiếng. Cả 15 lượt đều hiện **Done** trên tab tương ứng.
- **SC-003** — Cả hai tùy chọn được giữ đúng qua 3 lần khởi động lại. Sau mỗi lần bật lại thông báo, lượt mới dùng đúng lựa chọn tiếng báo đã lưu và có 0 thông báo phát lại.

## Assumptions

- Phạm vi ban đầu là thông báo hoàn thành vừa được bổ sung. Các thông báo cần duyệt và báo lỗi giữ cách hoạt động hiện có.
- Tắt thông báo hoàn thành cũng tắt tiếng báo. Tùy chọn tiếng báo dùng để chuyển giữa thông báo có tiếng và im lặng khi thông báo đang bật.
- Quyền thông báo, âm lượng và chế độ tập trung do hệ điều hành quản lý.
