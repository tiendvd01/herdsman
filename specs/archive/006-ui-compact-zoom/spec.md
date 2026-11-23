# Feature Specification: Giao diện gọn hơn và zoom chữ / giao diện

**Feature Branch**: `006-ui-compact-zoom`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Giảm size cho giao diện trong app, và làm chức năng zoom font và giao diện trong app"

## Bối cảnh

Giao diện hiện tại dùng cỡ chữ, khoảng cách và chiều cao phần tử khá lớn (chữ thân 14px, hàng và nút rộng rãi), nên trên màn hình laptop chỉ thấy được ít message, ít workspace và ít dòng log cùng lúc. Developer theo dõi nhiều agent song song cần thấy nhiều thông tin hơn trên một màn hình. Đồng thời mỗi người có màn hình và thị lực khác nhau, nên cần tự chỉnh được độ to của chữ và của cả giao diện.

Spec này gồm hai phần: (1) làm giao diện mặc định gọn hơn, (2) cho developer zoom cả giao diện và zoom riêng cỡ chữ, app nhớ lựa chọn đó.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Giao diện mặc định gọn hơn (Priority: P1)

Developer mở app trên laptop 13–14 inch. Sidebar, danh sách workspace, hội thoại, composer và side panel đều nhỏ gọn hơn trước nên thấy được nhiều nội dung hơn mà vẫn đọc rõ, không phải chỉnh gì.

**Why this priority**: Đây là yêu cầu trực tiếp đầu tiên của người dùng và có lợi cho mọi người ngay khi mở app, không phụ thuộc phần zoom.

**Independent Test**: Mở cùng một workspace, cùng kích thước cửa sổ trước và sau thay đổi → số hàng workspace hiện trong sidebar và số dòng hội thoại hiện trong vùng giữa đều tăng rõ rệt; chữ vẫn đọc được, nút vẫn bấm trúng dễ dàng.

**Acceptance Scenarios**:

1. **Given** app ở cài đặt mặc định, **When** developer mở một workspace, **Then** chữ thân, tiêu đề, hàng danh sách, nút, ô nhập, tab và khoảng cách giữa các phần tử đều nhỏ hơn trước theo cùng một tỉ lệ nhất quán, không có chỗ nào còn "to" lệch so với phần còn lại.
2. **Given** giao diện gọn, **When** developer xem hội thoại có markdown, code, bảng, Mermaid, chart, tool card và diff, **Then** mọi loại nội dung đều theo cỡ mới, không bị cắt chữ, chồng chéo hay vỡ bố cục.
3. **Given** giao diện gọn, **When** developer dùng các hộp thoại (thêm project, tạo workspace, duyệt quyền, command palette), **Then** chúng cũng theo cỡ mới và vẫn hiện đủ nội dung.

---

### User Story 2 - Zoom cả giao diện bằng phím tắt (Priority: P1)

Developer ngồi xa màn hình ngoài hoặc muốn nhét thêm nội dung, nhấn ⌘+ / ⌘− để phóng to / thu nhỏ toàn bộ giao diện (chữ, icon, khoảng cách, sidebar) và ⌘0 để về mức mặc định.

**Why this priority**: Giao diện gọn hơn có thể quá nhỏ với một số người; zoom là cách khắc phục ngay, nên phải đi cùng P1.

**Independent Test**: Nhấn ⌘+ ba lần → mọi thứ to lên theo từng bậc và có thông báo ngắn hiện mức zoom; nhấn ⌘0 → về 100%.

**Acceptance Scenarios**:

1. **Given** zoom đang 100%, **When** developer nhấn ⌘+ (hoặc ⌘=), **Then** toàn bộ giao diện to lên một bậc và một chỉ báo ngắn hiện mức zoom mới (ví dụ "110%") rồi tự ẩn.
2. **Given** zoom bất kỳ, **When** developer nhấn ⌘−, **Then** giao diện nhỏ đi một bậc; khi đã ở mức nhỏ nhất/lớn nhất thì nhấn tiếp không đổi gì và chỉ báo vẫn cho biết đang ở giới hạn.
3. **Given** zoom khác 100%, **When** developer nhấn ⌘0, **Then** giao diện về 100%.
4. **Given** developer đang gõ trong composer, **When** nhấn phím tắt zoom, **Then** zoom thay đổi, nội dung đang gõ và vị trí con trỏ giữ nguyên, không có ký tự lạ nào được chèn.
5. **Given** zoom thay đổi, **When** giao diện vẽ lại, **Then** sidebar và side panel giữ tỉ lệ hợp lý, vùng hội thoại không bị ép hẹp quá mức và không có thanh cuộn ngang của cả cửa sổ.

