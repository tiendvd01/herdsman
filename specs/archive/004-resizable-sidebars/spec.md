# Feature Specification: Kéo đổi độ rộng hai sidebar

**Feature Branch**: `004-resizable-sidebars`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Làm chức năng resize 2 sidebar"

## Bối cảnh

Màn hình chính có ba cột: sidebar trái (project → workspace), vùng hội thoại ở giữa, và side panel bên phải (Agents, Tasks, Files, Log). Hiện sidebar trái có độ rộng cố định; side panel phải chỉ có hai mức (hẹp / rộng) đổi bằng một nút. Tên project/workspace dài bị cắt, còn khi đọc Log hay Files developer không chỉnh được đúng độ rộng mình cần. Spec này cho phép developer kéo mép của từng sidebar để đổi độ rộng, và app nhớ độ rộng đó.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Kéo đổi độ rộng sidebar trái (Priority: P1)

Developer có nhiều workspace tên dài bị cắt chữ. Developer rê chuột vào mép phải của sidebar trái, con trỏ đổi thành dạng kéo ngang, kéo sang phải tới khi đọc đủ tên. Vùng hội thoại co lại tương ứng.

**Why this priority**: Sidebar trái luôn hiện và là chỗ developer chuyển giữa các việc; tên bị cắt làm khó phân biệt workspace. Đây là giá trị độc lập nhỏ nhất của tính năng.

**Independent Test**: Mở app, kéo mép sidebar trái từ độ rộng mặc định sang phải ~100px → sidebar rộng thêm ~100px, tên dài hiện đầy đủ hơn, vùng hội thoại vẫn dùng được.

**Acceptance Scenarios**:

1. **Given** sidebar trái đang mở, **When** developer rê chuột vào mép phải của nó, **Then** con trỏ đổi sang dạng kéo ngang và mép được làm nổi nhẹ để báo có thể kéo.
2. **Given** developer đang kéo mép, **When** di chuột sang trái/phải, **Then** sidebar đổi độ rộng theo chuột ngay lập tức, không giật, và nội dung bên trong (tìm kiếm, danh sách project) giãn theo.
3. **Given** developer kéo quá giới hạn nhỏ nhất hoặc lớn nhất, **When** tiếp tục kéo, **Then** sidebar dừng ở giới hạn đó.
4. **Given** developer đang kéo, **When** chuột đi qua vùng hội thoại hoặc side panel, **Then** không có chữ nào bị bôi đen và không có nút nào bị kích hoạt ngoài ý muốn.

---

### User Story 2 - Kéo đổi độ rộng side panel phải (Priority: P1)

Developer xem Log hoặc diff trong Files và cần panel rộng hơn mức có sẵn (hoặc hẹp hơn để nhường chỗ cho hội thoại). Developer kéo mép trái của side panel phải tới độ rộng mong muốn.

**Why this priority**: Ngang hàng với sidebar trái — người dùng yêu cầu cả hai sidebar. Side panel chứa nội dung dài (log terminal, file) nên được lợi rõ nhất.

**Independent Test**: Mở side panel tab Log, kéo mép trái sang trái → panel rộng ra, dòng log dài hiện được nhiều chữ hơn; kéo sang phải → panel hẹp lại.

**Acceptance Scenarios**:

1. **Given** side panel phải đang mở, **When** developer kéo mép trái của nó, **Then** panel đổi độ rộng theo chuột trong giới hạn cho phép, giống hành vi của sidebar trái.
2. **Given** developer đã kéo panel tới một độ rộng bất kỳ, **When** bấm nút thu hẹp/mở rộng có sẵn ở header panel, **Then** panel nhảy về mức hẹp hoặc mức rộng có sẵn và nút hiện đúng trạng thái tương ứng.
3. **Given** developer đổi tab trong side panel (Agents → Files…), **When** tab mới hiện, **Then** độ rộng panel giữ nguyên.

---

### User Story 3 - Nhớ độ rộng và khôi phục mặc định (Priority: P2)

