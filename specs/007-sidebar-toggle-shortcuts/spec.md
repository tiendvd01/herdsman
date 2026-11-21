# Feature Specification: Phím tắt ẩn/hiện hai sidebar

**Feature Branch**: `007-sidebar-toggle-shortcuts`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Thêm phím tắt CMD-B để toggle sidebar left và CMD-R để toggle sidebar right"

**Liên quan**: [004 — kéo đổi độ rộng hai sidebar](../004-resizable-sidebars/spec.md)

## Bối cảnh

Hiện muốn ẩn/hiện sidebar trái (project → workspace) hoặc side panel phải (Agents, Tasks, Files, Log), developer phải bấm nút ở header của vùng giữa, hoặc mở command palette (⌘K). App đã có phím tắt cho các việc khác (⌘K, ⌘N, ⌘T, ⌘O, ⌘⇧L) nhưng chưa có cho hai sidebar. Spec này thêm ⌘B cho sidebar trái và ⌘R cho side panel phải, giống thói quen ở các editor quen thuộc.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - ⌘B ẩn/hiện sidebar trái (Priority: P1)

Developer muốn dành hết chỗ cho hội thoại. Nhấn ⌘B: sidebar trái ẩn. Nhấn ⌘B lần nữa: sidebar trái hiện lại đúng như trước.

**Why this priority**: Sidebar trái là cột chiếm chỗ thường xuyên nhất; ⌘B là phím quen thuộc nhất cho việc này. Là giá trị độc lập nhỏ nhất.

**Independent Test**: Mở app với sidebar trái đang hiện, nhấn ⌘B → sidebar ẩn, nút trên header chuyển sang "Expand sidebar"; nhấn ⌘B → sidebar hiện lại với độ rộng cũ.

**Acceptance Scenarios**:

1. **Given** sidebar trái đang hiện, **When** developer nhấn ⌘B, **Then** sidebar trái ẩn đi, vùng hội thoại giãn ra, nút ẩn/hiện ở header đổi trạng thái tương ứng.
2. **Given** sidebar trái đang ẩn, **When** developer nhấn ⌘B, **Then** sidebar trái hiện lại với đúng độ rộng trước khi ẩn (spec 004).
3. **Given** developer đang gõ dở trong ô nhập tin nhắn, **When** nhấn ⌘B, **Then** sidebar trái ẩn/hiện, nội dung đang gõ và vị trí con trỏ giữ nguyên, không có ký tự nào được chèn và chữ không bị định dạng.

---

### User Story 2 - ⌘R ẩn/hiện side panel phải (Priority: P1)

Developer xem xong Log hoặc Files và muốn đóng panel phải; lát sau mở lại để xem tiếp. Nhấn ⌘R để ẩn/hiện.

**Why this priority**: Ngang hàng với US1 — người dùng yêu cầu cả hai phím.

**Independent Test**: Side panel phải đang mở ở tab Log, nhấn ⌘R → panel ẩn; nhấn ⌘R → panel hiện lại, vẫn ở tab Log và đúng độ rộng cũ. Trang không bị tải lại.

**Acceptance Scenarios**:

1. **Given** side panel phải đang hiện, **When** developer nhấn ⌘R, **Then** panel ẩn đi và app **không** tải lại trang, không mất trạng thái nào.
2. **Given** side panel phải đang ẩn, **When** developer nhấn ⌘R, **Then** panel hiện lại với đúng tab và độ rộng trước khi ẩn.
3. **Given** developer đang gõ dở trong ô nhập, **When** nhấn ⌘R, **Then** panel ẩn/hiện, nội dung đang gõ giữ nguyên.

---

### User Story 3 - Biết phím tắt mà không cần nhớ (Priority: P2)

Developer chưa biết hai phím tắt này; khi rê chuột vào nút ẩn/hiện ở header hoặc mở command palette, developer thấy phím tắt tương ứng.

**Why this priority**: Giúp phát hiện tính năng; phím tắt vẫn dùng được khi chưa có phần này.

**Independent Test**: Rê chuột vào nút ẩn/hiện sidebar trái → tooltip có "⌘B"; mở ⌘K, gõ "sidebar" → thấy lệnh ẩn/hiện sidebar kèm "⌘B" và lệnh ẩn/hiện side panel kèm "⌘R".

**Acceptance Scenarios**:

1. **Given** chuột rê vào nút ẩn/hiện sidebar trái hoặc side panel phải ở header, **When** tooltip hiện, **Then** tooltip ghi kèm phím tắt (⌘B / ⌘R).
2. **Given** command palette đang mở, **When** developer tìm "sidebar" hoặc "side panel", **Then** có lệnh ẩn/hiện cho cả hai cột, mỗi lệnh hiện phím tắt của nó, và chọn lệnh cho kết quả giống nhấn phím.

