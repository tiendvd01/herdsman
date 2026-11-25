# Session tab UI contract

- Sau khi bắt đầu đóng, tab giữ vị trí và hiển thị `Closing session` với spinner trung tính nếu trước đó chưa hiển thị `Done`.
- Thành công sẽ bỏ tab. Thất bại giữ tab, hiển thị lỗi và tiếp tục hiển thị trạng thái thực.
- Hủy hộp thoại giữ tab với trạng thái thực. Tab khác nhận trạng thái của chính Session tương ứng.
- Lượt thành công hiển thị `Done` trên tab còn mở, kể cả tab nền. Lượt tiếp theo hiển thị `Working`. Lượt lỗi hoặc bị ngắt không hiển thị `Done` do hoàn thành lượt.
