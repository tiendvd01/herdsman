# Feature Specification — Chọn branch có sẵn cho workspace worktree

**Feature Branch** — `master`

**Created** — 2026-11-24

**Status** — Draft

**Input** — “new workspace worktree có thể chọn các branch có sẵn nữa”

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Tiếp tục công việc trên branch có sẵn (P1)

Developer tạo workspace có thư mục riêng để tiếp tục công việc trên một branch local.

**Giá trị** — Workspace mở đúng lịch sử công việc đang có và đi kèm một session trống.

**Kiểm thử độc lập** — Tạo branch local có commit riêng, chọn branch đó trong hộp thoại và kiểm tra tên branch cùng nội dung commit trong workspace mới.

1. **Given** branch local chưa được checkout, **When** chọn branch và tạo workspace, **Then** workspace dùng đúng branch trên thư mục riêng, mở một session trống và giữ nguyên checkout của project.
2. **Given** branch đang được checkout, **When** người dùng xem danh sách, **Then** branch vắng mặt trong gợi ý và nếu người dùng nhập tên đó, hộp thoại báo branch đang được checkout.
3. **Given** branch đã được chọn rồi bị xoá hoặc checkout ở nơi khác, **When** người dùng xác nhận, **Then** hộp thoại giữ dữ liệu đã nhập, báo lỗi và cho chọn lại hoặc nhập tên branch mới.

### User Story 2 — Bắt đầu công việc mới (P2)

Developer vẫn có thể tạo branch mới từ nhánh mặc định hoặc làm việc trong thư mục project.

**Kiểm thử độc lập** — Tạo workspace bằng từng đường dẫn hiện có rồi kiểm tra thư mục, branch và session.

1. **Given** project có branch local, **When** nhập tên branch mới, **Then** app tạo branch từ nhánh mặc định của project.
2. **Given** chỉ cần thư mục project, **When** chọn Project folder, **Then** workspace dùng thư mục project và mở một session trống.

### Edge Cases

- Nếu chưa có nhánh mặc định khả dụng, hộp thoại giải thích lý do và vô hiệu hóa việc tạo branch mới.
- Nếu không tải được danh sách branch, người dùng thấy lỗi và vẫn có thể chọn Project folder.
- Nếu tạo workspace thất bại sau khi checkout, app dọn worktree của lần tạo lỗi và giữ branch để có thể thử lại.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — New worktree phải có một ô Branch để chọn branch có sẵn hoặc nhập tên branch mới.
- **FR-002** — Ô Branch phải gợi ý các branch local chưa checkout, báo lỗi khi nhập branch đang checkout và yêu cầu tên branch trước khi tạo.
- **FR-003** — Workspace thành công phải dùng đúng branch đã chọn tại một thư mục riêng và có một session trống dùng thư mục đó.
- **FR-004** — App phải kiểm tra lại branch khi tạo. Nếu branch không còn khả dụng, báo lỗi, cập nhật danh sách và không tạo workspace hay session.
- **FR-005** — Tạo branch mới từ nhánh mặc định của project khi nhập tên chưa có. Giữ luồng Project folder và hành vi của workspace đã lưu.
- **FR-006** — Xoá worktree hoặc dọn lần tạo thất bại phải giữ branch local có sẵn.

### Key Entities *(include if feature involves data)*

- **Branch local** — Tên branch và tình trạng đang được checkout.
- **Workspace worktree** — Workspace gắn với một checkout riêng và dùng chung thư mục đó cho mọi session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Trong 3 lần thử với branch khả dụng, cả 3 workspace mở đúng branch và đúng commit của branch.
- **SC-002** — Cả 2 trường hợp branch đã bị xoá hoặc vừa được checkout sau khi chọn đều báo lỗi và tạo 0 workspace.
- **SC-003** — Người dùng thử nghiệm tạo workspace từ branch có sẵn trong vòng 30 giây kể từ lúc mở hộp thoại, khi danh sách đã tải và branch đã có sẵn.
- **SC-004** — Cả hai luồng New branch và Project folder hoàn thành với đúng một session trống.

## Assumptions

- Phạm vi là branch local của project. Branch chỉ có trên remote cần được tạo ở local trước.
- Branch đang checkout ở bất kỳ thư mục nào của repository đều không khả dụng cho worktree mới.
