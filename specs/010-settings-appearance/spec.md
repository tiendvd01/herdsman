# Feature Specification: Settings — Appearance

**Feature Branch**: `010-settings-appearance`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Làm chức năng settings, cho xuống ở góc này (footer sidebar, cạnh trạng thái `hc connected`), và mở ra 1 dialog đè lên, và có appearance để có thể đổi được font của app, font của code, và nút toggle mode cũng cho vào phần setting này thay vì để bên ngoài"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mở Settings từ góc dưới sidebar (Priority: P1)

Developer bấm nút Settings ở góc dưới sidebar trái (cùng hàng với trạng thái `hc`) và một hộp thoại Settings mở đè lên app. Hộp thoại có mục **Appearance**, đóng được bằng nút đóng, phím Esc hoặc bấm ra ngoài.

**Why this priority**: là điểm vào cho mọi cài đặt; không có nó thì các phần còn lại không có chỗ để đặt.

**Independent Test**: bấm nút Settings ở footer sidebar → hộp thoại hiện ra với mục Appearance; Esc → hộp thoại đóng, app trở lại như trước.

**Acceptance Scenarios**:

1. **Given** app đang mở và sidebar đang hiện, **When** bấm nút Settings ở góc dưới sidebar, **Then** hộp thoại Settings mở đè lên app, có tiêu đề "Settings" và mục Appearance.
2. **Given** hộp thoại Settings đang mở, **When** bấm Esc, nút đóng hoặc vùng ngoài hộp thoại, **Then** hộp thoại đóng và focus quay lại nút Settings.
3. **Given** bất kỳ màn hình nào, **When** bấm ⌘, (Cmd+Comma), **Then** hộp thoại Settings mở.

---

### User Story 2 - Đổi chế độ sáng/tối trong Settings (Priority: P1)

Developer chọn chế độ giao diện System / Light / Dark trong mục Appearance. Nút đổi theme ở thanh header không còn nữa.

**Why this priority**: người dùng yêu cầu chuyển nút toggle mode vào Settings; nếu bỏ nút ngoài mà chưa có chỗ mới thì mất chức năng.

**Independent Test**: mở Settings → chọn Dark → app chuyển tối ngay; header không còn nút theme.

**Acceptance Scenarios**:

1. **Given** Settings đang mở, **When** chọn Light / Dark / System, **Then** giao diện đổi ngay, lựa chọn đang dùng được đánh dấu rõ.
2. **Given** đã chọn Dark rồi tắt app, **When** mở lại app, **Then** app vẫn ở Dark.
3. **Given** app đang chạy, **When** nhìn header của workspace và màn hình trống, **Then** không có nút đổi theme ở đó.
4. **Given** bất kỳ màn hình nào, **When** bấm ⌘⇧L hoặc chọn "Toggle theme" trong command palette, **Then** theme vẫn đổi như trước (đường tắt giữ nguyên).

---

### User Story 3 - Đổi font giao diện và font code (Priority: P2)

Developer chọn font cho giao diện app (chữ thường, menu, hội thoại) và font cho code (code block, diff, đường dẫn, lệnh, log, số liệu) từ danh sách trong Appearance. Mỗi ô chọn có nút trả về mặc định.

**Why this priority**: giá trị cá nhân hoá, nhưng app vẫn dùng tốt với font mặc định.

**Independent Test**: mở Settings → chọn font code khác → code block trong hội thoại đổi font ngay; khởi động lại vẫn giữ.

**Acceptance Scenarios**:

1. **Given** Settings đang mở, **When** chọn một font giao diện khác, **Then** toàn bộ chữ giao diện đổi font ngay mà không cần tải lại app, còn chữ code giữ nguyên.
2. **Given** Settings đang mở, **When** chọn một font code khác, **Then** code block, diff, đường dẫn, lệnh và số liệu đổi font ngay, chữ giao diện giữ nguyên.
3. **Given** đã đổi font, **When** bấm "Reset" cạnh ô chọn, **Then** font trở về mặc định (Geist cho giao diện, Geist Mono cho code).
4. **Given** đã đổi font rồi tắt app, **When** mở lại app, **Then** font đã chọn vẫn được áp dụng ngay từ khung hình đầu.
5. **Given** font đã lưu không còn trên máy, **When** mở app, **Then** app rơi về font mặc định, không vỡ bố cục.

---

### Edge Cases

