# Feature Specification: Theme Preview Picker

**Feature Branch** — `master` (nhánh hiện tại)

**Created** — 2026-11-25

**Status** — Draft

**Input** — “Làm giao diện chọn theme như thế này” kèm ảnh mẫu có hai nhóm Dark và Light, mỗi theme có một thẻ xem trước.

## User Scenarios & Testing

### User Story 1 - Xem trước và chọn theme (Priority P1)

Người dùng mở Settings → Appearance để so sánh bảng màu và chọn theme trực tiếp trên thẻ.

**Why this priority** — Người dùng thấy màu của từng theme trước khi đổi giao diện.

**Independent Test** — Mở Appearance với theme có sẵn và một theme tùy chỉnh hợp lệ. Chọn một thẻ trong mỗi nhóm và kiểm tra màu xem trước, dấu chọn và giao diện đang dùng.

**Acceptance Scenarios**

1. **Given** danh mục có theme sáng và tối, **when** người dùng mở Appearance, **then** hai nhóm `Dark` và `Light` xuất hiện theo thứ tự trong ảnh. Mỗi theme có một thẻ với mẫu màu và tên. Mỗi nhóm có một thẻ được đánh dấu bằng viền và dấu kiểm.
2. **Given** app đang ở chế độ Light, **when** người dùng chọn một theme Light khác, **then** app đổi màu ngay, dấu chọn chuyển sang thẻ mới và nhóm Dark giữ lựa chọn đã lưu.
3. **Given** app đang ở chế độ Light, **when** người dùng chọn một theme Dark khác, **then** dấu chọn của nhóm Dark cập nhật ngay. Giao diện vẫn ở chế độ Light và dùng lựa chọn Dark mới khi chuyển sang Dark.
4. **Given** người dùng đã chọn theme cho cả hai nhóm, **when** họ đóng rồi mở lại app hoặc đổi giữa System, Light và Dark, **then** mỗi nhóm khôi phục đúng lựa chọn. Chế độ System dùng theme ứng với giao diện hiện hành của hệ điều hành.
5. **Given** bản cài mới đang ở chế độ Dark, **when** người dùng lần lượt chọn Catppuccin Frappé và One Dark Pro, **then** mỗi thẻ có bảng màu riêng, giao diện Herdsman áp dụng bảng màu tương ứng ngay và dấu chọn chuyển đến đúng thẻ.

### User Story 2 - Duyệt danh mục trong cửa sổ hẹp và bằng bàn phím (Priority P2)

Người dùng có thể nhận diện và chọn bất kỳ theme nào khi thu hẹp cửa sổ, phóng to giao diện hoặc chỉ dùng bàn phím.

**Why this priority** — Việc xem trước và chọn theme cần hoạt động trong cùng các điều kiện sử dụng như phần còn lại của Settings.

**Independent Test** — Thu hẹp cửa sổ, mở một danh mục có tên theme dài, dùng bàn phím để chọn theme ở cả hai nhóm.

**Acceptance Scenarios**

1. **Given** nhóm có ít nhất năm theme và đủ chiều ngang cho bốn cột, **when** khoang Settings thu hẹp, **then** lưới chuyển từ bốn cột sang ít cột hơn. Mọi thẻ và dấu chọn vẫn truy cập được mà không cần cuộn ngang.
2. **Given** một tên dài bị rút gọn, **when** người dùng trỏ chuột hoặc đưa focus tới thẻ, **then** họ có thể đọc tên đầy đủ. Trình đọc màn hình công bố tên đầy đủ và trạng thái đã chọn.
3. **Given** người dùng chỉ dùng bàn phím, **when** họ di chuyển focus và chọn thẻ ở từng nhóm, **then** focus phân biệt được với dấu chọn và thao tác chọn có cùng kết quả như bấm thẻ.

### Edge Cases

- Theme tùy chỉnh đã chọn bị xóa, đổi nhóm sáng/tối hoặc trở thành không hợp lệ. Sau khi tải lại danh mục, nhóm tương ứng đánh dấu theme mặc định và app dùng theme đó khi nhóm hoạt động.
- Danh mục có ít hơn bốn theme trong nhóm. Hàng cuối hiển thị đúng số thẻ có sẵn.
- Nếu cửa sổ hẹp hoặc mức zoom cao chỉ đủ một cột, danh mục vẫn cuộn dọc và người dùng có thể truy cập cả hai nhóm.

## Requirements

### Functional Requirements

