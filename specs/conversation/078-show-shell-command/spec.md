# Feature Specification: Hiện toàn bộ lệnh shell

**Feature Branch**: `master`

**Created**: 2026-11-26

**Status**: Ready for planning

**Input**: Khi mở thẻ Bash, hiện trực tiếp toàn bộ lệnh thay cho khối tham số JSON.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đọc lệnh đã chạy (Priority: P1)

Người dùng mở thẻ Bash trong hội thoại để đọc và sao chép chính xác lệnh của agent.

**Why this priority**: Tiêu đề có thể rút gọn lệnh dài và khối tham số khiến việc đọc hoặc sao chép mất thêm thao tác.

**Independent Test**: Mở một thẻ Bash chứa lệnh dài nhiều dòng, sau đó đối chiếu nội dung với lệnh gốc và kiểm tra trạng thái, kết quả.

**Acceptance Scenarios**:

1. **Given** thẻ Bash có lệnh dài và tham số bổ sung, **When** người dùng mở thẻ, **Then** phần lệnh hiển thị nguyên văn và chỉ chứa nội dung lệnh.
2. **Given** thẻ Bash có output hoặc trạng thái đang chạy, **When** người dùng mở thẻ, **Then** output và trạng thái hiện theo hành vi sẵn có.
3. **Given** một thẻ Bash từ lịch sử có lệnh, **When** người dùng mở thẻ, **Then** họ đọc được toàn bộ lệnh như với thẻ mới.

### Edge Cases

- Lệnh nhiều dòng, có dấu nháy, khoảng trắng hoặc ký tự giống markup giữ nguyên nội dung.
- Thẻ Bash thiếu lệnh hợp lệ vẫn hiển thị thông tin đầu vào đang có.
- Các thẻ công cụ khác tiếp tục hiển thị đầu vào hoặc diff như trước.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Thẻ Bash khi mở MUST hiển thị trực tiếp toàn bộ lệnh nếu có lệnh dạng văn bản không rỗng.
- **FR-002**: Phần lệnh MUST giữ nguyên ký tự, xuống dòng và khoảng trắng. Người dùng có thể chọn văn bản và đọc toàn bộ lệnh trong vùng chi tiết.
- **FR-003**: Thẻ MUST duy trì hành vi đóng mở, trạng thái và output hiện có, kể cả thẻ phát lại từ lịch sử.
- **FR-004**: Hệ thống MUST duy trì cách trình bày cũ cho thẻ khác và thẻ Bash thiếu lệnh hợp lệ.

### Key Entities

- **Thẻ Bash**: Đại diện cho một lần gọi công cụ shell, có lệnh, trạng thái và output nếu có.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sau một thao tác mở thẻ, người dùng thấy phần lệnh và có thể đọc hoặc sao chép đủ 100% nội dung của mẫu lệnh dài nhiều dòng.
- **SC-002**: Cả hai trường hợp thẻ trực tiếp và thẻ từ lịch sử đều hiển thị đúng lệnh khi có dữ liệu.
- **SC-003**: Các mẫu thẻ đang chạy, thất bại, không có output, thiếu lệnh và công cụ khác vẫn hiển thị đúng thông tin tương ứng.

## Assumptions

- Phạm vi là thẻ công cụ trong hội thoại. Các thao tác duyệt quyền dùng luồng hiện có.
- Thẻ đã lưu sử dụng trực tiếp dữ liệu lệnh có sẵn.