- Sidebar đang ẩn: vẫn mở Settings được bằng ⌘, và command palette.
- Hộp thoại Settings đang mở khi có thông báo / permission request mới: hộp thoại không chặn agent; đóng hộp thoại là thấy trạng thái mới.
- Lưu cài đặt thất bại (storage không ghi được): giao diện vẫn đổi trong phiên hiện tại, lần mở sau dùng mặc định.
- Font được chọn thiếu một số ký tự (ví dụ tiếng Việt, tiếng Nhật): ký tự thiếu rơi về font hệ thống, không hiện ô trống.
- Theme "System" và hệ điều hành đổi sáng/tối khi hộp thoại đang mở: app đổi theo ngay.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sidebar trái MUST có nút Settings (icon bánh răng) ở góc dưới, cùng hàng với trạng thái `hc`.
- **FR-002**: Bấm nút Settings MUST mở hộp thoại modal đè lên app; hộp thoại MUST đóng được bằng nút đóng, Esc và bấm ra ngoài.
- **FR-003**: Phím tắt ⌘, MUST mở hộp thoại Settings; command palette MUST có lệnh "Open settings".
- **FR-004**: Hộp thoại MUST có điều hướng theo mục, với mục đầu tiên (và duy nhất ở bản này) là **Appearance**; bố cục MUST thêm được mục mới sau này mà không đổi cách mở.
- **FR-005**: Appearance MUST có lựa chọn chế độ màu System / Light / Dark, hiển thị trạng thái đang chọn và áp dụng ngay khi chọn.
- **FR-006**: Nút đổi theme ở header (màn hình trống và header workspace) MUST bị bỏ; ⌘⇧L và lệnh "Toggle theme" trong command palette MUST vẫn hoạt động.
- **FR-007**: Appearance MUST có ô chọn **Interface font** áp dụng cho toàn bộ chữ giao diện.
- **FR-008**: Appearance MUST có ô chọn **Code font** áp dụng cho mọi chỗ đang dùng chữ monospace (code block, diff, đường dẫn, branch, lệnh, log, số liệu model/ctx, terminal Log).
- **FR-009**: Mỗi ô chọn font MUST liệt kê font mặc định đóng gói kèm app và **mọi font family cài trên máy**, có ô tìm kiếm theo tên; mỗi lựa chọn MUST hiển thị bằng chính font đó; danh sách font code chỉ gồm font monospace.
- **FR-010**: Mỗi ô chọn font MUST có nút Reset về mặc định (Geist / Geist Mono).
- **FR-011**: Mọi thay đổi trong Appearance MUST áp dụng ngay, không cần nút Save, và MUST được ghi nhớ qua các lần mở app.
- **FR-012**: Khi font đã chọn không có trên máy, app MUST rơi về font mặc định.
- **FR-013**: Đổi cài đặt giao diện MUST NOT ảnh hưởng tới session/agent đang chạy.

### Key Entities

- **Appearance preferences**: chế độ màu (system/light/dark), font giao diện, font code. Là tuỳ chọn cục bộ của người dùng trên máy, lưu cùng các lựa chọn UI khác (panel, kích thước sidebar).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Từ bất kỳ màn hình nào, người dùng mở được Settings trong 1 thao tác (1 cú bấm hoặc 1 phím tắt).
- **SC-002**: Đổi theme hoặc font thấy kết quả trên toàn app trong dưới 200 ms, không tải lại app.
- **SC-003**: 100% lựa chọn appearance được giữ nguyên sau khi tắt và mở lại app.
- **SC-004**: Header không còn nút theme; số nút trên header giảm đi 1 ở cả màn hình trống và màn hình workspace.
- **SC-005**: Đổi font không làm vỡ bố cục: không chữ nào tràn khỏi nút, tab hoặc sidebar ở kích thước cửa sổ mặc định với mọi font trong danh sách.

## Assumptions

- "Góc này" là footer của sidebar trái, hàng chứa trạng thái `hc connected`; BR-001 mục 3.1 cũng đặt Settings ở đây.
- Bản này chỉ có mục Appearance; các mục khác (engine, API key, notification…) để tính năng sau.
- Danh sách font lấy từ các font cài trên máy (macOS) cộng font đóng gói; không cho nhập tên font tự do và không tải font từ mạng (app phải chạy offline). Nền tảng chưa hỗ trợ liệt kê font thì dùng danh sách chọn sẵn.
- Không thêm chỉnh cỡ chữ; mật độ/zoom đã có ở tính năng 006.
- Cài đặt lưu cục bộ trên máy, không đồng bộ.
- Tài liệu BR-001 mục 3.2 ("đổi bằng nút ở sidebar") sẽ được cập nhật thành "đổi trong Settings → Appearance" trong cùng thay đổi.
