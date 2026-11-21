# Feature Specification: Light theme — Paper style

**Feature Branch**: `015-light-paper-theme`

**Created**: 2026-11-21

**Status**: Draft — *Light style (`lightStyle`) was replaced by `lightTheme` / `darkTheme` theme ids in spec 016; Paper is now a built-in theme file.*

**Input**: User description: "Triển khai tính năng theme, tôi muốn light theme có thêm 1 bộ với style paper"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chọn bộ Paper cho chế độ Light (Priority: P1)

Developer mở Settings → Appearance và, bên cạnh lựa chọn System / Light / Dark hiện có, chọn thêm **bộ giao diện cho Light**: **Default** (shadcn minimal hiện tại) hoặc **Paper**. Khi chọn Paper và app đang ở chế độ Light, toàn bộ giao diện chuyển sang phong cách "giấy": nền kem ấm thay cho trắng/xám lạnh, chữ mực đậm ấm, viền mảnh màu giấy, cảm giác như đọc trên trang giấy.

**Why this priority**: là toàn bộ giá trị của tính năng; có nó là đã dùng được bộ Paper.

**Independent Test**: Settings → Appearance → chọn Light + Paper → nền, panel, sidebar, hộp thoại, chữ đổi sang tông giấy ngay lập tức, không cần tải lại; chọn Default → trở về giao diện Light cũ.

**Acceptance Scenarios**:

1. **Given** app đang ở Light + Default, **When** đổi sang Paper, **Then** mọi màn hình (sidebar, hội thoại, composer, Settings, command palette) hiện tông giấy ngay lập tức.
2. **Given** đang ở Light + Paper, **When** đổi lại Default, **Then** giao diện về đúng như trước khi có Paper.
3. **Given** đang ở Light + Paper, **When** đóng và mở lại app, **Then** lựa chọn vẫn được giữ.

---

### User Story 2 - Paper chỉ ảnh hưởng chế độ Light (Priority: P2)

Developer dùng System để theo macOS. Khi macOS ở Light, app dùng bộ Light đã chọn (kể cả Paper); khi macOS chuyển sang Dark, app dùng Dark như cũ, không bị đổi màu bởi Paper. Phím tắt đổi theme (⌘⇧L) vẫn hoạt động theo vòng System → Light → Dark.

**Why this priority**: giữ hành vi theme hiện có không bị phá; Paper là bộ của Light chứ không phải theme thứ tư độc lập.

**Independent Test**: chọn Paper, đổi System/Light/Dark và đổi appearance macOS → Paper chỉ hiện khi kết quả là Light.

**Acceptance Scenarios**:

1. **Given** Paper đã chọn và theme = Dark, **When** xem app, **Then** giao diện là Dark chuẩn.
2. **Given** theme = System, Paper đã chọn, **When** macOS chuyển Light ↔ Dark, **Then** app chuyển Paper ↔ Dark chuẩn.
3. **Given** bất kỳ trạng thái nào, **When** bấm ⌘⇧L, **Then** vẫn chuyển vòng System → Light → Dark và bộ Light đã chọn không bị mất.

---

### User Story 3 - Nội dung giàu định dạng đồng bộ với Paper (Priority: P3)

Code block, Mermaid, biểu đồ, bảng, thanh cuộn, vùng Log/terminal hiển thị hài hòa với tông giấy: không có mảng trắng lạnh chói hay chữ khó đọc trên nền kem.

**Why this priority**: hoàn thiện cảm giác nhất quán, nhưng bản P1 đã dùng được mà chưa cần.

**Independent Test**: mở hội thoại có code block, sơ đồ Mermaid, biểu đồ và bảng ở Light + Paper → tất cả đọc rõ, màu hợp nền giấy.

**Acceptance Scenarios**:

1. **Given** Light + Paper, **When** hội thoại có code block, Mermaid, biểu đồ, **Then** nền và màu của chúng hợp tông giấy và chữ vẫn đọc rõ.
2. **Given** Light + Paper, **When** xem thanh cuộn, **Then** thanh cuộn mảnh vẫn thấy rõ trên nền giấy.

---

