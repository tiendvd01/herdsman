# Feature Specification: Lịch sử, tìm session và Command Palette

## User Scenarios & Testing

Tìm cùng một truy vấn ở ba phạm vi, dùng bàn phím mở kết quả và kiểm tra workspace đã archive.

## Requirements

### Functional Requirements

- **FR-001** Điểm truy cập và hành vi duyệt lịch sử hiện được mô tả trong [063 · Panel History cho phiên agent](../063-session-history-panel/spec.md).
- **FR-002** Mở Command Palette bằng ⌘K hoặc nút tìm kiếm ở sidebar. Có một truy vấn và các tab All, Workspaces, Projects, Actions, Settings. All nhóm kết quả, ưu tiên workspace gần đây khi truy vấn trống. Hai tab danh mục lọc theo tên và mở đích; Actions theo ngữ cảnh, Settings mở mục cài đặt. Tìm được lệnh và thiết lập theo tên.
- **FR-003** Trong All, phạm vi session là toàn app, project hiện tại hoặc workspace hiện tại. Hiển thị tên đích của phạm vi hẹp, mặc định workspace khi có. Phạm vi project gồm các workspace trực thuộc, phạm vi workspace chỉ gồm đúng workspace.
- **FR-004** Khớp tiêu đề hoặc nội dung Herdsman được hiển thị, gồm session đang chạy, đã xong và workspace archive. Hội thoại Claude cũ vẫn tìm được ở phạm vi toàn app và chỉ vào phạm vi hẹp khi xác định được liên kết tương ứng. Kết quả hiện tiêu đề hoặc nhãn thay thế, project/workspace nếu biết, và đoạn trích khi khớp nội dung. Kích hoạt kết quả mở đúng hội thoại qua luồng hiện có.
- **FR-005** Giữ truy vấn khi đổi tab hoặc phạm vi và hiển thị tải, trống, lỗi phù hợp. Tab, phạm vi và kết quả dùng được với chuột và bàn phím. Khi focus ở ô tìm, trình đọc màn hình nhận biết kết quả đang trỏ; Enter chỉ kích hoạt mục khả dụng đang trỏ và giữ quy tắc xác nhận của hành động.

## Success Criteria

- **SC-001** Tìm kiếm theo nội dung trả kết quả trong dưới 1 giây với 1.000 session.

## Nguồn lịch sử

- [001-herdsman-use-cases](../../archive/001-herdsman-use-cases/spec.md)
- [023-scoped-session-search](../../archive/023-scoped-session-search/spec.md)
- [027-ui-accessibility-consistency](../../archive/027-ui-accessibility-consistency/spec.md)
