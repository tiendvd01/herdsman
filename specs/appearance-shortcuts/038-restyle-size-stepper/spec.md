# Feature Specification: Đổi giao diện nút chỉnh cỡ chữ code

**Feature Branch**: `master`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Thay UI nút tăng giảm size theo ảnh mẫu và theo phong cách shadcn/ui."

## User Scenarios & Testing

### User Story 1 — Xem và chỉnh cỡ chữ code (P1)

Là người dùng Herdsman, tôi muốn thấy cỡ chữ hiện tại giữa hai nút điều chỉnh trong cùng một cụm để dễ đọc và thay đổi giá trị.

**Why this priority** — Đây là thao tác trực tiếp trong mục **Code font size**.

**Independent Test** — Mở **Settings → Appearance**, quan sát cụm điều khiển rồi thử tăng và giảm bằng chuột và bàn phím.

**Acceptance Scenarios**

1. Khi mở **Appearance** trong giao diện sáng hoặc tối, mục **Code font size** hiển thị một cụm ngang có nền chung, viền ngoài bo góc, nút **−** bên trái, số ở giữa và nút **+** bên phải.
2. Khi giá trị là 13, bấm **+** một lần hiển thị 14 ngay. Bấm **−** một lần hiển thị lại 13. Số vẫn nằm chính giữa khi giá trị đổi.
3. Khi dùng Tab để đến một nút khả dụng, nút có dấu hiệu focus dễ thấy và có thể kích hoạt bằng bàn phím. Công nghệ hỗ trợ đọc được tên tiếng Anh phân biệt hai nút và giá trị hiện tại.
4. Khi đã chọn một cỡ chữ riêng, người dùng vẫn có thể dùng **Reset** để trở về cỡ mặc định. Khi mở lại ứng dụng sau khi chọn một cỡ riêng, cụm hiển thị giá trị đã lưu.

### Edge Cases

- Ở 10 px, nút **−** bị vô hiệu hóa và nút **+** vẫn hoạt động. Ở 24 px, nút **+** bị vô hiệu hóa và nút **−** vẫn hoạt động.
- Khi chưa chọn cỡ riêng, cụm hiển thị cỡ chữ mặc định đang áp dụng.

## Requirements

### Functional Requirements

- **FR-001** Mục **Code font size** phải trình bày **−**, giá trị hiện tại và **+** theo thứ tự trái sang phải trong một cụm nền chung có viền ngoài bo góc. Số phải nằm giữa cụm.
- **FR-002** Cụm điều khiển phải theo phong cách shadcn/ui New York của Herdsman về màu sắc, viền, bo góc và typography trong cả giao diện sáng và tối. Nút phải thể hiện rõ các trạng thái hover, focus và vô hiệu hóa.
- **FR-003** Mỗi lần kích hoạt nút khả dụng phải đổi đúng 1 px và cập nhật số ngay trong khoảng 10–24 px. Nút theo hướng vượt giới hạn phải bị vô hiệu hóa.
- **FR-004** Hai nút phải thao tác được bằng bàn phím khi khả dụng. Công nghệ hỗ trợ phải nhận biết tên tiếng Anh của từng nút và giá trị đang hiển thị.
- **FR-005** Luồng áp dụng, lưu lựa chọn và **Reset** phải tiếp tục hoạt động theo đặc tả cỡ chữ code hiện có.

## Success Criteria

### Measurable Outcomes

- **SC-001** Trong cả hai giao diện sáng và tối, người dùng thấy đủ ba phần theo đúng thứ tự trong một khung chung và phân biệt được nút đang focus với nút bị vô hiệu hóa.
- **SC-002** Với giá trị 13, một lần kích hoạt **+** và một lần kích hoạt **−** lần lượt hiển thị 14 và 13 ngay, khi thử bằng chuột hoặc bàn phím.
- **SC-003** Ở cả hai giá trị biên 10 và 24, đúng một nút bị vô hiệu hóa. Một lần mở lại ứng dụng sau khi đổi cỡ chữ hiển thị đúng giá trị đã lưu, và một lần **Reset** hiển thị lại cỡ mặc định đang áp dụng.

## Assumptions

- Phạm vi là cụm **Code font size** trong **Settings → Appearance**, đã được mô tả ở [đặc tả cỡ chữ code](../036-code-font-settings/spec.md).
- Ảnh mẫu xác định bố cục. Số 13 là ví dụ, còn kích thước, màu sắc và khoảng cách theo phong cách giao diện hiện hành của Herdsman.