- **FR-001** — Settings → Appearance MUST thay hai dropdown chọn theme bằng hai lưới thẻ `Dark` rồi `Light`. Mỗi nhóm liệt kê tất cả theme có sẵn và theme tùy chỉnh hợp lệ thuộc nhóm đó, mỗi theme đúng một lần.
- **FR-002** — Mỗi thẻ MUST có khung xem trước bo góc với màu nền, một vạch màu chữ và năm chấm màu đại diện cho bảng màu của chính theme đó. Tên theme hiển thị bên dưới mẫu màu. Việc xem thẻ không làm đổi theme đang dùng.
- **FR-003** — Mỗi nhóm MUST dùng viền nổi bật và dấu kiểm để đánh dấu đúng một theme đang được chọn, kể cả khi nhóm đó không hoạt động. Người dùng MUST có thể chọn bằng cách bấm vào bất kỳ phần nào của thẻ.
- **FR-004** — App MUST lưu lựa chọn sáng và tối độc lập, áp dụng ngay nếu nhóm đang hoạt động và dùng lựa chọn đã lưu khi nhóm đó hoạt động sau này. Điều khiển System/Light/Dark giữ chức năng hiện tại.
- **FR-005** — Lưới MUST hiển thị tối đa bốn cột mỗi nhóm, tự xuống hàng và giảm số cột theo chiều rộng khả dụng. Người dùng MUST truy cập được mọi thẻ và dấu chọn mà không cần cuộn ngang.
- **FR-006** — Người dùng MUST có thể duyệt và chọn bằng bàn phím, phân biệt focus với trạng thái đã chọn và xem đầy đủ nhãn bị cắt khi hover hoặc focus. Trình đọc màn hình MUST công bố nhóm, tên đầy đủ và trạng thái lựa chọn.
- **FR-007** — Khi một theme đã lưu không còn khả dụng trong nhóm, app MUST đánh dấu và dùng theme mặc định của nhóm đó. Quy trình tải lại và thông báo lỗi cho theme tùy chỉnh tiếp tục hoạt động trong Appearance.
- **FR-008** — Herdsman MUST cung cấp sẵn `Catppuccin Frappé` và `One Dark Pro` trong nhóm `Dark`. Mỗi theme MUST dùng bảng màu tương ứng cho cả thẻ xem trước và giao diện Herdsman khi được áp dụng, đồng thời đáp ứng tỷ lệ tương phản tối thiểu 4,5:1 cho chữ thường.

### Key Entities

- **Theme** — Một lựa chọn thuộc nhóm sáng hoặc tối, có tên và bảng màu để xem trước.
- **Tùy chọn giao diện** — Chế độ System, Light hoặc Dark và một theme được chọn riêng cho mỗi nhóm.

## Success Criteria

### Measurable Outcomes

- **SC-001** — Trong một danh mục kiểm thử gồm ít nhất năm theme thuộc một nhóm, 100% theme hợp lệ xuất hiện đúng một lần và đúng nhóm. Mỗi thẻ có tên, màu nền, vạch màu chữ và năm chấm màu.
- **SC-002** — Từ màn hình Appearance, người dùng đổi theme của nhóm đang hoạt động bằng một lần bấm. Màu giao diện và dấu chọn cập nhật trong vòng một giây, không cần đóng Settings.
- **SC-003** — Sau khi chọn hai theme khác mặc định, đóng và mở lại app rồi lần lượt kiểm tra System, Light và Dark, cả hai lựa chọn khôi phục đúng. Mỗi nhóm luôn có đúng một dấu chọn, kể cả sau khi một theme đã chọn bị xóa.
- **SC-004** — Ở hai kích thước, một đủ bốn cột và một chỉ đủ một cột, người dùng có thể chọn mọi thẻ bằng bàn phím, đọc đầy đủ tên dài và nhận biết lựa chọn ở cả hai nhóm mà không cần cuộn ngang.
- **SC-005** — Trong kiểm thử với năm người dùng, ít nhất bốn người tìm và chọn được một theme trong vòng 30 giây kể từ khi mở Appearance và chỉ đúng thẻ đã chọn trong mỗi nhóm.
- **SC-006** — Trên bản cài mới, cả hai theme mới xuất hiện đúng một lần trong nhóm Dark. Khi lần lượt chọn từng theme, màu nền và màu chữ trên thẻ tương ứng với màu giao diện đang dùng. Chữ thường trên cả hai theme đạt tỷ lệ tương phản ít nhất 4,5:1.

## Assumptions

- Ảnh mẫu định hướng cách trình bày và trạng thái thẻ. Danh mục gồm các theme có sẵn của Herdsman, hai theme Dark mới và các theme tùy chỉnh hợp lệ.
- Tính năng nằm trong Settings → Appearance và dùng các tùy chọn hiện có của [App Shell Appearance](../033-app-shell-appearance/spec.md). Việc đổi theme không làm gián đoạn phiên agent đang chạy.