---

### User Story 3 - Chỉnh riêng cỡ chữ nội dung (Priority: P2)

Developer thấy bố cục vừa ý nhưng muốn chữ trong hội thoại và Log to (hoặc nhỏ) hơn để đọc thoải mái, mà không làm sidebar, nút và icon to theo.

**Why this priority**: Người dùng yêu cầu riêng "zoom font"; hữu ích cho việc đọc output dài của agent, nhưng zoom toàn giao diện (P1) đã giải quyết phần lớn nhu cầu.

**Independent Test**: Tăng cỡ chữ nội dung hai bậc → chữ trong hội thoại, code block và Log to lên, còn sidebar trái, header và nút giữ nguyên kích thước.

**Acceptance Scenarios**:

1. **Given** cỡ chữ nội dung đang mặc định, **When** developer nhấn ⌥⌘= hoặc chọn "Tăng cỡ chữ" trong command palette, **Then** chữ trong hội thoại (văn bản, code, bảng, tool card, diff), composer và Log to lên một bậc; phần khung (sidebar, header, nút, tab) không đổi.
2. **Given** cỡ chữ đã chỉnh, **When** developer nhấn ⌥⌘− hoặc chọn "Giảm cỡ chữ", **Then** chữ nhỏ đi một bậc trong giới hạn cho phép.
3. **Given** cỡ chữ đã chỉnh, **When** developer nhấn ⌥⌘0 hoặc chọn "Đặt lại cỡ chữ" trong command palette, **Then** cỡ chữ về mặc định; mức zoom giao diện không bị ảnh hưởng.
4. **Given** zoom giao diện và cỡ chữ đều đã chỉnh, **When** xem hội thoại, **Then** hai hiệu ứng cộng dồn (chữ nội dung = cỡ chữ đã chọn × mức zoom) và kết quả vẫn trong giới hạn đọc được.

---

### User Story 4 - Nhớ lựa chọn và xem / chỉnh nhanh (Priority: P2)

Developer chỉnh zoom và cỡ chữ một lần, lần sau mở app vẫn giữ nguyên; developer cũng có thể xem mức hiện tại và chỉnh bằng chuột mà không cần nhớ phím tắt.

**Why this priority**: Không nhớ thì phải chỉnh lại mỗi lần mở app, làm giảm giá trị P1/P2; nhưng các phần trên vẫn dùng được khi chưa có.

**Independent Test**: Đặt zoom 120% và cỡ chữ +1, tắt rồi mở lại app → giao diện hiện đúng 120% và cỡ chữ +1. Mở command palette gõ "zoom" → thấy các lệnh phóng to / thu nhỏ / đặt lại kèm mức hiện tại.

**Acceptance Scenarios**:

1. **Given** developer đã chỉnh zoom và/hoặc cỡ chữ, **When** tắt và mở lại app, **Then** cả hai giữ đúng giá trị đã chọn ngay từ lúc giao diện hiện lên (không hiện cỡ mặc định rồi mới nhảy).
2. **Given** developer mở command palette, **When** gõ "zoom" hoặc "font"/"chữ", **Then** thấy các lệnh phóng to, thu nhỏ, đặt lại zoom, tăng/giảm/đặt lại cỡ chữ, kèm phím tắt và mức hiện tại.
3. **Given** developer dùng menu của app trên macOS, **When** mở menu View, **Then** có các mục Zoom In / Zoom Out / Actual Size với phím tắt tương ứng.

---

### Edge Cases