### Edge Cases

- Lần đầu mở app sau nâng cấp (chưa có lựa chọn bộ Light): dùng Default, giao diện không đổi.
- Giá trị đã lưu không hợp lệ/không nhận ra: quay về Default.
- Đổi Light bộ khi app đang ở Dark: lựa chọn được lưu, hiện ra khi quay lại Light.
- Nội dung đã render sẵn (Mermaid, biểu đồ) khi đổi bộ: được vẽ lại theo màu mới, không cần tải lại.
- Trạng thái màu (xanh working/done, vàng blocked, đỏ error) vẫn phân biệt được trên nền giấy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Settings → Appearance MUST có lựa chọn bộ giao diện cho Light gồm **Default** và **Paper**, tách khỏi lựa chọn System / Light / Dark hiện có.
- **FR-002**: Khi kết quả theme là Light và bộ = Paper, app MUST dùng bảng màu giấy: nền kem ấm, chữ mực đậm ấm, viền và màu phụ cùng tông; không dùng gradient, giữ phong cách viền mảnh.
- **FR-003**: Khi kết quả theme là Dark, app MUST dùng Dark chuẩn bất kể bộ Light đã chọn.
- **FR-004**: Đổi bộ MUST có hiệu lực ngay lập tức trên toàn app, không cần tải lại.
- **FR-005**: Lựa chọn bộ Light MUST được lưu và khôi phục giữa các lần mở app; mặc định là Default.
- **FR-006**: Chữ trên nền Paper MUST đạt độ tương phản đọc được (tối thiểu 4.5:1 cho chữ thường) ở mọi vùng: sidebar, hội thoại, composer, hộp thoại, command palette.
- **FR-007**: Code block, Mermaid, biểu đồ, bảng, thanh cuộn MUST theo tông Paper khi ở Light + Paper.
- **FR-008**: Màu trạng thái (working/done, blocked, error) MUST vẫn phân biệt rõ trên nền Paper.
- **FR-009**: Phím tắt đổi theme (⌘⇧L) và hành vi System theo macOS MUST giữ nguyên; bộ Light đã chọn MUST không bị đổi khi chuyển giữa System/Light/Dark.
- **FR-010**: Với Light + Default, giao diện MUST giống hệt trước khi có tính năng này.

### Key Entities *(include if feature involves data)*

- **Theme mode**: System / Light / Dark — quyết định Light hay Dark đang hiệu lực (đã có).
- **Light style**: Default hoặc Paper — bộ màu dùng khi Light hiệu lực; là tùy chọn riêng, lưu cùng các thiết lập giao diện khác.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer đổi sang Paper trong tối đa 3 thao tác (mở Settings → chọn Paper → đóng) và thấy giao diện đổi ngay, không tải lại.
- **SC-002**: 100% màn hình chính (sidebar, hội thoại, composer, Settings, command palette) không còn nền trắng/xám lạnh nào của bộ Default khi ở Light + Paper.
- **SC-003**: Mọi cặp chữ–nền chính trên Paper đạt tương phản ≥ 4.5:1.
- **SC-004**: Lựa chọn bộ Light còn nguyên sau 100% lần khởi động lại app.
- **SC-005**: Ở Dark và ở Light + Default không có khác biệt thị giác nào so với trước khi có tính năng.

## Assumptions

- "Light theme có thêm 1 bộ" được hiểu là Paper là **biến thể của Light** (chọn riêng trong Appearance), không thay thế Light hiện tại và không có bản Dark của Paper.
- Phong cách Paper: tông kem/ngà ấm, chữ mực nâu-đen, viền mảnh; font giữ theo lựa chọn font hiện có của người dùng (không đổi font theo Paper).
- Mặc định vẫn là Light Default; người dùng cũ không thấy thay đổi cho tới khi chọn Paper.
- Lựa chọn lưu cục bộ cùng các thiết lập giao diện hiện có (theme, font).
- Ngoài phạm vi: bộ Dark mới, tùy chỉnh màu tự do, theme theo từng project.
- Phụ thuộc: màn hình Settings → Appearance (spec 010) và cơ chế theme hiện có.
