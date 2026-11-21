# Feature Specification: Bộ mã màu theo tên (color token set)

**Feature Branch**: `016-color-theme-tokens`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "Thiết kế bộ mã màu giống tham khảo cấu trúc mã màu của herdr app này, để thiết kế bộ mã màu cho app herdsman để mỗi khi t thêm màu mới thì chỉ cần sửa bộ màu thay vì phải sửa tay, t có thể tự thêm custom"

## Bối cảnh

Herdr (app tham khảo) mô tả mỗi theme bằng **một file**: vài màu gốc (nền, chữ, vùng chọn, 16 màu terminal) cộng một bảng màu **đặt theo vai trò** (`canvas`, `chrome`, `surface`, `popover`, `raised`, `hover`, `selected`, `border`, `input`, `muted`, `dim`, `accent`, `solid`, `working`, `blocked`, `done`, `idle`…). Mọi theme dùng **cùng một tập tên**, nên giao diện không cần biết đang là theme nào; thêm theme chỉ là thêm một file, và màu nào không khai báo thì được suy ra từ màu gốc.

Herdsman hiện chưa như vậy: màu nằm rải rác — một khối cho Light, một khối cho Paper, một khối cho Dark, thêm các mã hex gõ tay trong sơ đồ Mermaid và biểu đồ. Thêm một màu hay một theme mới nghĩa là sửa nhiều nơi và dễ lệch nhau.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mỗi theme là một bộ màu duy nhất, cùng tập tên (Priority: P1)

Developer muốn đổi hoặc thêm một màu cho theme chỉ bằng cách sửa **một nơi: bộ màu của theme đó**. Mọi theme có sẵn (Light, Paper, Dark) được mô tả bằng cùng một cấu trúc, cùng một tập tên màu theo vai trò (nền, bề mặt, viền, chữ phụ, nhấn, trạng thái working/blocked/done/idle/error…). Không còn mã hex nào phải sửa tay ngoài bộ màu.

**Why this priority**: là mục tiêu cốt lõi — bỏ việc sửa tay nhiều chỗ khi đổi màu.

**Independent Test**: đổi một màu (ví dụ viền) trong bộ màu của Paper → mọi chỗ dùng màu viền (sidebar, hộp thoại, bảng, Mermaid, biểu đồ) đổi theo ở Paper, và không file nào khác phải sửa; Light và Dark không đổi.

**Acceptance Scenarios**:

1. **Given** bộ màu Paper, **When** sửa giá trị `primary`, **Then** mọi thành phần dùng màu chính (nút đặc, mục đang chọn, series chính của biểu đồ) hiện màu mới ở Paper mà không cần sửa chỗ nào khác.
2. **Given** ba theme có sẵn, **When** so sánh bộ màu của chúng, **Then** chúng có đúng cùng tập tên màu; theme nào thiếu tên màu bắt buộc bị báo lỗi rõ ràng thay vì hiển thị sai.
3. **Given** giao diện đã chuyển sang bộ màu, **When** tìm trong mã giao diện, **Then** không còn mã màu gõ tay nằm ngoài bộ màu (kể cả Mermaid và biểu đồ).

---

### User Story 2 - Thêm màu mới chỉ ở một chỗ (Priority: P1)

Developer cần một màu mới (ví dụ `warning-surface` hay `link`). Họ khai báo **tên màu một lần** (kèm giá trị mặc định suy ra từ màu gốc), từ đó mọi theme có sẵn có màu đó; theme nào muốn khác thì ghi đè trong bộ màu của mình. Giao diện dùng màu theo tên.

**Why this priority**: đây là điều người dùng nói rõ ("mỗi khi thêm màu mới thì chỉ cần sửa bộ màu").

**Independent Test**: thêm một tên màu mới + cách suy ra mặc định → dùng tên đó ở một thành phần → màu hiện đúng ở cả Light, Paper và Dark mà không phải khai báo từng theme.

**Acceptance Scenarios**:

1. **Given** một tên màu mới có quy tắc suy ra từ màu gốc, **When** dùng ở một thành phần, **Then** thành phần hiện màu hợp lý ở mọi theme dù theme không khai báo riêng.
2. **Given** một theme ghi đè tên màu mới, **When** xem theme đó, **Then** thấy giá trị ghi đè; các theme khác vẫn dùng giá trị suy ra.

---

### User Story 3 - Tự thêm theme custom bằng một file (Priority: P2)