Developer chỉnh độ rộng một lần và muốn lần sau mở app vẫn vậy; khi chỉnh lệch quá thì muốn về lại mặc định nhanh.

**Why this priority**: Không nhớ thì phải kéo lại mỗi lần mở app, làm giảm giá trị của P1; nhưng P1 vẫn dùng được khi chưa có phần này.

**Independent Test**: Kéo cả hai sidebar, đóng rồi mở lại app → hai sidebar giữ đúng độ rộng đã kéo. Nhấp đúp vào mép một sidebar → sidebar đó về độ rộng mặc định.

**Acceptance Scenarios**:

1. **Given** developer đã kéo đổi độ rộng một hoặc cả hai sidebar, **When** tắt và mở lại app, **Then** mỗi sidebar hiện đúng độ rộng đã chỉnh lần trước.
2. **Given** developer thu gọn sidebar trái hoặc đóng side panel phải rồi mở lại, **When** sidebar hiện lại, **Then** nó giữ độ rộng trước khi thu gọn/đóng.
3. **Given** một sidebar đang ở độ rộng tuỳ chỉnh, **When** developer nhấp đúp vào mép kéo của nó, **Then** sidebar đó về độ rộng mặc định; sidebar còn lại không đổi.

---

### User Story 4 - Đổi độ rộng bằng bàn phím (Priority: P3)

Developer dùng bàn phím (hoặc công nghệ hỗ trợ) có thể focus vào mép kéo và đổi độ rộng bằng phím mũi tên.

**Why this priority**: Cần cho khả năng tiếp cận, nhưng phần lớn người dùng sẽ kéo chuột.

**Independent Test**: Tab tới mép kéo của sidebar trái, nhấn mũi tên phải vài lần → sidebar rộng ra từng bước; trình đọc màn hình đọc được tên và giá trị độ rộng hiện tại.

**Acceptance Scenarios**:

1. **Given** mép kéo đang được focus, **When** developer nhấn mũi tên trái/phải, **Then** sidebar thu hẹp/mở rộng theo từng bước cố định, trong giới hạn cho phép.
2. **Given** mép kéo đang được focus, **When** công nghệ hỗ trợ đọc phần tử, **Then** nó được báo là thanh chia có thể điều chỉnh, kèm tên (sidebar nào) và giá trị hiện tại.

---

### Edge Cases