- Zoom lớn trên cửa sổ hẹp (ví dụ 150% trên cửa sổ 960px): vùng hội thoại vẫn giữ độ rộng tối thiểu theo quy tắc của tính năng kéo sidebar (004); sidebar tự co lại trong giới hạn thay vì làm tràn cửa sổ. Độ rộng sidebar đã lưu không bị ghi đè chỉ vì zoom.
- Giá trị zoom / cỡ chữ đã lưu không hợp lệ (ngoài giới hạn, dữ liệu hỏng): app dùng giá trị gần nhất trong giới hạn hoặc mặc định, không lỗi.
- Đổi zoom khi hội thoại đang stream: nội dung vẫn cập nhật; nếu đang ở cuối hội thoại thì vẫn bám cuối, nếu đang đọc giữa chừng thì message đang xem vẫn ở trong khung nhìn.
- Đổi zoom / cỡ chữ khi Log (terminal thật của agent) đang mở: terminal vẽ lại với số cột/dòng mới mà không làm mất nội dung hay làm gián đoạn agent; agent vẫn chạy bình thường.
- Mermaid / chart đã render trước khi đổi cỡ: hiện đúng theo cỡ mới (vẽ lại hoặc co giãn) mà không vỡ hình.
- Nhấn giữ phím tắt zoom liên tục: giao diện đổi từng bậc tới giới hạn rồi dừng, không giật hay treo.
- Phím tắt zoom trùng với phím đang dùng trong ô đang focus (ví dụ terminal Log): zoom vẫn áp dụng cho app, không gửi ký tự vào terminal.
- Màn hình có độ phân giải khác nhau (Retina / thường) hoặc kéo cửa sổ sang màn hình khác: mức zoom giữ nguyên theo lựa chọn của developer.

## Requirements *(mandatory)*

### Functional Requirements

**Giao diện gọn hơn**

- **FR-001**: Kích thước mặc định của giao diện MUST được giảm nhất quán trên toàn app: chữ thân trong hội thoại 13px (trước là 14px), chữ phụ/nhãn nhỏ giảm tương ứng, chiều cao hàng danh sách, nút, ô nhập, tab và khoảng cách đệm giảm khoảng 10–15% so với hiện tại.
- **FR-002**: Mọi khu vực MUST theo cùng thang kích thước mới: sidebar trái, header, vùng hội thoại (markdown, code, bảng, Mermaid, chart, KaTeX, tool card, diff), composer, side panel (Agents, Tasks, Files, Log), hộp thoại, menu, tooltip, command palette.
- **FR-003**: Sau khi thu gọn, chữ nhỏ nhất trong app MUST không dưới 11px ở mức zoom 100%, và mọi nút/vùng bấm MUST còn ít nhất 24×24px ở mức zoom 100%.
- **FR-004**: Độ rộng mặc định và giới hạn của hai sidebar (tính năng 004) MUST được xem lại cho khớp với cỡ mới, để sidebar không thừa khoảng trống so với nội dung đã nhỏ đi.

**Zoom toàn giao diện**

- **FR-005**: App MUST cho phép zoom toàn bộ giao diện theo các bậc cố định: 80%, 90%, 100%, 110%, 120%, 135%, 150%. Mặc định 100% (tương ứng giao diện gọn của FR-001).
- **FR-006**: Phím tắt: ⌘+ và ⌘= phóng to một bậc, ⌘− thu nhỏ một bậc, ⌘0 về 100%. Phím tắt MUST hoạt động bất kể đang focus ở đâu trong app (kể cả composer và terminal Log).
- **FR-007**: Mỗi lần đổi zoom, app MUST hiện chỉ báo ngắn mức zoom hiện tại (ví dụ "110%") rồi tự ẩn sau khoảng 1,5 giây, không chặn thao tác khác.
- **FR-008**: Zoom MUST áp dụng cho mọi thành phần nhìn thấy (chữ, icon, khoảng cách, viền, sidebar, hộp thoại, terminal Log) theo cùng một tỉ lệ.

**Cỡ chữ nội dung**

