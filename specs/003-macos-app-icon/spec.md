# Feature Specification: Icon app đúng chuẩn macOS và đồng bộ logo trong app

**Feature Branch**: `003-macos-app-icon`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "update icon của app thành icon chuẩn kích cỡ trong macos, lấy icon H hiện tại luôn nhưng mà size phải nhỏ hơn, trong app cũng đổi icon của app giống như icon của macos hiện tại đi cho đồng bộ"

## Bối cảnh

Icon hiện tại của Herdsman (chữ H trắng, chấm xanh lá ở trên, chấm vàng ở dưới, nền đen bo góc) được vẽ **tràn kín cả khung ảnh**. Các app macOS chuẩn chỉ dùng phần giữa của khung và chừa lề trong suốt xung quanh, nên trên Dock, Launchpad, Finder và ⌘Tab icon Herdsman trông **to hơn hẳn** các app khác.

Trong app, góc trên sidebar lại hiện một logo **khác** (ba chấm nối nhau), không giống icon ngoài hệ điều hành. Người dùng thấy hai nhận diện khác nhau cho cùng một app.

Spec này giữ nguyên thiết kế chữ H, chỉ (1) thu nhỏ icon về đúng khung chuẩn macOS và (2) dùng đúng hình đó làm logo trong app.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Icon trên Dock có kích cỡ chuẩn macOS (Priority: P1)

Developer cài/mở Herdsman. Trên Dock, icon Herdsman nằm cạnh các app khác (Finder, Safari, Terminal…) với cùng kích cỡ nhìn thấy, cùng kiểu bo góc, không to hơn hay lệch hàng.

**Why this priority**: Đây là lỗi người dùng nhìn thấy mỗi ngày và là yêu cầu chính.

**Independent Test**: Build và mở app, đặt icon Herdsman trên Dock cạnh vài app hệ thống, so sánh bằng mắt và bằng ảnh chụp màn hình: phần nền bo góc của Herdsman có cùng kích cỡ với nền của app khác.

**Acceptance Scenarios**:

1. **Given** app đã được build với icon mới, **When** developer nhìn Dock, **Then** phần nền bo góc của icon Herdsman có cùng kích cỡ và vị trí với icon app macOS chuẩn khác (sai lệch không thấy được bằng mắt).
2. **Given** icon mới, **When** developer xem icon ở các nơi khác của macOS (Launchpad, Finder, ⌘Tab, thanh thông báo, cửa sổ Get Info), **Then** icon vẫn rõ nét và đúng kích cỡ chuẩn ở mọi nơi, kể cả kích cỡ nhỏ (16–32 px).
3. **Given** icon mới, **When** so với icon cũ, **Then** vẫn là cùng một thiết kế: chữ H trắng, chấm xanh lá ở trên, chấm vàng ở dưới, nền tối bo góc; chỉ có kích cỡ trong khung thay đổi.

---

### User Story 2 - Logo trong app giống icon ngoài hệ điều hành (Priority: P2)

Developer mở app; ở góc trên sidebar (cạnh chữ "Herdsman") thấy đúng icon chữ H như trên Dock, chỉ nhỏ lại.

**Why this priority**: Đồng bộ nhận diện; phụ thuộc vào thiết kế icon đã chốt ở Story 1 nhưng có thể làm độc lập.

**Independent Test**: Mở app, so logo ở sidebar với icon trên Dock: cùng hình chữ H, cùng màu hai chấm.

**Acceptance Scenarios**:

1. **Given** app đang mở với sidebar hiện, **When** developer nhìn góc trên sidebar, **Then** logo là chữ H trên nền tối bo góc với chấm xanh lá và chấm vàng, giống icon trên Dock; logo ba chấm cũ không còn.
2. **Given** app ở theme sáng hoặc tối, **When** developer đổi theme, **Then** logo vẫn nhìn rõ và giữ đúng màu của icon (không bị đổi màu theo theme đến mức khác icon ngoài Dock).
3. **Given** logo hiện ở kích cỡ nhỏ trong sidebar, **When** nhìn ở màn hình thường và Retina, **Then** chữ H và hai chấm vẫn phân biệt được, không bị nhoè.

---

### User Story 3 - Icon tab trình duyệt / bản web cũng đồng bộ (Priority: P3)

Khi mở giao diện qua trình duyệt (chế độ xem thử/mock), icon trên tab trình duyệt cũng là chữ H giống icon app.

