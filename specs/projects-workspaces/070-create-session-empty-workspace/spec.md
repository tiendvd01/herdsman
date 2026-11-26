# Feature Specification: Tạo session từ workspace trống

**Status**: Draft
**Created**: 2026-11-26
**Input**: Hiện hành động tạo session mới giữa workspace trống.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bắt đầu session trong workspace trống (Priority: P1)

Khi mở workspace và vùng nội dung chưa có tab, người dùng có thể bắt đầu session ngay từ giữa màn hình.

**Why this priority**: Người dùng có thể tiếp tục công việc ngay từ vùng đang nhìn.

**Independent Test**: Mở một workspace đang hoạt động với vùng tab trống, chọn **Create new session**, rồi chọn Codex hoặc Claude Code.

**Acceptance Scenarios**:

1. **Given** một workspace đang hoạt động đã tải xong với vùng tab trống, **When** người dùng mở workspace, **Then** nút **Create new session** hiển thị giữa vùng nội dung.
2. **Given** nút ở giữa đang hiển thị, **When** người dùng mở menu bằng chuột, bàn phím hoặc phím tắt hiện tại và chọn một agent, **Then** session mới thuộc workspace hiện tại, tab mới được chọn và nút giữa biến mất.
3. **Given** workspace có ít nhất một tab session, terminal, file hoặc diff, **When** người dùng xem workspace, **Then** hành động tạo session nằm trên thanh tab theo bố cục hiện tại.
4. **Given** người dùng đang ở màn hình trống của project sau khi đóng workspace, **When** vùng nội dung hiển thị, **Then** hành động **Create new workspace** vẫn khả dụng.

### Edge Cases

- Trong lúc tải tab lần đầu, màn hình chờ xác định trạng thái trống trước khi hiện nút giữa.
- Workspace đã lưu trữ giữ các hành động hiện có dành cho trạng thái đó.
- Khi đóng menu mà chưa chọn, người dùng có thể mở lại từ nút giữa. Khi tạo session thất bại, luồng hiện có báo lỗi và nút giữa vẫn có thể dùng lại.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Workspace đang hoạt động đã tải xong và có vùng tab trống MUST hiển thị nút **Create new session** giữa vùng nội dung.
- **FR-002**: Nút giữa và phím tắt tạo session MUST mở cùng menu hiện có với các lựa chọn và phím tắt của menu.
- **FR-003**: Chọn agent MUST tạo session trong workspace đang xem và chọn tab mới khi thành công.
- **FR-004**: Khi vùng tab có nội dung, workspace MUST dùng nút tạo session trên thanh tab. Màn hình project trống MUST giữ hành động tạo workspace hiện có.
- **FR-005**: Hành động ở giữa MUST hỗ trợ chuột và bàn phím, đồng thời theo quy ước nút chính của ứng dụng trong giao diện sáng và tối.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Mọi workspace đang hoạt động trong các tình huống kiểm thử có vùng tab trống sau khi tải đều hiển thị đúng một nút **Create new session** ở giữa.
- **SC-002**: Người dùng có thể bắt đầu một session sau hai lựa chọn, gồm mở menu và chọn agent. Tab mới được chọn khi yêu cầu thành công.
- **SC-003**: Trong cả bốn tình huống có tab session, terminal, file hoặc diff, nút giữa được ẩn và hành động trên thanh tab khả dụng.

## Assumptions

- Trạng thái trống dựa trên các tab đang mở. Workspace có session trong lịch sử vẫn có thể có vùng tab trống.
- Menu hiện có tiếp tục cung cấp Terminal cùng Claude Code và Codex.
