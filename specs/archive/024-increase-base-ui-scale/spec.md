# Feature Specification: Tăng kích thước giao diện ở zoom 100%

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-23

**Status**: Draft

**Input**: “Tôi muốn tăng các font size và UI ở zoom level 100% lên bằng 110%”

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đọc và thao tác ở kích thước mặc định lớn hơn (Priority: P1)

Người dùng mở Herdsman ở mức 100% và thấy chữ, biểu tượng, nút và các thành phần giao diện có kích thước tương đương mức 110% trước thay đổi.

**Why this priority** — Người dùng có thể đọc hội thoại và thao tác ở kích thước mong muốn ngay khi mở app lần đầu hoặc đặt lại zoom.

**Independent Test** — So sánh bản trước ở 110% với bản mới ở 100%, dùng cùng màn hình, kích thước cửa sổ, nội dung mẫu và tùy chọn cỡ chữ.

**Acceptance Scenarios**

1. Với cài đặt mới, khi mở app, chỉ báo mức zoom hiển thị 100%. Chữ trong sidebar, hội thoại, composer, Files và Log cùng các thành phần như biểu tượng, nút, hàng danh sách và khoảng cách hiển thị tương đương bản trước ở 110%.
2. Khi người dùng đặt lại zoom từ mức khác, app trở về 100% mới. Bản nháp, tab đang mở và vị trí đọc vẫn được giữ.
3. Khi mở menu, tooltip, bảng lệnh hoặc hộp thoại ở mức 100%, các thành phần này theo cùng tỷ lệ với giao diện chính và vẫn thao tác được.

### User Story 2 - Tiếp tục tùy chỉnh zoom và cỡ chữ (Priority: P2)

Người dùng tiếp tục tăng, giảm hoặc đặt lại zoom toàn giao diện và chỉnh riêng cỡ chữ nội dung.

**Why this priority** — Người dùng vẫn có thể điều chỉnh theo màn hình và nhu cầu đọc sau khi kích thước mặc định tăng.

**Independent Test** — Thử các mức zoom và cỡ chữ qua phím tắt và điều khiển hiện có, sau đó đóng và mở lại app.

**Acceptance Scenarios**

1. Khi tăng từ 100% lên bậc tiếp theo, app hiển thị 110% và giao diện lớn hơn mức 100% mới. Giảm một bậc đưa giao diện về 100% mới.
2. Khi chỉnh riêng cỡ chữ nội dung, hội thoại, composer, Files và Log đổi cỡ chữ theo tùy chọn. Mức zoom và kích thước của các thành phần khung giao diện vẫn giữ nguyên.
3. Sau khi nâng cấp hoặc mở lại ứng dụng, app hiển thị mức zoom và tùy chọn cỡ chữ đã lưu ngay khi giao diện xuất hiện. Kích thước hiển thị được tính theo mốc mới.

### Edge Cases

- Trên cửa sổ nhỏ nhất được hỗ trợ, kể cả ở mức zoom cao nhất kết hợp với cỡ chữ lớn nhất, người dùng vẫn có thể truy cập các nút và nội dung qua cách cuộn hoặc thay đổi bố cục hiện có. Nội dung rộng như bảng và code có thể cuộn trong vùng riêng.
- Khi đặt lại zoom trong lúc soạn tin hoặc agent đang trả lời, app giữ bản nháp và vị trí đọc. Hội thoại tiếp tục cập nhật và các phiên agent tiếp tục chạy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — App phải dùng 100% làm mức zoom mặc định và mức đặt lại. Ở cùng điều kiện hiển thị, kích thước chữ, biểu tượng, nút, hàng danh sách và khoảng cách ở 100% mới phải tương đương 110% của bản trước. Yêu cầu áp dụng cho khung chính, sidebar, hội thoại và nội dung định dạng, composer, các panel gồm Files và Log, Settings, menu trong app, tooltip, bảng lệnh và hộp thoại.
- **FR-002** — Các mức zoom được hỗ trợ phải giữ nguyên nhãn, thứ tự và giới hạn hiện có. Mỗi mức áp dụng tương đối so với 100% mới. Điều khiển và phím tắt hiện có phải tiếp tục tăng, giảm và đặt lại zoom theo từng bậc.
- **FR-003** — Tùy chọn cỡ chữ nội dung phải tiếp tục hoạt động độc lập với zoom toàn giao diện. App phải khôi phục giá trị zoom và cỡ chữ đã lưu khi mở lại, kể cả lần mở đầu tiên sau nâng cấp.
- **FR-004** — Ở các kích thước cửa sổ được hỗ trợ, người dùng phải truy cập được các điều khiển và nội dung trong phạm vi tính năng. Thao tác đổi hoặc đặt lại zoom phải giữ bản nháp, tab đang mở, vị trí đọc và độ rộng sidebar đã lưu. Các phiên agent phải tiếp tục chạy và trả nội dung.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Khi so sánh cùng màn hình, kích thước cửa sổ, nội dung và tùy chọn cỡ chữ, 100% số mẫu chữ, biểu tượng, nút, hàng danh sách và khoảng cách đại diện ở các khu vực FR-001 có kích thước ở 100% mới sai lệch tối đa 1 pixel hiển thị so với 110% cũ. Đo các thành phần có kích thước cố định và cho phép các vùng linh hoạt đổi bố cục theo không gian.
- **SC-002** — Từ mọi bậc zoom được hỗ trợ, một thao tác đặt lại đưa app về 100% mới. Trong mọi ca mở lại và nâng cấp được kiểm tra, app khôi phục đúng cả hai giá trị zoom và cỡ chữ đã lưu.
- **SC-003** — Ở cửa sổ nhỏ nhất được hỗ trợ, tại 100% mới và tại tổ hợp zoom cùng cỡ chữ lớn nhất, người kiểm tra có thể mở workspace, đọc hội thoại, soạn tin và sử dụng hộp thoại mà chữ và nút không bị cắt hoặc chồng lên nhau, đồng thời cửa sổ không xuất hiện thanh cuộn ngang toàn cục.
- **SC-004** — Trong mọi ca đặt lại zoom khi đang soạn tin hoặc nhận phản hồi, bản nháp và tab vẫn hiện diện, tin nhắn đang đọc vẫn trong tầm nhìn và phản hồi tiếp tục xuất hiện.

## Assumptions

- “Bằng 110%” lấy mức 110% của bản Herdsman ngay trước thay đổi làm mốc so sánh. Phạm vi gồm giao diện do Herdsman hiển thị. Kích thước thanh tiêu đề và menu hệ điều hành do hệ điều hành quản lý.
- Giá trị zoom đã lưu giữ nguyên theo phần trăm. Ví dụ, cấu hình 110% đã lưu sẽ hiển thị 110% so với mốc lớn hơn sau nâng cấp.