- Cửa sổ app hẹp tới mức tổng độ rộng hai sidebar cộng vùng hội thoại tối thiểu không vừa: vùng hội thoại MUST giữ độ rộng tối thiểu; sidebar tự co lại (không nhỏ hơn giới hạn nhỏ nhất của nó) thay vì làm tràn cửa sổ. Độ rộng đã lưu không bị ghi đè chỉ vì cửa sổ tạm thời hẹp.
- Độ rộng lưu từ lần trước không còn hợp lệ (ngoài giới hạn, hoặc dữ liệu hỏng): app dùng giá trị gần nhất trong giới hạn hoặc mặc định, không lỗi.
- Thả chuột bên ngoài cửa sổ app khi đang kéo: thao tác kéo kết thúc ở vị trí cuối cùng, không bị "dính" ở trạng thái kéo.
- Mép kéo của sidebar trái nằm cạnh vùng kéo cửa sổ (thanh tiêu đề): kéo mép sidebar MUST NOT di chuyển cửa sổ, và kéo vùng tiêu đề vẫn di chuyển cửa sổ như cũ.
- Khi sidebar trái thu gọn hoặc side panel phải đóng: không có mép kéo nào hiện cho sidebar đó.
- Nội dung đang stream trong hội thoại khi developer kéo: hội thoại vẫn cập nhật, vị trí cuộn không nhảy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sidebar trái MUST có một mép kéo ở cạnh phải; side panel phải MUST có một mép kéo ở cạnh trái. Kéo mép đổi độ rộng sidebar tương ứng theo vị trí chuột.
- **FR-002**: Mép kéo MUST báo được là kéo được khi rê chuột (con trỏ kéo ngang và làm nổi nhẹ) mà không chiếm thêm chỗ đáng kể trong bố cục.
- **FR-003**: Mỗi sidebar MUST có độ rộng nhỏ nhất và lớn nhất; kéo vượt giới hạn thì dừng ở giới hạn. Mặc định: sidebar trái 256px (giới hạn 200–480px), side panel phải 340px (giới hạn 280–720px).
- **FR-004**: Vùng hội thoại ở giữa MUST luôn còn ít nhất 400px; khi cần, độ rộng thực tế của sidebar bị giới hạn để đảm bảo điều này.
- **FR-005**: Trong lúc kéo, app MUST NOT bôi đen chữ, MUST NOT kích hoạt nút/link mà chuột đi qua, và MUST NOT di chuyển cửa sổ.
- **FR-006**: Độ rộng của mỗi sidebar MUST được nhớ qua các lần mở app và qua thao tác thu gọn/mở lại sidebar.
- **FR-007**: Nhấp đúp vào mép kéo MUST đưa sidebar đó về độ rộng mặc định.
- **FR-008**: Nút thu hẹp/mở rộng hiện có ở header side panel phải MUST tiếp tục hoạt động: "mở rộng" đặt panel về mức rộng có sẵn (560px), "thu hẹp" đặt về mức mặc định (340px). Nút MUST hiện trạng thái "thu hẹp" khi panel đang rộng hơn mức mặc định, ngược lại hiện "mở rộng".
- **FR-009**: Mép kéo MUST focus được bằng bàn phím; phím mũi tên trái/phải đổi độ rộng theo bước cố định (ví dụ 16px), và MUST có tên cùng giá trị hiện tại cho công nghệ hỗ trợ.
- **FR-010**: Đổi độ rộng MUST NOT làm mất hay reset trạng thái khác của giao diện (tab đang mở của side panel, project đang thu gọn, vị trí cuộn hội thoại, nội dung đang gõ trong ô nhập).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer đổi được độ rộng mỗi sidebar trong một thao tác kéo, dưới 3 giây, không cần mở menu hay cài đặt.
- **SC-002**: Trong lúc kéo, độ rộng bám theo chuột không có độ trễ nhìn thấy được, kể cả khi hội thoại đang stream.
- **SC-003**: 100% lần mở lại app hiện đúng độ rộng đã chỉnh ở lần trước (với cửa sổ đủ rộng).
- **SC-004**: Ở mọi kích thước cửa sổ app cho phép, vùng hội thoại không bao giờ hẹp hơn 400px và không xuất hiện thanh cuộn ngang của cả cửa sổ.
- **SC-005**: Tên workspace dài tới 40 ký tự hiện đầy đủ không bị cắt khi sidebar trái được kéo tới giới hạn lớn nhất.

## Assumptions

- "2 sidebar" là sidebar trái (project/workspace) và side panel phải (Agents/Tasks/Files/Log). Vùng hội thoại ở giữa không có mép kéo riêng; nó chiếm phần còn lại.
- Độ rộng là tuỳ chọn giao diện của máy này, lưu cùng chỗ với các tuỳ chọn giao diện khác (theme, sidebar đang mở…); không đồng bộ giữa máy và không khác nhau theo project/workspace.
- Giữ nút thu hẹp/mở rộng của side panel phải như lối tắt tới hai mức có sẵn thay vì bỏ nó, để không làm mất thao tác người dùng đã quen.
- Các con số giới hạn (FR-003, FR-004) là mặc định hợp lý dựa trên bố cục hiện tại; có thể tinh chỉnh khi làm plan mà không đổi phạm vi.
- Không có thao tác "kéo để thu gọn" (kéo dưới mức nhỏ nhất thì tự ẩn sidebar); thu gọn/đóng vẫn dùng nút hiện có.
- Tính năng chỉ ảnh hưởng giao diện; không đụng tới agent, session hay event log, nên việc app tắt giữa chừng không ảnh hưởng agent (nguyên tắc I của constitution).