**Why this priority**: Phụ, chỉ ảnh hưởng lúc phát triển/xem thử.

**Independent Test**: Mở bản web, nhìn tab trình duyệt.

**Acceptance Scenarios**:

1. **Given** bản web đang mở, **When** nhìn tab trình duyệt, **Then** icon tab là chữ H cùng thiết kế.

---

### Edge Cases

- macOS đang cache icon cũ sau khi cập nhật app: icon mới có thể chưa hiện ngay trên Dock cho tới khi app/Dock được khởi động lại — chấp nhận được, không phải lỗi của tính năng.
- Kích cỡ rất nhỏ (16 px): chấm màu và nét chữ H phải không dính vào nhau hay biến mất.
- Icon trên Windows/Linux (nếu có build): không bắt buộc đổi theo khung chuẩn macOS; giữ hiển thị hợp lý, không bị nhỏ bất thường.
- Thông báo hệ điều hành dùng icon app: phải hiện icon mới đúng kích cỡ.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Icon app trên macOS MUST theo khung chuẩn macOS: trên khung 1024×1024, phần nền bo góc chiếm khoảng 824×824 ở chính giữa, phần còn lại trong suốt.
- **FR-002**: Icon MUST giữ nguyên thiết kế hiện tại (chữ H trắng, chấm xanh lá trên, chấm vàng dưới, nền tối bo góc) và giữ nguyên tỉ lệ các chi tiết bên trong nền.
- **FR-003**: Icon MAY có bóng đổ nhẹ phía dưới nằm trong phần lề trong suốt, giống các app macOS chuẩn.
- **FR-004**: Mọi kích cỡ icon macOS cần (từ 16 px đến 1024 px, cả bản Retina) MUST được tạo lại từ thiết kế mới, không còn bản nào dùng thiết kế tràn khung cũ.
- **FR-005**: Logo ở góc trên sidebar MUST được thay bằng icon chữ H (cùng hình, cùng màu) thay cho logo ba chấm hiện tại.
- **FR-006**: Logo trong app MUST hiển thị rõ ở cả theme sáng và tối, và nét ở màn hình Retina.
- **FR-007**: Icon tab trình duyệt của bản web MUST dùng cùng thiết kế chữ H.
- **FR-008**: Icon trong app và icon ngoài hệ điều hành MUST lấy từ cùng một thiết kế gốc để về sau sửa một chỗ là đồng bộ cả hai.

### Key Entities

- **Thiết kế icon gốc**: hình vector chữ H (nền, chữ, hai chấm màu); nguồn duy nhất cho mọi biến thể.
- **Bộ icon hệ điều hành**: các ảnh icon theo từng kích cỡ mà macOS (và các nền tảng khác) dùng cho Dock, Finder, thông báo…
- **Logo trong app**: biến thể nhỏ của icon gốc hiện ở sidebar (và tab trình duyệt).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Đặt cạnh ít nhất 3 app hệ thống trên Dock, icon Herdsman có kích cỡ nền bo góc lệch không quá 2% so với các app đó (đo trên ảnh chụp màn hình).
- **SC-002**: 100% kích cỡ icon macOS trong bộ icon dùng thiết kế mới có lề trong suốt.
- **SC-003**: Người xem nhận ra logo sidebar và icon Dock là cùng một hình trong lần nhìn đầu tiên (kiểm tra bằng so sánh ảnh chụp cạnh nhau).
- **SC-004**: Ở 16 px, chữ H và hai chấm màu vẫn nhìn phân biệt được.

## Assumptions

- "Chuẩn kích cỡ macOS" theo hướng dẫn thiết kế icon app của Apple: khung 1024 px, nền bo góc ~824 px ở giữa, lề trong suốt ~100 px mỗi bên.
- Giữ nguyên màu và bố cục chữ H; không vẽ lại thiết kế mới.
- Không cần dùng hình bo góc "squircle" chính xác của Apple; bo góc tròn hiện tại được chấp nhận nếu nhìn tương đương.
- Icon Windows/Linux được tạo lại từ cùng thiết kế nhưng không bắt buộc theo lề của macOS.
- Logo trong sidebar giữ nguyên vị trí và kích cỡ khung hiện tại (cạnh chữ "Herdsman"), chỉ đổi hình.
- Tính năng không ảnh hưởng tới agent hay session đang chạy (chỉ là tài nguyên hình ảnh của app).
