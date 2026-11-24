# Feature Specification: Vòng đời session, quyền và quan sát agent

## User Scenarios & Testing

Mở session, đổi model, duyệt tool, đóng rồi mở lại app khi agent đang chạy và kiểm tra trạng thái.

## Requirements

### Functional Requirements

- **FR-001** Workspace mở được session Claude hoặc Codex. Hàng tab hiển thị session chưa xong và session đang xem. Tab dùng icon engine đóng gói sẵn, icon riêng cho Claude và Codex, icon chung cho engine khác; có nhãn và tooltip. Icon cỡ chữ tab, giữ kích thước khi tên dài.
- **FR-002** Session sống qua đóng app, crash, cập nhật và mở lại. App tự kết nối lại và dựng hội thoại từ lịch sử sự kiện riêng; giữ transcript engine để resume. Claude resume được bằng CLI. Herdsman công bố session, trạng thái và việc gửi từ agent khác qua Herdr/hc.
- **FR-003** Tab hiển thị idle, working, blocked, done, error. Working dùng spinner tại vị trí chấm trạng thái của tab. Mỗi workspace đang có ít nhất một session working hiển thị đúng một spinner cùng kiểu tại vị trí icon bên trái; khi hết working trả lại icon loại workspace. Trạng thái blocked/error giữ chấm vàng và số đếm, menu và vị trí tên giữ ổn định khi trạng thái, hover hoặc menu thay đổi. Spinner phản ánh thời gian thực, dùng màu working và tên truy cập “Working”, tôn trọng giảm chuyển động.
- **FR-004** Gửi thông báo hệ điều hành khi agent xong hoặc cần duyệt. Tương tác với thông báo mở đúng session. Nếu app đóng, yêu cầu quyền chờ đến khi có quyết định.
- **FR-005** Mỗi session cho đổi giữa hỏi mọi lần (mặc định), tự cho phép sửa file trong thư mục làm việc, và bỏ qua mọi duyệt. Ở chế độ tự cho phép sửa file, lệnh shell và thao tác file ngoài thư mục làm việc vẫn cần duyệt. Bỏ qua mọi duyệt cần xác nhận riêng và có badge cảnh báo trên tab. Với tool cần quyền, hiện Allow/Deny trước khi chạy, kèm diff hoặc lệnh shell đầy đủ.
- **FR-006** Bộ chọn model cạnh chế độ quyền hiển thị tên model dễ đọc và các lựa chọn do engine cung cấp, kèm mô tả nếu có. Chỉ cập nhật nhãn trên bộ chọn và header sau khi engine xác nhận. Model áp dụng từ lượt tiếp theo, lưu theo session qua resume. Đổi thất bại giữ model cũ và báo lỗi. Engine chưa hỗ trợ thì vô hiệu hóa điều khiển và giải thích. Bộ chọn có nhãn model hiện tại, mở, chọn và đóng được bằng bàn phím. Ghi lần đổi vào lịch sử sự kiện.
- **FR-007** Riêng Claude, lần đổi model chủ động thành công được ghi nhớ toàn app cho hội thoại Claude mới ngay từ lượt đầu tiên. Session đã tạo hoặc resume giữ model riêng. Khi chưa có lựa chọn dùng mặc định; nếu model đã lưu không còn khả dụng, thông báo và dùng mặc định nếu có, giữ lựa chọn đã lưu. Model tự báo lúc khởi động và lần đổi thất bại giữ nguyên lựa chọn đã lưu.
- **FR-008** Composer hiển thị chỉ số dạng chữ cho context của session và hạn mức tài khoản 5 giờ/tuần, số nguyên 0–100%, cập nhật sau mỗi lượt. Cảnh báo từ 80%, nguy hiểm từ 95%, xem thời điểm reset qua hover. Khi thiếu dữ liệu hiện trạng thái trống; ẩn hoặc làm mờ hạn mức nếu nguồn không hỗ trợ và đánh dấu số liệu đã cũ khi làm mới thất bại.
- **FR-009** Panel Log hiển thị terminal session. Agents hiển thị cây cha → con và trạng thái/tiến độ, giới hạn ở thông tin theo dõi.

## Success Criteria

- **SC-001** Tắt app trong lúc agent chạy, mở lại sau 10 phút: 100% tin nhắn có mặt, agent vẫn tiếp tục, trạng thái đúng.
- **SC-002** Yêu cầu quyền `Edit` luôn hiện diff; sau khi bấm Allow agent chạy tiếp trong vòng 2 giây.
- **SC-003** Đổi trạng thái session hiện trên tab và sidebar trong vòng 1 giây; thông báo hệ điều hành hiện trong vòng 2 giây.
- **SC-004** Mở lại app với 10 session đang chạy: hiện đầy đủ trạng thái trong dưới 5 giây.
- **SC-005** 100% session Herdsman hiện trong danh sách session của `hc` với đúng trạng thái.

## Nguồn lịch sử

- [001-herdsman-use-cases](../archive/001-herdsman-use-cases/spec.md)
- [005-chat-model-switcher](../archive/005-chat-model-switcher/spec.md)
- [008-session-engine-icon](../archive/008-session-engine-icon/spec.md)
- [014-usage-limits-display](../archive/014-usage-limits-display/spec.md)
- [017-running-spinner](../archive/017-running-spinner/spec.md)
- [020-remember-claude-model](../archive/020-remember-claude-model/spec.md)
- [022-move-workspace-spinner](../archive/022-move-workspace-spinner/spec.md)
