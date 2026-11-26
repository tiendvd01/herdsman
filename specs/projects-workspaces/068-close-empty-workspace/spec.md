# Feature Specification — Đóng workspace khi đóng session cuối

**Feature Branch** `master`

**Created** 2026-11-26

**Status** Draft

**Input** Fix lỗi tắt session cuối trong workspace không tắt cả workspace.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Rời workspace sau khi đóng session cuối (P1)

Khi hoàn thành công việc ở workspace, người dùng muốn trở về project ngay sau khi đóng session cuối để có thể tiếp tục ở workspace khác.

**Independent Test** Đóng session duy nhất trong workspace chỉ có một tab và xác nhận. Kiểm tra app trở về project trong cùng thao tác.

**Acceptance Scenarios**

1. Khi session là tab duy nhất, xác nhận đóng qua nút trên tab hoặc phím tắt sẽ đóng cả session và màn hình workspace.
2. Khi session cuối đang chạy hoặc chờ duyệt, hộp thoại cảnh báo việc dừng agent. Xác nhận dừng sẽ đóng cả session và màn hình workspace nếu hàng tab trống.
3. Khi còn session, terminal, file hoặc diff, đóng session giữ workspace mở. Nếu tab đang xem bị đóng, app chuyển sang tab còn lại.
4. Khi hủy hoặc thao tác đóng thất bại, session và workspace vẫn mở. Nếu thất bại, app báo lỗi và cho thử lại.

### Edge Cases

- Nếu người dùng chuyển workspace trong lúc thao tác đang xử lý, kết quả đóng session không làm đổi workspace mới.
- Tab mở trong lúc xử lý được xét khi quyết định hàng tab còn nội dung hay đã trống.
- Session chỉ có trong lịch sử không được tính là tab đang mở.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** Sau khi đóng session thành công, app tự đóng màn hình workspace nếu hàng tab trống và người dùng vẫn đang ở workspace đó. Nút trên tab và phím tắt áp dụng cùng quy tắc.
- **FR-002** Hộp thoại đóng tab cuối cho biết workspace sẽ đóng cùng session trong một lần xác nhận. Với agent đang chạy hoặc chờ duyệt, hộp thoại vẫn cảnh báo việc dừng agent.
- **FR-003** Nếu còn tab, workspace vẫn mở. Khi đóng tab đang chọn, app ưu tiên tab tiếp theo rồi tab trước đó.
- **FR-004** Khi hủy hoặc đóng thất bại, workspace và session vẫn hiện. App báo lỗi khi thất bại và cho thử lại.
- **FR-005** Đóng màn hình workspace giữ project đang chọn, dữ liệu workspace và lịch sử session. Workspace có thể mở lại từ project.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** Cả hai cách đóng tab cuối, qua nút và phím tắt, trở về project sau đúng một lần xác nhận khi hàng tab trống.
- **SC-002** Trong từng kịch bản có tab còn lại, hủy hoặc lỗi, workspace vẫn mở. Trong kịch bản đã chuyển workspace, lựa chọn mới được giữ nguyên.

## Assumptions

- Workspace được đóng ở cấp hiển thị. Người dùng vẫn có thể mở lại workspace và truy cập lịch sử.
- File và diff hiển thị trên hàng tab được tính cùng session và terminal khi xác định workspace còn nội dung để xem.
- Tái hiện hồi quy bằng các bài test đóng session hiện có.
