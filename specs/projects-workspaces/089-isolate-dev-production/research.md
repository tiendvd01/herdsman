# Research

- **Định danh**. Dùng Tauri config overlay cho lệnh dev và kiểm tra cặp chế độ/định danh trước khi mở dữ liệu. Tauri dùng identifier cho app data và webview. Cấu hình platform riêng sẽ áp dụng cả khi đóng gói. [Tauri configuration files](https://v2.tauri.app/develop/configuration-files/)
- **LaunchServices**. Binary rời do Tauri dev khởi chạy hiện lên dưới tên file và thiếu bundle ID trong LaunchServices. Trên macOS, dùng Cargo runner để đặt binary dev vào một bundle cục bộ trong thư mục build rồi thực thi, giữ luồng hot reload của Tauri.
- **Production compatibility**. SQLite, log phiên, socket, dịch vụ Keychain và nhãn hc production đã tồn tại. Giữ các giá trị này để kết nối lại tại chỗ. Chép dữ liệu từ kho cũ có thể làm trùng phiên và để lại đường dẫn socket cũ.
- **hc**. Dùng nhãn `herdsman.app=development` cho dev và giữ `herdsman.app=1` cho production. Một server hc có thể phục vụ cả hai, kể cả production cũ đang chạy. Terminal con kế thừa ranh giới khi Herdsman hiển thị đầu ra.
- **Worktree**. Giữ vị trí shared repo của worktree production hiện có. Đặt checkout dev trong app data dev và bảo vệ thư mục khi khám phá hoặc xóa worktree. Hai app vẫn có thể mở cùng repo hoặc thêm một thư mục checkout làm project riêng.
