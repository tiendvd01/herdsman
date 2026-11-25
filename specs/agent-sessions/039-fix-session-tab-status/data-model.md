# Data Model

WorkspacePane giữ yêu cầu đóng đang chờ với ID Session và thông tin Session đã hiển thị `Done` trước khi xác nhận hay chưa. Trạng thái này bắt đầu khi gửi yêu cầu và kết thúc khi xử lý kết quả. Trạng thái Session thực vẫn nhận cập nhật trong lúc chờ.

Trạng thái phiên đang mở có thể là `idle` kèm `kind: turn_complete`. Tab hiển thị `Done` trong trường hợp này, còn vòng đời Session tiếp tục theo `idle`. Trạng thái của lượt sau thay thế tín hiệu này.
