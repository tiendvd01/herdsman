# Feature Specification: Hiện pull request dưới worktree

**Feature Branch**: `master`

**Created**: 2026-11-26

**Status**: Ready for implementation

**Input**: Hiện liên kết pull request bên dưới worktree như ảnh mẫu.

## User Scenarios & Testing

### User Story 1 - Xem và mở PR từ worktree (Priority: P1)

Developer nhìn thấy số và trạng thái PR ngay dưới workspace dùng worktree, sau đó mở PR trên GitHub bằng một thao tác.

**Why this priority**: Người dùng đang làm việc ở một nhánh có thể đến thẳng PR từ danh sách hiện tại.

**Independent Test**: Mở Projects với worktree có PR mở, draft, đã merge hoặc đã đóng rồi kích hoạt từng liên kết.

**Acceptance Scenarios**:

1. **Given** một worktree có các PR cùng repository và nhánh nguồn, **When** dữ liệu PR sẵn sàng, **Then** mỗi PR xuất hiện một lần dưới tên worktree với biểu tượng trạng thái và số PR.
2. **Given** liên kết PR hiện trong sidebar, **When** người dùng kích hoạt bằng chuột hoặc bàn phím, **Then** GitHub mở đúng PR và workspace đang chọn được giữ nguyên.
3. **Given** nhánh chỉ trùng tên ở repository khác, workspace dùng thư mục project, hoặc worktree không có PR phù hợp, **When** sidebar hiển thị, **Then** các workspace đó không có dòng PR thừa.
4. **Given** PR đổi trạng thái hoặc tài khoản GitHub được đổi, **When** dữ liệu được cập nhật, **Then** sidebar phản ánh dữ liệu của tài khoản hiện tại.

### Edge Cases

- Một nhánh có thể có nhiều PR đến các nhánh đích khác nhau. PR đang mở và draft xuất hiện trước PR đã kết thúc.
- Worktree đã bị xóa hoặc thiếu nhánh không có liên kết. Khi mất mạng, sidebar có thể dùng dữ liệu sẵn có của cùng tài khoản. Khi mất quyền truy cập, liên kết tương ứng biến mất.

## Requirements

### Functional Requirements

- **FR-001**: Projects sidebar MUST hiển thị các liên kết dưới hàng worktree theo nhánh nguồn chính xác và GitHub repository của project.
- **FR-002**: Mỗi liên kết MUST có số PR, chỉ báo phân biệt Open, Draft, Merged và Closed, và tên trạng thái đọc được bằng công nghệ hỗ trợ.
- **FR-003**: Liên kết MUST mở đúng PR trên GitHub bằng chuột hoặc bàn phím, giữ nguyên lựa chọn workspace và không cản thao tác sắp xếp.
- **FR-004**: Dòng PR MUST vắng mặt khi không xác định được liên kết phù hợp. Dữ liệu tài khoản khác và dữ liệu của repository báo mất quyền MUST bị ẩn.
- **FR-005**: Dữ liệu MUST cập nhật theo lần đồng bộ Pull Requests hiện có, bao gồm mọi PR đang mở cùng repo và tối đa 50 PR đã kết thúc có cập nhật gần nhất trong repo, bất kể người tạo hoặc người được yêu cầu review.

### Key Entities

- **Worktree** có repository của project và tên nhánh dùng để làm việc.
- **PR liên kết** có số PR, trạng thái, nhánh nguồn và repository nguồn.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Trong dữ liệu mẫu gồm đủ bốn trạng thái và một PR từ fork trùng tên nhánh, 100% PR phù hợp xuất hiện đúng một lần và PR từ fork vắng mặt.
- **SC-002**: Người dùng mở được PR mong muốn bằng một lần kích hoạt từ sidebar, với workspace đang chọn được giữ nguyên.

## Assumptions

- Hỗ trợ PR có nhánh nguồn và nhánh đích cùng GitHub repository của project. Chế độ theo dõi PR hiện có cung cấp tài khoản, chu kỳ cập nhật và quyền truy cập.
- Số PR mở bản gốc trên GitHub theo hành vi Open on GitHub hiện có.
