# Feature Specification: Giao diện, bố cục và khả năng tiếp cận

## User Scenarios & Testing

Đổi theme và zoom, kéo hai sidebar, dùng bàn phím chuyển tab và kiểm tra nhãn dài trong cửa sổ hẹp.

## Requirements

### Functional Requirements

- **FR-001** Bố cục gồm sidebar project/workspace và trạng thái hc, vùng giữa có header workspace và các tab, panel phải có Agents, Tasks, Files, Git và Log. Agents, Tasks, Git và Log dùng mẫu trạng thái trống chung với Files, phân biệt trống, tải và lỗi. Nhãn và phản hồi UI dùng tiếng Anh theo constitution.
- **FR-002** Kéo mép trong của hai sidebar để chỉnh rộng, có con trỏ resize và chỉ báo hover/focus. Sidebar trái mặc định 232px (184–440), panel phải 308px (256–660), giữa tối thiểu 396px; giới hạn chiều rộng hiệu lực theo cửa sổ. Nhấp đúp đặt lại, nút mở rộng bên phải dùng mức 504px và thu về 308px. Mép kéo có tên và giá trị truy cập, dùng được với mũi tên theo bước 16px; độ rộng được nhớ qua lần mở app và thao tác ẩn/hiện.
- **FR-003** ⌘B và ⌘R bật/tắt hai sidebar tương ứng trong cửa sổ chính, gồm composer, ô tìm và Log khi không có hộp thoại; ⌘R được xử lý như phím tắt app và giữ nội dung hiện tại.
- **FR-004** Cả hàng tab chính và panel phải dùng focus và lựa chọn nhất quán. Mũi tên trái/phải và Home/End di chuyển focus; Enter/Space chọn tab. Công nghệ hỗ trợ nhận biết lựa chọn và vùng nội dung. Khi đóng tab hiện hành, chuyển focus sang tab kế tiếp, tab trước nếu cần, hoặc nút tạo session nếu có, nếu không thì đến nút điều khiển panel phải. Hủy xác nhận hoặc đóng lỗi trả focus về nút mở hộp thoại. Khi Tab đi vào hàng, focus đến tab đang chọn.
- **FR-005** Theme, Working directory và Search scope cho điều hướng/chọn bằng bàn phím, công bố lựa chọn và bỏ qua mục vô hiệu. Nhãn bị cắt thật sự có tooltip nguyên văn khi hover, đóng khi rời nhãn hoặc Escape, giữ nguyên bố cục và đọc được sát mép cửa sổ.
- **FR-006** Settings mở từ sidebar, ⌘, hoặc Command Palette, đóng bằng nút, Escape hoặc bấm ngoài. Appearance lưu ngay System/Light/Dark, theme sáng/tối và font giao diện/code. Font chọn từ font đóng gói và font cài trên máy, có tìm kiếm và xem mẫu. Code chỉ liệt kê monospace. Reset hoặc font mất dùng Geist/Geist Mono. ⌘⇧L và Toggle theme hoạt động từ app.
- **FR-007** Light có Default và Paper, Dark có bộ mặc định riêng. Paper dùng nền kem/chữ mực và áp dụng cả nội dung định dạng và thanh cuộn. System theo hệ điều hành. Theme đổi ngay trên mọi bề mặt, giữ lựa chọn khi chuyển chế độ. Light, Paper và Dark có token cùng vai trò; giá trị thiếu suy ra từ màu gốc, khai báo tường minh được ưu tiên. Theme tuỳ chỉnh từ file JSON hợp lệ trong thư mục người dùng, khai báo sáng/tối; file lỗi bị bỏ qua với tên file và trường liên quan. Theme đã chọn bị lỗi thì dùng mặc định. Kiểm tra tương phản 4.5:1 cho chữ thường, lỗi với theme đóng gói và cảnh báo với theme tuỳ chỉnh.
- **FR-008** Zoom 80/90/100/110/120/135/150%, mặc định và đặt lại là 100%, có kích thước như 110% trước thay đổi 024. ⌘+/⌘=, ⌘− và ⌘0, lệnh trong palette và View trên macOS điều khiển zoom toàn app. Chỉ báo mức mới tự ẩn khoảng 1,5 giây. Mức 100% có chữ tối thiểu 11px và vùng bấm tối thiểu 24×24px.
- **FR-009** Cỡ chữ nội dung chỉnh riêng −2 đến +4 theo bước 1px bằng ⌥⌘=, ⌥⌘−, ⌥⌘0 hoặc palette; áp dụng hội thoại, composer, Files và Log. Lưu và khôi phục zoom/cỡ chữ ngay khi mở app, kể cả sau nâng cấp. Resize, zoom, đổi font hoặc theme giữ trạng thái đang dùng và agent đang chạy.
- **FR-010** Dùng tối đa 8 bậc spacing theo cùng đơn vị, co giãn với zoom. Căn hàng và header đồng nhất, giữ chỗ cho nút hover/focus. Ghi lý do cho ngoại lệ tại chỗ và có bước kiểm tra tự động báo vị trí vi phạm. Thanh cuộn hai chiều rộng khoảng 6–8px, theo theme hoặc nền cố định của Log, thumb rõ hơn khi hover/kéo và giữ hành vi ẩn ở vùng thiết kế như vậy.
- **FR-011** Icon macOS dùng chữ H trắng, hai chấm xanh/vàng, nền tối bo góc chiếm khoảng 824×824 ở giữa khung trong suốt 1024×1024. Sinh kích cỡ 16–1024, hỗ trợ Retina. Logo sidebar và favicon dùng cùng thiết kế gốc, rõ trong theme sáng/tối.

## Success Criteria

- **SC-001** Ở cả theme sáng và tối, người dùng duyệt và kích hoạt từng hàng tab bằng bàn phím, phân biệt focus với lựa chọn và nhận biết vùng nội dung bằng trình đọc màn hình.
- **SC-002** Mở lại app sau khi đổi theme, cỡ chữ, zoom và độ rộng hai sidebar. Kiểm tra các tùy chọn đã lưu, sau đó đặt lại zoom và kéo sidebar trong cửa sổ hẹp mà vẫn truy cập được các điều khiển.

## Nguồn lịch sử

- [001-herdsman-use-cases](../archive/001-herdsman-use-cases/spec.md)
- [003-macos-app-icon](../archive/003-macos-app-icon/spec.md)
- [004-resizable-sidebars](../archive/004-resizable-sidebars/spec.md)
- [006-ui-compact-zoom](../archive/006-ui-compact-zoom/spec.md)
- [007-sidebar-toggle-shortcuts](../archive/007-sidebar-toggle-shortcuts/spec.md)
- [009-unified-spacing-scale](../archive/009-unified-spacing-scale/spec.md)
- [010-settings-appearance](../archive/010-settings-appearance/spec.md)
- [011-thin-themed-scrollbar](../archive/011-thin-themed-scrollbar/spec.md)
- [015-light-paper-theme](../archive/015-light-paper-theme/spec.md)
- [016-color-theme-tokens](../archive/016-color-theme-tokens/spec.md)
- [024-increase-base-ui-scale](../archive/024-increase-base-ui-scale/spec.md)
- [025-truncated-text-tooltip](../archive/025-truncated-text-tooltip/spec.md)
- [027-ui-accessibility-consistency](../archive/027-ui-accessibility-consistency/spec.md)
