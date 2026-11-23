# Feature Specification: Chuyển vòng quay lên đầu hàng workspace

**Created**: 2026-11-23

**Status**: Draft

**Input**: User description: "Đưa icon loading ở cuối hàng workspace vào vị trí icon bên trái được đánh dấu trong ảnh, để bố cục ổn định khi rê chuột."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Theo dõi workspace đang chạy khi rê chuột (Priority: P1)

Khi nhìn danh sách workspace ở thanh bên, người dùng thấy vòng quay ở ngay trước tên workspace đang chạy. Khi rê chuột để mở menu, tên workspace và số đếm phiên giữ nguyên vị trí.

**Why this priority**: Người dùng có thể nhận biết workspace đang chạy và mở menu với tên hàng giữ nguyên vị trí và phần chữ hiển thị.

**Independent Test**: Dùng một workspace có tên dài và phiên đang làm việc. Rê chuột vào rồi ra khỏi hàng, mở rồi đóng menu, sau đó cho phiên ngừng làm việc. Quan sát vị trí icon, phần tên hiển thị, số đếm phiên và nút menu.

**Acceptance Scenarios**:

1. **Given** workspace có phiên bắt đầu làm việc, **When** hàng cập nhật trạng thái, **Then** một vòng quay thay icon workspace ngay trước tên và đó là vòng quay duy nhất trên hàng.
2. **Given** hàng đang hiện vòng quay, **When** người dùng rê chuột vào hoặc ra khỏi hàng, hoặc mở hay đóng menu, **Then** vị trí vòng quay, vùng tên (kể cả phần tên nhìn thấy), số đếm và vị trí dành cho nút menu giữ nguyên. Menu vẫn mở được.
3. **Given** workspace còn ít nhất hai phiên đang làm việc, **When** một phiên ngừng, **Then** hàng tiếp tục hiện đúng một vòng quay. Khi phiên cuối cùng ngừng, icon workspace tương ứng trở lại đúng vị trí cũ.
4. **Given** workspace vừa có phiên đang làm việc vừa có phiên cần chú ý, **When** người dùng nhìn hàng, **Then** vòng quay và dấu hiệu cần chú ý cùng hiển thị, và số đếm phản ánh số phiên theo quy tắc hiện có.

### Edge Cases

- Tên dài trong thanh bên hẹp giữ cùng điểm cắt trước và sau khi rê chuột hoặc mở menu ở cùng độ rộng.
- Cả workspace dùng thư mục dự án và workspace dùng worktree đều trả về đúng loại icon sau khi phiên cuối cùng ngừng làm việc.
- Với tùy chọn giảm chuyển động, người dùng vẫn nhận ra trạng thái đang làm việc qua dấu hiệu hiện có.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hàng workspace ở thanh bên MUST hiển thị đúng một vòng quay tại vị trí icon bên trái tên khi có ít nhất một phiên đang làm việc. Mỗi hàng chỉ có vòng quay ở vị trí này.
- **FR-002**: Khi workspace hết phiên đang làm việc, hàng MUST hiển thị icon loại workspace tương ứng ở cùng vị trí.
- **FR-003**: Ở cùng độ rộng thanh bên và với nội dung hàng không đổi, thao tác rê chuột vào hoặc ra và mở hoặc đóng menu MUST giữ nguyên vị trí icon, vùng tên, điểm cắt tên nếu có, số đếm và vùng dành cho nút menu. Việc đổi giữa icon và vòng quay MUST giữ nguyên vùng tên nếu các trạng thái hiển thị khác không đổi.
- **FR-004**: Trong khi vòng quay hiển thị, người dùng MUST vẫn xem được số đếm phiên và dấu hiệu cần chú ý khi có, mở được menu workspace và nhận biết được trạng thái đang làm việc qua trình đọc màn hình hoặc khi bật giảm chuyển động.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Với cả hai loại workspace, kiểm tra lần lượt 0, 1 và 2 phiên đang làm việc cho kết quả 0, 1 và 1 vòng quay. Mọi vòng quay đều nằm ngay trước tên.
- **SC-002**: Với tên ngắn và tên bị cắt, độ dịch chuyển của icon, vùng tên, số đếm và vùng dành cho nút menu là 0 pixel giữa các trạng thái thường, rê chuột và mở menu ở cùng độ rộng. Tên bị cắt hiển thị cùng số ký tự trong cả ba trạng thái.
- **SC-003**: Người kiểm tra có thể nhận biết workspace nào đang làm việc trước khi rê chuột, rồi mở menu ngay trên hàng đó ở cả hai loại workspace.

## Assumptions

- Vùng đánh dấu trong ảnh là vị trí icon hiện tại của workspace, ngay bên trái tên.
- Phạm vi là các hàng workspace hiển thị ở thanh bên. Đặc tả dùng quy tắc hiện có để xác định phiên đang làm việc và phiên cần chú ý.
