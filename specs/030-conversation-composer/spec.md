# Feature Specification: Hội thoại và soạn tin

## User Scenarios & Testing

Soạn tin dài kèm ảnh, kiểm tra bản nháp khi resize, xem lại ảnh và sơ đồ, rồi tạo hội thoại mới bằng /clear.

## Requirements

### Functional Requirements

- **FR-001** Stream hội thoại theo thời gian thực. Hiển thị markdown, syntax highlighting, bảng, Mermaid, khối chart, công thức, ảnh, tool card thu gọn và diff. Khi sơ đồ hoặc biểu đồ lỗi, hiện mã nguồn và tiếp tục hiển thị phần còn lại. Nội dung không tin cậy được hiển thị an toàn.
- **FR-002** Nút Copy code hiện khi hover hoặc focus, xác nhận sau khi clipboard ghi thành công và báo lỗi nếu thất bại.
- **FR-003** Composer hỗ trợ gửi tin, dán ảnh, ngắt lượt và slash command. Enter gửi, Shift+Enter xuống dòng.
- **FR-004** Nút Expand/Collapse cạnh đính kèm có tooltip, tên và trạng thái truy cập, bị vô hiệu cùng ô soạn. Mở lần đầu cao 300px, có tay nắm resize dọc khi mở rộng. Tay nắm có chỉ báo focus và con trỏ resize, giữ bề mặt liền khi hover hoặc kéo. Chiều cao giới hạn theo cửa sổ để giữ thanh công cụ truy cập được và ghi nhớ chiều cao người dùng chọn qua các lần mở app.
- **FR-005** Mở, thu gọn và resize giữ bản nháp, ảnh, focus và vị trí con trỏ. Trạng thái mở rộng bắt đầu ở chế độ thường khi mở session. Escape thu gọn nếu danh sách slash command đang đóng, và lần nhấn đó dành cho thao tác thu gọn. Gửi thành công thu gọn, lỗi gửi giữ trạng thái hiện tại.
- **FR-006** Chỉ lệnh chính xác `/clear` tạo hội thoại trống cùng workspace và loại agent. Menu hiển thị đối số tùy chọn `[name]`. Dùng toàn bộ phần còn lại trên cùng dòng làm tên sau khi bỏ khoảng trắng hai đầu; hỗ trợ Unicode, nhiều từ và trùng tên. Tên trống dùng cách đặt tên mặc định. Tên hiển thị ngay và giữ qua tin đầu, chuyển session và mở lại app. Hội thoại cũ giữ lượt đang chạy, yêu cầu quyền và lịch sử; nếu thất bại, báo lỗi và giữ hội thoại cùng nội dung lệnh.
- **FR-007** Bấm từng ảnh thu nhỏ trong bản nháp hoặc tin đã gửi để xem đúng ảnh toàn khung, giữ tỉ lệ; đóng bằng nút hoặc Escape và trở lại đúng vị trí/lưu bản nháp. Nút gỡ ảnh chỉ gỡ ảnh. Ảnh được hỗ trợ vẫn xem được sau khi mở lại app; ảnh thiếu/hỏng hiện trạng thái không khả dụng và các ảnh khác vẫn dùng được.
- **FR-008** Mermaid render thành công có nút mở trình xem khi hover hoặc focus. Mỗi lần mở bắt đầu ở mức vừa khít, có zoom giới hạn bằng +/−, Ctrl/Cmd+cuộn và pinch, kéo để pan, đặt lại và hiện phần trăm. Giữ chi tiết sắc nét, theo theme. Nút có nhãn và dùng được bằng bàn phím. Đóng bằng nút, Escape hoặc nền ngoài và trở về vị trí cuộn; giữ render lười và cache ở chế độ inline.

## Success Criteria

- **SC-001** 100% khối Mermaid và ` ```chart ` hợp lệ hiện thành sơ đồ/biểu đồ; khối lỗi hiện lại mã nguồn.
- **SC-002** Hội thoại trên 5.000 message cuộn mượt (không tụt dưới 60 khung hình/giây khi cuộn); chữ stream hiện chậm không quá 200 ms so với agent.

## Nguồn lịch sử

- [001-herdsman-use-cases](../archive/001-herdsman-use-cases/spec.md)
- [012-composer-expand](../archive/012-composer-expand/spec.md)
- [013-composer-expand-resize](../archive/013-composer-expand-resize/spec.md)
- [018-mermaid-zoom](../archive/018-mermaid-zoom/spec.md)
- [019-fix-clear-name](../archive/019-fix-clear-name/spec.md)
- [021-view-chat-images](../archive/021-view-chat-images/spec.md)
- [027-ui-accessibility-consistency](../archive/027-ui-accessibility-consistency/spec.md)
