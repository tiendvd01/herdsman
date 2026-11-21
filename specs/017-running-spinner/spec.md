# Feature Specification: Vòng quay "đang chạy" cho workspace và tab agent

**Feature Branch**: `017-running-spinner`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "Thêm loading quay tròn cho workspace đang có agent chạy, và trên tab agent đang chạy cũng nên để loading quay tròn"

## Bối cảnh

Hiện tại khi một agent đang làm việc, người dùng chỉ thấy một chấm nhỏ nhấp nháy trên tab của phiên đó; ở thanh bên, workspace chỉ hiện một con số đếm phiên còn sống, không cho biết có agent đang thực sự chạy hay không. Khi có nhiều workspace và nhiều tab, rất khó nhìn lướt để biết "chỗ nào đang chạy". Một vòng quay (spinner) là tín hiệu quen thuộc, dễ nhận ra hơn chấm nhấp nháy.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tab agent đang chạy hiện vòng quay (Priority: P1)

Người dùng mở một workspace có nhiều tab phiên. Tab nào có agent đang làm việc hiển thị vòng quay thay cho chấm trạng thái; khi agent dừng, vòng quay biến mất và trạng thái trở về dấu hiệu bình thường (chờ duyệt, xong, lỗi, rảnh).

**Why this priority**: là nơi người dùng nhìn nhiều nhất để biết agent nào đang chạy; mang lại giá trị ngay cả khi chưa có phần thanh bên.

**Independent Test**: Cho một phiên chuyển sang trạng thái đang chạy → tab của phiên đó có vòng quay; chuyển sang xong → vòng quay mất, hiện chấm "xong".

**Acceptance Scenarios**:

1. **Given** một phiên đang ở trạng thái làm việc, **When** nhìn thanh tab, **Then** tab của phiên đó hiện vòng quay ở vị trí chấm trạng thái, các tab khác không có vòng quay.
2. **Given** tab đang quay, **When** agent chuyển sang chờ duyệt / xong / lỗi, **Then** vòng quay dừng và được thay bằng dấu hiệu của trạng thái mới.
3. **Given** hai phiên cùng chạy trong một workspace, **When** nhìn thanh tab, **Then** cả hai tab đều quay độc lập.
4. **Given** một tab đang quay, **When** người dùng dùng trình đọc màn hình, **Then** trạng thái "đang làm việc" vẫn được thông báo như hiện nay.

---

### User Story 2 - Workspace có agent chạy hiện vòng quay ở thanh bên (Priority: P1)

Ở thanh bên, workspace nào có ít nhất một agent đang làm việc thì hiện vòng quay cạnh tên, để người dùng nhìn lướt danh sách dự án/workspace là biết chỗ nào đang chạy, kể cả khi đang xem workspace khác hoặc thanh bên đang thu gọn một dự án.

**Why this priority**: giải quyết nhu cầu "chạy song song nhiều workspace mà vẫn theo dõi được".

**Independent Test**: Có hai workspace, chỉ một có agent chạy → chỉ workspace đó có vòng quay; khi agent xong, vòng quay mất.

**Acceptance Scenarios**:

1. **Given** workspace có ít nhất một agent đang làm việc, **When** nhìn thanh bên, **Then** workspace đó hiện vòng quay, kể cả khi không phải workspace đang chọn.
2. **Given** workspace có nhiều agent đang chạy, **When** nhìn thanh bên, **Then** chỉ hiện một vòng quay duy nhất cho workspace đó.
3. **Given** workspace chỉ có phiên đang chờ duyệt, lỗi, xong hoặc rảnh (không phiên nào làm việc), **When** nhìn thanh bên, **Then** không có vòng quay; dấu hiệu "chờ duyệt" hiện có vẫn giữ nguyên.
4. **Given** workspace vừa quay, **When** agent cuối cùng trong workspace dừng làm việc, **Then** vòng quay biến mất ngay.

---

### Edge Cases

