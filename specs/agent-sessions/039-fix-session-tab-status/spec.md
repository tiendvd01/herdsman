# Feature Specification: Sửa đèn báo khi đóng tab Session

**Feature Branch**: `master`

**Created**: 2026-11-24

**Status**: Refined

**Refined**: 2026-11-24 — Làm rõ đèn báo khi lượt thành công, lỗi, bị ngắt hoặc bắt đầu lượt tiếp theo.

**Input**: User description: "Fix lại trạng thái của tab session, đèn hiệu của nó, ấn tắt thì lại thành màu xanh khi ấn tắt"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Nhận biết trạng thái khi đóng tab Session (P1)

Là người dùng Herdsman, tôi muốn đèn báo trên tab Session phản ánh đúng trạng thái khi đóng tab để biết agent đã dừng hay thực sự hoàn thành lượt làm việc.

**Why this priority** — Đèn xanh xuất hiện khi bấm tắt dễ khiến người dùng hiểu nhầm rằng agent vừa hoàn thành công việc.

**Independent Test** — Mở một Session đang làm việc, bấm nút đóng tab, xác nhận **Stop and close** rồi quan sát đèn báo từ lúc xác nhận đến khi tab biến mất.

**Acceptance Scenarios**

1. **Given** Session đang làm việc hoặc chờ phê duyệt, **When** người dùng xác nhận **Stop and close** và thao tác thành công, **Then** đèn báo không chuyển sang xanh **Done** do thao tác dừng và tab biến mất sau khi đóng thành công.
2. **Given** Session đang làm việc hoặc chờ phê duyệt, **When** người dùng mở hộp thoại đóng rồi hủy, **Then** tab vẫn mở và đèn báo tiếp tục phản ánh trạng thái hiện tại của Session.
3. **Given** người dùng đã xác nhận đóng, **When** thao tác thất bại, **Then** tab vẫn mở, ứng dụng báo lỗi và đèn báo phản ánh trạng thái thực tế của Session.
4. **Given** Session đang làm việc, **When** agent tự hoàn thành lượt khi tab vẫn mở và người dùng chưa xác nhận đóng, **Then** đèn báo chuyển xanh **Done** cho mọi lượt hoàn thành thành công, kể cả ở tab nền. Session vẫn mở và có thể nhận prompt tiếp theo.
5. **Given** người dùng đang đóng một Session, **When** một tab Session khác được chọn hoặc agent của tab đó đổi trạng thái, **Then** đèn báo của tab kia phản ánh trạng thái của chính Session đó.
6. **Given** tab đang hiện **Done**, **When** agent bắt đầu lượt tiếp theo, **Then** đèn chuyển sang **Working**.
7. **Given** agent đang làm việc, **When** lượt kết thúc có lỗi hoặc bị người dùng ngắt, **Then** tab hiển thị trạng thái tương ứng và không báo **Done** cho lượt đó.

### Edge Cases

- Nếu thao tác đóng phản hồi chậm, tab có thể còn hiển thị trong lúc chờ nhưng đèn báo không được nháy xanh do thao tác dừng.
- Nếu trạng thái **Done** đã hiển thị trước khi người dùng bấm đóng, đèn có thể giữ trạng thái đó cho đến khi tab biến mất.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Việc xác nhận dừng và đóng tab MUST NOT làm đèn báo chuyển sang xanh **Done** khi lượt làm việc bị dừng giữa chừng, kể cả trong lúc chờ tab biến mất.
- **FR-002** — Khi thao tác đóng thành công, tab Session MUST biến mất. Khi người dùng hủy, tab MUST vẫn mở và tiếp tục hiển thị trạng thái thực tế.
- **FR-003** — Khi thao tác đóng thất bại, ứng dụng MUST giữ tab mở, báo lỗi và hiển thị trạng thái thực tế của Session.
- **FR-004** — Tab còn mở MUST hiển thị **Done** khi agent hoàn thành thành công một lượt, kể cả ở tab nền. Session MUST tiếp tục nhận prompt và hiển thị **Working** khi lượt kế tiếp bắt đầu. Lượt lỗi hoặc bị ngắt MUST hiển thị trạng thái tương ứng và không được báo **Done**. Việc đóng một tab MUST NOT tự đổi đèn báo trên tab Session khác.

### Key Entities *(include if feature involves data)*

- **Session** — Một phiên làm việc với agent. Đèn báo trên tab tương ứng biểu thị trạng thái của phiên.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Với mỗi chế độ sáng và tối, đèn báo có 0 lần chuyển sang xanh **Done** do thao tác đóng trong 10 lần đóng Session đang làm việc và 10 lần đóng Session đang chờ phê duyệt. Mỗi nhóm có ít nhất một lần phản hồi chậm.
- **SC-002** — Trong cả 7 kịch bản chấp nhận, người dùng quan sát được đúng kết quả cho tab và đèn báo.

## Assumptions

- “Bấm tắt” là bấm nút đóng trên tab Session, bao gồm xác nhận **Stop and close** khi cần.
- Phạm vi là đèn báo và vòng đời hiển thị của tab Session trong workspace. Đèn xanh **Done** hiện biểu thị agent đã hoàn thành lượt làm việc.