Developer tự tạo theme riêng bằng cách viết một file bộ màu (chỉ cần màu gốc; màu theo vai trò không khai báo sẽ được suy ra, khai báo thì ghi đè) và đặt vào thư mục theme của người dùng. Theme mới xuất hiện trong Settings → Appearance để chọn, không cần sửa hay build lại app.

**Why this priority**: mở rộng tự do cho người dùng, nhưng US1/US2 đã giải quyết được nỗi đau chính.

**Independent Test**: thả một file theme hợp lệ vào thư mục → mở Settings → thấy tên theme mới, chọn → toàn app đổi sang bộ màu đó; xóa file → theme biến mất và app trở về theme mặc định.

**Acceptance Scenarios**:

1. **Given** file theme hợp lệ chỉ có màu gốc, **When** chọn theme, **Then** mọi vai trò màu được suy ra và giao diện đọc rõ.
2. **Given** file theme ghi đè một vai trò (ví dụ `border`), **When** chọn theme, **Then** vai trò đó dùng giá trị ghi đè.
3. **Given** file theme sai (thiếu màu gốc, mã màu không hợp lệ, JSON hỏng), **When** app nạp, **Then** theme đó bị bỏ qua kèm thông báo lỗi cụ thể (tên file, trường sai), các theme khác vẫn dùng bình thường.
4. **Given** theme đang chọn bị xóa hoặc hỏng, **When** mở app, **Then** app dùng theme mặc định thay vì giao diện vỡ.

---

### User Story 4 - Theme sáng/tối cùng tên màu, và Paper là một theme thường (Priority: P3)

Theme được đánh dấu sáng hay tối. Light, Paper và Dark là ba theme trong cùng một danh sách; "Light style" (spec 015) trở thành việc chọn theme sáng. Hành vi System (theo macOS) và phím ⌘⇧L giữ nguyên: System chọn theme sáng đã chọn khi macOS sáng, theme tối đã chọn khi macOS tối.

**Why this priority**: dọn mô hình cho nhất quán, nhưng bản P1/P2 chưa cần.

**Independent Test**: chọn một theme sáng và một theme tối; đổi macOS Light/Dark ở chế độ System → app chuyển đúng hai theme đó; ⌘⇧L vẫn xoay System → Light → Dark.

**Acceptance Scenarios**:

1. **Given** theme sáng = Paper và theme tối = Dark, **When** macOS chuyển Light ↔ Dark, **Then** app chuyển Paper ↔ Dark.
2. **Given** có theme custom sáng, **When** chọn làm theme sáng, **Then** nó thay Paper/Light ở mọi chỗ Light được dùng.

---

### Edge Cases

- Theme thiếu một vai trò màu mà không suy ra được: dùng giá trị suy ra từ màu gốc; nếu cả màu gốc cũng thiếu thì theme bị từ chối.
- Theme custom trùng tên theme có sẵn: không ghi đè bản có sẵn; báo trùng tên và bỏ qua file.
- Màu suy ra khiến chữ khó đọc (tương phản thấp): theme vẫn nạp được nhưng có cảnh báo tương phản khi kiểm tra theme.
- Thêm tên màu mới mà một theme custom cũ chưa biết: theme đó dùng giá trị suy ra, không vỡ.
- Màu trạng thái (working/blocked/done/idle/error) luôn có mặt ở mọi theme.
- Vùng Log/terminal giữ nền tối ở mọi theme sáng (như hiện nay).
- Đổi theme khi đang xem Mermaid/biểu đồ: được vẽ lại theo màu mới.
- Định dạng mã màu: chỉ nhận mã hex 6 chữ số; giá trị khác bị báo lỗi.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Mỗi theme MUST được mô tả bởi đúng một bộ màu (một file), gồm các màu gốc (nền, chữ, vùng chọn) và các màu theo vai trò; mọi theme có sẵn MUST dùng cùng cấu trúc này.
- **FR-002**: Tập tên màu theo vai trò MUST thống nhất giữa mọi theme, tối thiểu phủ các nhóm: nền chính, thanh bên/chrome, bề mặt nâng, hover/đang chọn, viền, ô nhập, vòng focus, chữ chính, chữ phụ, nút đặc + chữ trên nút đặc, màu code, trạng thái working / blocked / error / done / idle, cảnh báo, diff, vùng Log (terminal) và thanh cuộn. Tên cụ thể và bảng đối chiếu với Herdr nằm ở data-model.md.
- **FR-003**: Màu theo vai trò không được khai báo trong bộ màu MUST được suy ra từ màu gốc bằng quy tắc mặc định chung; màu được khai báo MUST thắng giá trị suy ra.
- **FR-004**: Giao diện (mọi thành phần, bao gồm sơ đồ Mermaid, biểu đồ, code highlight, thanh cuộn, vùng Log) MUST lấy màu chỉ từ tên màu của bộ màu đang dùng; MUST NOT còn mã màu gõ tay nằm ngoài bộ màu.
- **FR-005**: Thêm một tên màu mới MUST chỉ cần khai báo tên và quy tắc suy ra mặc định ở một nơi; mọi theme MUST có màu đó mà không phải sửa từng theme.
- **FR-006**: Developer MUST thêm được theme custom bằng một file đặt vào thư mục theme của người dùng; theme hợp lệ MUST hiện trong Settings → Appearance và dùng được không cần sửa hay build lại app.
- **FR-007**: Mỗi theme MUST khai báo là sáng hay tối; Settings MUST cho chọn theme sáng và theme tối, và chế độ System / ⌘⇧L MUST giữ hành vi hiện có.
- **FR-008**: Theme không hợp lệ (JSON hỏng, thiếu màu gốc, mã màu sai định dạng, trùng tên theme có sẵn) MUST bị bỏ qua kèm thông báo lỗi nêu tên file và trường sai; các theme khác MUST không bị ảnh hưởng.
- **FR-009**: Nếu theme đang chọn không còn hợp lệ, app MUST chuyển về theme mặc định (không giao diện vỡ).
- **FR-010**: Ba theme có sẵn (Light, Paper, Dark) MUST giữ nguyên diện mạo hiện tại sau khi chuyển sang bộ màu mới (không khác biệt thị giác nhìn thấy được).
- **FR-011**: Đổi bộ màu MUST có hiệu lực ngay trên toàn app, kể cả nội dung đã vẽ (Mermaid, biểu đồ), không cần tải lại.
- **FR-012**: Việc kiểm tra bộ màu MUST báo được các cặp chữ–nền tương phản dưới 4.5:1 cho từng theme (cảnh báo cho theme custom, lỗi cho theme có sẵn).