- **FR-009**: App MUST cho phép chỉnh riêng cỡ chữ nội dung theo các bậc cố định, từ −2 tới +4 so với mặc định (mỗi bậc 1px, tức 11px–17px cho chữ thân ở zoom 100%).
- **FR-010**: Cỡ chữ nội dung MUST áp dụng cho: văn bản và code trong hội thoại, bảng, tool card, diff, composer, Files và Log. MUST NOT áp dụng cho khung giao diện: sidebar trái, header, tab, nút, menu, command palette.
- **FR-011**: Phím tắt ⌥⌘= / ⌥⌘− tăng / giảm cỡ chữ một bậc, ⌥⌘0 đặt lại; các lệnh này cũng có trong command palette. (Không dùng ⌘⇧+ vì trên bàn phím US ⌘+ đã là ⌘⇧=, trùng với zoom giao diện.) Đổi cỡ chữ MUST NOT đổi mức zoom giao diện và ngược lại.

**Ghi nhớ và truy cập**

- **FR-012**: Mức zoom và cỡ chữ nội dung MUST được nhớ qua các lần mở app và áp dụng ngay từ khung hình đầu tiên.
- **FR-013**: Command palette MUST có các lệnh: Phóng to, Thu nhỏ, Đặt lại zoom, Tăng cỡ chữ, Giảm cỡ chữ, Đặt lại cỡ chữ; mỗi lệnh hiện phím tắt và mức hiện tại.
- **FR-014**: Trên macOS, menu View của app MUST có Zoom In / Zoom Out / Actual Size với phím tắt ở FR-006.
- **FR-015**: Đổi zoom hoặc cỡ chữ MUST NOT làm mất hay reset trạng thái khác: nội dung đang gõ, tab đang mở, vị trí cuộn hội thoại, project đang thu gọn, độ rộng sidebar đã lưu; và MUST NOT ảnh hưởng tới session agent đang chạy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ở cửa sổ 1440×900 và zoom 100%, số hàng workspace hiện trong sidebar và số dòng văn bản hội thoại hiện trong vùng giữa tăng ít nhất 15% so với trước thay đổi.
- **SC-002**: Developer đổi zoom hoặc cỡ chữ trong một thao tác (một phím tắt hoặc một lệnh), giao diện cập nhật ngay, không có độ trễ nhìn thấy được, kể cả khi hội thoại đang stream.
- **SC-003**: 100% lần mở lại app hiện đúng mức zoom và cỡ chữ đã chọn lần trước, không có khoảnh khắc nào hiện cỡ mặc định trước.
- **SC-004**: Ở mọi bậc zoom và mọi cỡ chữ cho phép, trên cửa sổ nhỏ nhất app cho phép, không có chữ bị cắt/chồng, không có thanh cuộn ngang của cả cửa sổ, và vùng hội thoại không hẹp hơn độ rộng tối thiểu.
- **SC-005**: Đổi zoom hoặc cỡ chữ khi agent đang chạy không làm gián đoạn, dừng hay mất output của bất kỳ session nào.

## Assumptions

- "Giảm size giao diện" nghĩa là đổi mức mặc định thành gọn hơn cho mọi người (không phải thêm một chế độ "compact" tuỳ chọn); ai thấy quá nhỏ thì dùng zoom (FR-005) để phóng to.
- "Zoom font và giao diện" được hiểu là hai điều khiển riêng: zoom giao diện (mọi thứ to/nhỏ cùng nhau, giống zoom của trình duyệt/VS Code) và cỡ chữ nội dung (chỉ chữ đọc, giống "editor font size"). Hai giá trị cộng dồn.
- Zoom và cỡ chữ là tuỳ chọn giao diện của máy này, lưu cùng chỗ với các tuỳ chọn giao diện khác (theme, độ rộng sidebar…); không khác nhau theo project/workspace/session và không đồng bộ giữa máy.
- Không làm màn hình Settings riêng ở tính năng này; truy cập qua phím tắt, command palette và menu macOS là đủ.
- Phím tắt dùng ⌘ trên macOS; khi hỗ trợ Linux sẽ dùng Ctrl tương ứng.
- Các con số (13px, 10–15%, các bậc zoom, giới hạn cỡ chữ) là mặc định hợp lý dựa trên bố cục hiện tại; có thể tinh chỉnh khi làm plan mà không đổi phạm vi.
- Tính năng chỉ đổi cách hiển thị trong app; không chạm tới agent, sidecar, event log hay `hc`, nên tắt app giữa chừng không ảnh hưởng gì tới agent.