---

### Edge Cases

- Đang có hộp thoại (tạo workspace, xác nhận xoá, command palette…) mở: phím tắt không làm gì, để không đổi bố cục phía sau hộp thoại hoặc làm mất focus của hộp thoại.
- Giữ phím (auto-repeat) hoặc nhấn rất nhanh: mỗi lần nhấn chỉ đổi trạng thái một lần; giữ phím không làm sidebar nhấp nháy liên tục.
- Focus đang ở terminal của Log: ⌘B / ⌘R vẫn ẩn/hiện sidebar và không gửi ký tự nào vào terminal. Nếu ẩn chính side panel chứa terminal thì focus chuyển về vùng hội thoại, không bị mất.
- Đang kéo mép sidebar (spec 004) mà nhấn phím tắt: thao tác kéo kết thúc, sidebar ẩn/hiện bình thường.
- Tổ hợp có thêm phím khác (⌘⇧B, ⌘⌥R, ⌘⇧R…) không kích hoạt tính năng này.
- Trên nền tảng không phải macOS, phím Ctrl đóng vai ⌘ như các phím tắt hiện có; riêng khi focus ở terminal của Log thì Ctrl+B / Ctrl+R được để lại cho terminal (vì đó là phím quen dùng trong shell/tmux).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Nhấn ⌘B MUST đảo trạng thái hiện/ẩn của sidebar trái.
- **FR-002**: Nhấn ⌘R MUST đảo trạng thái hiện/ẩn của side panel phải và MUST NOT tải lại giao diện app.
- **FR-003**: Phím tắt MUST hoạt động ở mọi chỗ trong cửa sổ chính, kể cả khi focus đang ở ô nhập tin nhắn, ô tìm kiếm hay terminal của Log, trừ khi đang có hộp thoại mở.
- **FR-004**: Khi phím tắt được xử lý, MUST NOT có ký tự hay định dạng nào được chèn vào ô đang focus, và nội dung đang gõ cùng vị trí con trỏ MUST giữ nguyên.
- **FR-005**: Ẩn/hiện bằng phím tắt MUST cho kết quả giống hệt bấm nút ở header: cùng trạng thái được ghi nhớ qua lần mở app sau, giữ độ rộng (spec 004), giữ tab đang mở của side panel.
- **FR-006**: Phím giữ lâu (auto-repeat) MUST NOT đổi trạng thái thêm lần nào.
- **FR-007**: Chỉ đúng tổ hợp ⌘B / ⌘R (không kèm Shift, Option/Alt) mới kích hoạt.
- **FR-008**: Tooltip của nút ẩn/hiện sidebar trái và side panel phải MUST ghi phím tắt tương ứng.
- **FR-009**: Command palette MUST có lệnh ẩn/hiện sidebar trái (kèm ⌘B) và lệnh ẩn/hiện side panel phải (kèm ⌘R); nhãn lệnh phản ánh trạng thái hiện tại ("Hide …" / "Show …").
- **FR-010**: Khi ẩn cột đang chứa phần tử có focus, focus MUST chuyển về một chỗ hợp lý trong vùng hội thoại (ô nhập tin nhắn nếu có), không rơi về trạng thái không có focus.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer ẩn hoặc hiện mỗi sidebar bằng một lần nhấn phím, không cần chuột.
- **SC-002**: Sidebar ẩn/hiện ngay khi nhấn phím, không có độ trễ nhìn thấy được.
- **SC-003**: 0 lần app tải lại trang khi nhấn ⌘R trong quá trình kiểm thử.
- **SC-004**: 100% lần nhấn phím tắt khi đang gõ trong ô nhập giữ nguyên nội dung đang gõ.
- **SC-005**: Cả hai phím tắt xuất hiện ở ít nhất hai chỗ người dùng tự tìm thấy được (tooltip nút và command palette).

## Assumptions

- "Sidebar left" là sidebar project/workspace; "sidebar right" là side panel Agents/Tasks/Files/Log.
- ⌘R vốn là phím tải lại trang trong WebView; trong app này tải lại không có ích cho người dùng (dữ liệu dựng lại từ event log), nên chiếm ⌘R cho side panel là chấp nhận được. Nếu developer cần tải lại khi phát triển thì dùng cách khác (menu dev tools).
- Ô nhập tin nhắn không có định dạng chữ đậm bằng ⌘B, nên không có xung đột cần giữ lại.
- Không cho người dùng tự đổi phím tắt trong phạm vi spec này.
- Không thêm hiệu ứng chuyển động mới; ẩn/hiện giống hệt khi bấm nút hiện nay.
- Chỉ đổi giao diện; không ảnh hưởng agent hay session (nguyên tắc I của constitution).
