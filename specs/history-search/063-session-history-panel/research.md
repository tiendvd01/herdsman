# Quyết định thiết kế

- **Điểm vào** — Dùng tab trong RightPanel. Tabs, focus và thao tác mở/đóng đã có. Popover cũ đóng sau mỗi lựa chọn, làm gián đoạn việc đọc liên tiếp.
- **Nguồn Herdsman** — Dùng dữ liệu session/workspace và FTS hiện có. Command Palette có giới hạn và quy tắc duyệt riêng, nên History có điểm đọc riêng.
- **Nguồn Claude CLI** — Dùng trình đọc transcript hiện có, báo lỗi đọc một phần và giữ kết quả đọc được. Tìm kiếm trực tiếp tránh phải sao chép toàn bộ kho trước khi người dùng mở phiên.
- **Mở phiên** — Dùng cửa sổ hội thoại và luồng import có giao dịch hiện tại. Nếu transcript không cung cấp thư mục làm việc hợp lệ, phiên được đặt trong project thiếu thư mục để vẫn đọc được.