### Key Entities *(include if feature involves data)*

- **Theme (bộ màu)**: tên, sáng/tối, màu gốc (nền, chữ, vùng chọn, 16 màu terminal nếu có), tùy chọn ghi đè màu theo vai trò.
- **Vai trò màu (color role)**: một tên cố định dùng trong giao diện (ví dụ `border`, `accent`, `working`); có quy tắc suy ra mặc định từ màu gốc.
- **Danh mục theme**: tập hợp theme có sẵn và theme custom; có theme mặc định, theme sáng đang chọn và theme tối đang chọn.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Đổi một màu của một theme chỉ cần sửa đúng 1 file, và 100% thành phần dùng vai trò màu đó đổi theo.
- **SC-002**: Thêm một tên màu mới chỉ cần sửa 1 nơi để cả 3 theme có sẵn có màu đó (0 file theme phải sửa).
- **SC-003**: Tạo và dùng một theme custom hoàn chỉnh trong dưới 5 phút, chỉ với màu gốc và không phải sửa mã của app.
- **SC-004**: 0 mã màu gõ tay còn lại ngoài bộ màu trong toàn bộ giao diện (kể cả Mermaid và biểu đồ).
- **SC-005**: Light, Paper và Dark không có khác biệt thị giác nào so với trước khi chuyển.
- **SC-006**: 100% theme lỗi được bỏ qua với thông báo nêu đúng file và trường sai; không trường hợp nào làm app hiển thị vỡ.

## Assumptions

- Cấu trúc theo tham khảo từ Herdr: màu gốc + bảng màu theo vai trò + màu trạng thái, thống nhất tên giữa theme sáng và tối; không sao chép nguyên tập tên mà chỉ lấy cùng nguyên tắc, thêm các vai trò riêng của Herdsman (ví dụ cảnh báo, diff, vùng Log).
- Theme có sẵn của Herdsman là Light, Paper, Dark (kế thừa spec 015); Paper không còn là "biến thể" riêng mà là một theme sáng trong danh sách.
- Theme custom đặt trong thư mục dữ liệu của người dùng (cùng nơi lưu thiết lập app), mỗi theme một file; nạp lại khi mở app và khi mở Settings.
- Màu chỉ nhận mã hex `#rrggbb`; chưa hỗ trợ alpha hay màu tên.
- Ngoài phạm vi: trình soạn theme bằng giao diện đồ họa, chia sẻ/nhập theme từ mạng, theme theo từng project, đổi font theo theme.
- Phụ thuộc: Settings → Appearance (spec 010), theme sáng/tối và Paper (spec 015), thanh cuộn theo theme (spec 011).
