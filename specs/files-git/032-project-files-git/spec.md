# Feature Specification: Duyệt, sửa file và xem Git

## User Scenarios & Testing

Mở file trùng tên ở hai thư mục, sửa và chuyển tab, rồi thử lưu khi có xung đột trên đĩa.

## Requirements

### Functional Requirements

- **FR-001** Files ở panel phải hiển thị cây bắt đầu từ thư mục gốc project hiện tại. Cây có biểu tượng theo loại, thụt lề và trạng thái mở/thu gọn, theo theme, cho xem tên dài và phân biệt focus với file đang mở. Dùng bàn phím để duyệt và mở. Có trạng thái phù hợp khi chưa chọn project, thư mục trống, tải hoặc lỗi.
- **FR-002** Chọn file mở và kích hoạt tab chính có tên, đường dẫn và nội dung văn bản. Mỗi cặp project và đường dẫn tương đối có tối đa một tab, kể cả đang tải. Cho đóng và mở lại; file chỉ đọc, lỗi đọc hoặc định dạng chưa hỗ trợ có chỉ báo riêng và phần còn lại vẫn sử dụng được.
- **FR-003** Sửa file có quyền ghi, giữ bản sửa khi chuyển tab, hiện trạng thái chưa lưu và lưu vào đúng file trong project gắn với tab. Chỉ xoá dấu chưa lưu khi ghi thành công. Lỗi ghi hoặc file thay đổi trên đĩa phải báo lý do và giữ bản sửa; khi xung đột giữ nội dung trên đĩa.
- **FR-004** Đóng tab hoặc thoát app bình thường khi còn thay đổi phải hỏi Save, Discard hoặc Cancel theo từng file. Huỷ hoặc lưu lỗi giữ tab để tiếp tục sửa.
- **FR-005** Panel Git (trước đây mang tên Files) hiển thị thay đổi chưa commit và diff của workspace. Tab file dùng quy ước chung về focus và lựa chọn trong [giao diện ứng dụng](../../appearance-shortcuts/033-app-shell-appearance/spec.md).

## Success Criteria

- **SC-001** Mở lại cùng project và đường dẫn trong lúc tải chỉ kích hoạt một tab. Các file trùng tên ở đường dẫn khác nhau có tab riêng.
- **SC-002** Sau khi sửa file, huỷ đóng tab hoặc thử lưu khi có xung đột. Bản sửa vẫn còn trong tab và nội dung thay đổi trên đĩa vẫn nguyên vẹn.

## Nguồn lịch sử

- [001-herdsman-use-cases](../../archive/001-herdsman-use-cases/spec.md)
- [026-project-file-browser](../../archive/026-project-file-browser/spec.md)
- [027-ui-accessibility-consistency](../../archive/027-ui-accessibility-consistency/spec.md)
