# Feature Specification: Tooltip cho chữ bị cắt

**Feature Branch**: `master`

**Created**: 2026-11-23

**Status**: Draft

**Input**: Hover các đoạn chữ bị cắt như tên workspace hay tên session thì hiện tooltip đầy đủ.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đọc đầy đủ tên và nhãn bị cắt (Priority: P1)

Người dùng di chuột lên nhãn bị cắt để đọc đầy đủ nội dung ngay tại chỗ.

**Why this priority**: Người dùng có thể phân biệt các workspace hoặc session có cùng phần đầu tên mà vẫn giữ giao diện gọn.

**Independent Test**: Thu hẹp sidebar hoặc vùng tab cho tên dài bị cắt, sau đó di chuột lên tên.

**Acceptance Scenarios**

1. **Given** tên workspace hoặc session đang bị cắt, **When** người dùng hover tên, **Then** tooltip hiện đầy đủ tên đúng của mục đó.
2. **Given** một nhãn giao diện đang hiển thị hết, **When** người dùng hover, **Then** không xuất hiện tooltip dành cho chữ bị cắt.
3. **Given** tooltip đang mở, **When** con trỏ rời nhãn hoặc người dùng nhấn Escape, **Then** tooltip đóng và bố cục giữ nguyên.

### Edge Cases

- Sau khi đổi kích thước, mức thu phóng hoặc nội dung nhãn, lần hover kế tiếp phản ánh đúng nội dung và tình trạng cắt hiện tại.
- Tooltip vẫn đọc được khi nhãn nằm sát mép cửa sổ hoặc nội dung có một từ rất dài.
- Hai nhãn có cùng phần đầu hiển thị phải mở đúng nội dung riêng của từng nhãn.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** App MUST hiển thị tooltip chứa nguyên văn của nhãn giao diện bị rút gọn khi người dùng hover, gồm tên workspace và session ở mọi vị trí có thể bị cắt.
- **FR-002** App MUST chỉ mở tooltip này khi nội dung thực sự bị cắt trong bố cục hiện tại.
- **FR-003** App MUST cho phép đóng tooltip khi con trỏ rời nhãn hoặc người dùng nhấn Escape.
- **FR-004** Tooltip MUST giữ nguyên bố cục và các thao tác sẵn có của mục bên dưới, đồng thời cho phép đọc tên dài sát mép cửa sổ.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** Trong 100% trường hợp thử tên workspace và session bị cắt ở sidebar, breadcrumb, tab, tìm kiếm và lịch sử, người dùng đọc được đầy đủ tên trong vòng một giây sau khi hover.
- **SC-002** Trong 100% trường hợp đối chứng với cùng nhãn hiển thị đầy đủ, hover không mở tooltip dành cho chữ bị cắt.
- **SC-003** Người dùng phân biệt đúng hai workspace hoặc session trùng phần đầu tên ngay lần hover đầu tiên, qua kiểm tra chấp nhận.

## Assumptions

- Áp dụng cho nhãn văn bản được giao diện chủ động rút gọn, gồm cả đoạn xem trước nhiều dòng. Nội dung hội thoại cuộn và phần hiển thị của bản thân ảnh nằm ngoài phạm vi.
- Tương tác chính dùng con trỏ trên desktop.

## Bổ sung sau kiểm thử

- Workspace và session chưa có tên dùng tiêu đề do người dùng đặt trong Claude hoặc tiêu đề tóm tắt do Claude tạo. Khi chưa có tiêu đề, nhãn mặc định là “New workspace” hoặc “New session”. Tooltip hiển thị đầy đủ tiêu đề khi nhãn bị cắt.
- Khi mở app lần đầu sau cập nhật, tên tự sinh cũ khớp với prompt gốc trong lịch sử hội thoại sẽ được dọn. Tiêu đề từ Claude được áp dụng khi có.
