# Feature Specification: Thanh cuộn mảnh theo theme

**Feature Branch**: `011-thin-themed-scrollbar`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Update thanh scroll toàn app thành thin, và phải có đổi màu tương phản so với theme"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Thanh cuộn mảnh, thống nhất toàn app (Priority: P1)

Developer cuộn bất kỳ vùng nào có nội dung dài (sidebar danh sách project/session, khung chat, khối code, diff, hộp thoại Settings, command palette, ô nhập nhiều dòng) và thấy cùng một kiểu thanh cuộn mảnh, gọn, không chiếm nhiều chỗ như thanh cuộn mặc định của hệ điều hành.

**Why this priority**: đây là thay đổi chính người dùng yêu cầu; thanh cuộn dày, không đồng bộ làm app trông rời rạc và tốn diện tích ở các panel hẹp.

**Independent Test**: mở app, cuộn sidebar, khung chat và một khối code dài → cả ba vùng có thanh cuộn cùng độ dày mảnh và cùng kiểu dáng.

**Acceptance Scenarios**:

1. **Given** một vùng có nội dung tràn theo chiều dọc, **When** người dùng nhìn hoặc cuộn vùng đó, **Then** thanh cuộn dọc mảnh (khoảng 6–8 px), không có nút mũi tên hai đầu.
2. **Given** một vùng có nội dung tràn theo chiều ngang (khối code dài, diff), **When** người dùng cuộn ngang, **Then** thanh cuộn ngang cũng mảnh như thanh dọc.
3. **Given** bất kỳ màn hình nào trong app, **When** so sánh thanh cuộn giữa các vùng, **Then** tất cả cùng độ dày, độ bo góc và cách hiển thị.
4. **Given** vùng nào trước đây cố ý ẩn thanh cuộn (dải tab session), **When** cập nhật xong, **Then** vùng đó vẫn ẩn thanh cuộn như cũ.

---

### User Story 2 - Màu thanh cuộn tương phản với theme (Priority: P1)

Developer dùng chế độ sáng hoặc tối; thanh cuộn luôn nhìn rõ trên nền hiện tại — tối hơn nền ở chế độ sáng, sáng hơn nền ở chế độ tối — và đổi màu ngay khi đổi theme.

**Why this priority**: người dùng yêu cầu rõ thanh cuộn phải đổi màu tương phản theo theme; thanh cuộn mảnh mà mờ quá thì khó thấy vị trí cuộn.

**Independent Test**: ở chế độ Light, cuộn khung chat → thanh cuộn xám đậm hơn nền; đổi sang Dark (Settings hoặc ⌘⇧L) → thanh cuộn chuyển sang xám sáng trên nền tối, không cần tải lại app.

**Acceptance Scenarios**:

1. **Given** chế độ Light, **When** nhìn thanh cuộn, **Then** phần kéo (thumb) có màu tối hơn nền và phân biệt được rõ.
2. **Given** chế độ Dark, **When** nhìn thanh cuộn, **Then** thumb có màu sáng hơn nền và phân biệt được rõ.
3. **Given** app đang mở, **When** đổi theme (Light ↔ Dark, hoặc System khi hệ điều hành đổi), **Then** màu thanh cuộn đổi theo ngay, không cần tải lại.
4. **Given** con trỏ đang rê lên hoặc đang kéo thumb, **When** người dùng tương tác, **Then** thumb đậm/nổi hơn trạng thái thường để báo đang tương tác.
5. **Given** vùng có nền luôn tối bất kể theme (terminal Log), **When** nhìn thanh cuộn ở vùng đó, **Then** thanh cuộn vẫn tương phản với nền tối của vùng đó, kể cả khi app đang ở chế độ Light.

### Edge Cases

- Nội dung không tràn: không hiện thanh cuộn (không chừa rãnh trống).
- Vùng lồng nhau (khối code trong khung chat): mỗi vùng có thanh cuộn riêng cùng kiểu, không chồng lên nhau gây khó bấm.
- Hệ điều hành đặt "luôn hiện thanh cuộn" hoặc "chỉ hiện khi cuộn": kiểu mảnh và màu vẫn áp dụng; app không ép buộc ngược thiết lập ẩn/hiện của hệ điều hành nếu môi trường không cho phép.
- Panel thu nhỏ hoặc chế độ compact/zoom: thanh cuộn vẫn mảnh, không phình theo zoom nội dung bất thường.
- Góc giao giữa thanh dọc và ngang: không hiện ô vuông màu lạc với nền.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Mọi vùng cuộn được trong app MUST dùng thanh cuộn mảnh (độ dày khoảng 6–8 px) cho cả chiều dọc và chiều ngang.
- **FR-002**: Thanh cuộn MUST không có nút mũi tên hai đầu; rãnh (track) trong suốt hoặc trùng màu nền vùng chứa.
- **FR-003**: Thumb MUST có màu tương phản với nền theo theme: tối hơn nền ở Light, sáng hơn nền ở Dark.
- **FR-004**: Màu thanh cuộn MUST đổi ngay khi theme đổi (gồm cả theme System theo hệ điều hành), không cần tải lại app.
- **FR-005**: Thumb MUST đổi sang màu đậm/nổi hơn khi rê chuột lên hoặc đang kéo.
- **FR-006**: Vùng có nền cố định khác theme (terminal Log) MUST có thanh cuộn tương phản với nền của chính vùng đó.
- **FR-007**: Kiểu thanh cuộn MUST đồng nhất giữa mọi vùng (cùng độ dày, bo góc, màu theo cùng quy tắc), áp dụng mặc định cho cả vùng cuộn mới thêm sau này mà không cần cấu hình riêng.
- **FR-008**: Vùng đang cố ý ẩn thanh cuộn MUST giữ nguyên hành vi ẩn.
- **FR-009**: Góc giao giữa thanh dọc và ngang MUST trùng màu nền, không hiện khối màu lạc.

### Key Entities

- **Màu thanh cuộn theo theme**: cặp màu thumb (thường / khi tương tác) gắn với từng theme Light và Dark, đặt cạnh các màu theme khác để đổi cùng lúc.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% vùng cuộn trong các màn hình chính (sidebar, khung chat, khối code, diff, Settings, command palette, terminal Log) dùng cùng kiểu thanh cuộn mảnh khi kiểm tra bằng mắt.
- **SC-002**: Độ dày thanh cuộn không quá 8 px ở mức zoom mặc định, giảm ít nhất một nửa so với thanh cuộn mặc định trước đó.
- **SC-003**: Thumb đạt độ tương phản tối thiểu 3:1 so với nền liền kề ở cả Light và Dark (mức tối thiểu cho thành phần giao diện không phải chữ).
- **SC-004**: Đổi theme thấy thanh cuộn đổi màu trong dưới 200 ms, không tải lại app.
- **SC-005**: Không vùng nào trước đây ẩn thanh cuộn bị hiện lại sau thay đổi.

## Assumptions

- "Toàn app" nghĩa là mọi vùng cuộn trong cửa sổ Herdsman, gồm cả terminal Log; không áp dụng cho cửa sổ ngoài app.
- Độ dày mặc định chọn ~6–8 px vì là mức "thin" phổ biến, vẫn đủ để kéo bằng chuột.
- Màu thumb lấy theo hệ màu xám trung tính đang dùng của app (không thêm màu nhấn mới), chỉ cần đạt tương phản với nền.
- Không thêm cài đặt cho người dùng tự chỉnh độ dày/màu thanh cuộn ở phạm vi này.
- Không ảnh hưởng tới agent hay session: đây là thay đổi hiển thị thuần, agent vẫn chạy bình thường nếu app tắt giữa chừng.