- Workspace vừa có phiên đang chạy vừa có phiên chờ duyệt: hiện cả vòng quay lẫn dấu hiệu chờ duyệt, không che nhau.
- Tên workspace dài: vòng quay không làm tên bị đẩy ra ngoài hay làm lệch hàng; con số đếm phiên vẫn hiển thị.
- Người dùng bật chế độ giảm chuyển động của hệ điều hành: vòng quay không xoay liên tục nhưng vẫn phân biệt được với trạng thái không chạy.
- Phiên hiện trong lịch sử / bảng tìm nhanh với trạng thái làm việc: giữ nguyên cách hiển thị hiện có (ngoài phạm vi), không mâu thuẫn về nghĩa.
- Thanh bên thu gọn dự án: workspace bị ẩn không hiện vòng quay; xem User Story 2 về dự án thu gọn trong Assumptions.
- Theme Light, Paper, Dark: vòng quay phải đủ tương phản trên cả ba, dùng màu "đang làm việc" sẵn có.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tab của phiên có agent đang làm việc MUST hiện vòng quay tại vị trí chấm trạng thái; các trạng thái khác giữ chấm hiện có.
- **FR-002**: Workspace trong thanh bên có ít nhất một agent đang làm việc MUST hiện đúng một vòng quay.
- **FR-003**: Vòng quay MUST xuất hiện và biến mất theo trạng thái làm việc thời gian thực, không cần tải lại hay đổi workspace.
- **FR-004**: Trạng thái "chờ duyệt" và "lỗi" MUST không bị coi là đang chạy, và dấu hiệu hiện có của chúng MUST được giữ.
- **FR-005**: Vòng quay MUST dùng màu "đang làm việc" của bộ màu hiện tại và đọc rõ trên mọi theme có sẵn.
- **FR-006**: Vòng quay MUST có tên truy cập (accessible name) "Working" tương đương chấm hiện tại, không gây thêm tiếng thông báo lặp.
- **FR-007**: Khi người dùng bật giảm chuyển động, vòng quay MUST không xoay liên tục.
- **FR-008**: Vòng quay MUST không làm đổi kích thước hay vị trí các phần tử xung quanh (tab, tên, số đếm, nút menu) khi bật/tắt.
- **FR-009**: Vòng quay trên tab và trên workspace MUST có cùng kiểu hình ảnh để người dùng hiểu là cùng một ý nghĩa.

### Key Entities

- **Phiên (session)**: có trạng thái trực tiếp (rảnh, làm việc, chờ duyệt, xong, lỗi) và thuộc về một workspace.
- **Workspace**: nhóm các phiên; "đang chạy" khi có ít nhất một phiên ở trạng thái làm việc.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng nhận ra tab nào đang chạy chỉ bằng một lần nhìn thanh tab, không cần đọc chữ hay rê chuột (kiểm thử với ít nhất 5 người, ≥ 90% chỉ đúng tab đang chạy).
- **SC-002**: Với 5 workspace trong đó 2 đang chạy, người dùng chỉ đúng 2 workspace đó trong dưới 3 giây.
- **SC-003**: Vòng quay xuất hiện hoặc biến mất trong vòng 1 giây sau khi trạng thái làm việc của phiên thay đổi.
- **SC-004**: 100% trạng thái không phải "làm việc" không hiện vòng quay trên cả tab lẫn workspace.
- **SC-005**: Không có thay đổi bố cục (dịch chuyển phần tử) khi vòng quay bật/tắt, trên cả ba theme.

## Assumptions

- "Agent đang chạy" nghĩa là phiên ở trạng thái làm việc; chờ duyệt, lỗi, xong, rảnh không tính.
- Workspace chỉ hiện một vòng quay dù có nhiều phiên chạy; số phiên vẫn thể hiện qua con số đếm hiện có.
- Phạm vi: thanh tab của workspace và danh sách workspace ở thanh bên. Bảng tìm nhanh, lịch sử, bảng bên phải giữ nguyên.
- Với dự án thu gọn trong thanh bên, không thêm vòng quay lên hàng dự án (chỉ workspace); có thể mở rộng sau.
- Dùng lại trạng thái trực tiếp của phiên đã có sẵn trong ứng dụng; không cần dữ liệu mới.
- Nhãn ngữ trạng thái hiện có ("Working") được giữ nguyên.
