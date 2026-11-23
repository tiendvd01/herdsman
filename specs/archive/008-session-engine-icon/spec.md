# Feature Specification: Icon engine thay chữ ở tab session

**Feature Branch**: `008-session-engine-icon`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Thay vì dùng chữ claude để đánh dấu ở sau session thì dùng icon, các asset icon thể thấy trong herdr-app cho nhanh luôn, chạy hết các bước đến implement mà không cần hỏi t"

## Bối cảnh

Ở hàng tab session của mỗi workspace, sau tên session có chữ nhỏ "Claude" / "Codex" / "Echo" để cho biết session chạy engine nào. Chữ này chiếm chỗ, làm tên session bị cắt sớm và khó lướt mắt. Spec này thay chữ bằng icon nhận diện của engine (lấy từ bộ icon agent sẵn có của herdr-app: Claude Code, Codex; engine khác dùng icon "agent" chung).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nhận ra engine qua icon (Priority: P1)

Developer mở workspace có nhiều tab session; nhìn icon sau tên là biết tab nào chạy Claude, tab nào chạy Codex mà không phải đọc chữ.

**Why this priority**: Là toàn bộ yêu cầu.

**Independent Test**: Mở workspace có session Claude và session Codex (hoặc ?mock) → mỗi tab có icon tương ứng sau tên, không còn chữ "Claude"/"Codex".

**Acceptance Scenarios**:

1. **Given** session chạy Claude, **When** tab hiện, **Then** sau tên session là icon Claude Code, không có chữ "Claude".
2. **Given** session chạy Codex, **When** tab hiện, **Then** sau tên là icon Codex.
3. **Given** session chạy engine không có icon riêng (Echo, engine mới), **When** tab hiện, **Then** sau tên là icon agent chung.
4. **Given** rê chuột vào icon, **When** tooltip/nhãn hiện, **Then** thấy tên engine ("Claude", "Codex", "Echo"); trình đọc màn hình cũng đọc được tên engine.

### Edge Cases

- Tên session dài: tên vẫn bị cắt bằng dấu "…", icon không bị co hay đẩy ra ngoài.
- Theme sáng/tối: icon vẫn nhìn rõ trên cả hai nền; icon chung đổi màu theo màu chữ của tab.
- Tab đang chọn / không chọn: icon giữ màu thương hiệu (Claude, Codex), không mờ đến mức khó nhận ra.
- App chạy offline: icon hiển thị được, không tải từ mạng.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tab session MUST hiện icon engine thay cho chữ tên engine sau tên session.
- **FR-002**: Claude và Codex MUST có icon riêng; engine khác MUST dùng icon agent chung.
- **FR-003**: Icon MUST có tên engine làm nhãn truy cập và tooltip khi rê chuột.
- **FR-004**: Icon MUST cao cỡ chữ của tab (không làm hàng tab cao hơn) và MUST NOT co lại khi tên session dài.
- **FR-005**: Icon MUST đóng gói sẵn trong app, không tải qua mạng.
- **FR-006**: Những chỗ khác dùng tên engine dạng chữ (câu thông báo trong hội thoại, hộp thoại tạo workspace) MUST giữ nguyên.

### Key Entities

- **Engine icon**: hình nhận diện ứng với mỗi engine (claude, codex, mặc định), kèm tên hiển thị.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% tab session hiện icon thay cho chữ engine; không còn chữ "Claude"/"Codex"/"Echo" sau tên ở hàng tab.
- **SC-002**: Với cùng độ rộng tab, phần tên session hiển thị được nhiều ký tự hơn trước (chữ "Claude" ~6 ký tự được thay bằng một icon cỡ một ký tự).
- **SC-003**: Developer phân biệt được tab Claude và tab Codex trong dưới 1 giây chỉ bằng cách nhìn.

## Assumptions

- Chỉ đổi hàng tab session ở vùng giữa — chỗ duy nhất hiện chữ engine sau tên session.
- Dùng lại icon SVG của herdr-app (`icons/claude.svg`, `icons/codex.svg`, `icons/agent.svg`; giấy phép MIT của LobeHub / Lucide), chép vào app.
- Badge "bypass" và chấm trạng thái giữ nguyên.
