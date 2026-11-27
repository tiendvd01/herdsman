# Feature Specification: Mở đường dẫn thư mục ẩn

**Created**: 2026-11-27

**Status**: Draft

**Input**: Rà soát các luồng đọc thư mục, bao gồm thư mục ẩn trong project và `~/.claude`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tìm và mở tệp ẩn (Priority: P1)

Người dùng có thể duyệt thư mục ẩn trong project hoặc nhập đường dẫn bắt đầu bằng `~/` để tìm tệp ở thư mục cá nhân.

**Independent Test**: Tạo tệp thử trong `.claude` của project và một thư mục ẩn trong thư mục cá nhân. Tìm và mở mỗi tệp từ Files.

**Acceptance Scenarios**

1. **Given** project có `.claude/test.md`, **When** người dùng mở cây Files hoặc tìm theo tên tệp, **Then** tệp xuất hiện và mở được.
2. **Given** có tệp văn bản tại `~/.claude/test.md`, **When** người dùng nhập đường dẫn đó vào ô tìm kiếm Files, **Then** ứng dụng trả về cùng tệp như khi nhập đường dẫn tuyệt đối và cho phép mở tệp.
3. **Given** thẻ Edit trỏ tới một tệp trong workspace, **When** người dùng kích hoạt đường dẫn trên thẻ, **Then** ứng dụng mở đúng tệp trong Files.

### Edge Cases

- Đường dẫn thư mục cá nhân có thể chứa khoảng trắng. Quy tắc mở tệp ngoài project áp dụng cho cả hai cách nhập.
- Thư mục dữ liệu Git và quyền truy cập hệ điều hành tuân theo các quy tắc hiện có.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Files MUST hỗ trợ duyệt và tìm tệp trong thư mục ẩn thuộc project theo cùng quy tắc dành cho thư mục thường.
- **FR-002**: Files MUST diễn giải tiền tố `~/` là thư mục cá nhân khi người dùng nhập đường dẫn trực tiếp.
- **FR-003**: Thẻ Edit MUST cho phép mở tệp của workspace bằng chuột hoặc bàn phím, độc lập với nút thu gọn.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cả hai cách nhập, `~/` và đường dẫn tuyệt đối tương ứng, tìm được cùng tệp trong thư mục ẩn.
- **SC-002**: Một lần kích hoạt đường dẫn trên thẻ Edit hợp lệ mở đúng tệp trong Files.

## Assumptions

- Đường dẫn ngoài workspace được nhập chủ động qua Files. Quyền truy cập liên kết trong hội thoại dựa trên phạm vi workspace.
