# Feature Specification: Thống nhất bộ khoảng cách (spacing) trong app

**Feature Branch**: `009-unified-spacing-scale`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "[Ảnh chụp sidebar] Thống nhất bộ space dùng trong app để tránh tình trạng các nút bị lệch, khoảng cách không đều"

## Bối cảnh

Ảnh người dùng gửi chụp sidebar: nút "+" ở dòng tiêu đề "Projects" lệch sang phải vài pixel so với nút "+" của từng project bên dưới, nên cột nút nhìn không thẳng hàng. Lý do: mỗi khu vực tự chọn khoảng đệm riêng; dòng tiêu đề và danh sách project bên dưới dùng lề phải khác nhau.

Đây không phải lỗi riêng một chỗ. Giao diện hiện dùng khoảng 16 giá trị khoảng cách khác nhau (kể cả vài giá trị lẻ đặt tay như 3px, 15px), nên các phần tử cùng vai trò ở các khu vực khác nhau có lề và khoảng hở khác nhau. Spec này đặt ra một bộ khoảng cách chung và quy tắc căn hàng để mọi màn hình dùng chung, sửa các chỗ đang lệch và giữ chúng không lệch lại.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Các nút cùng cột thẳng hàng trong sidebar (Priority: P1)

Developer nhìn sidebar: nút "+" của dòng "Projects", nút "+" và nút "…" của mỗi project, số session và nút menu của mỗi workspace đều nằm trên cùng một mép phải. Biểu tượng mũi tên, icon workspace và chữ cũng thẳng theo cột ở mép trái.

**Why this priority**: Đây đúng là lỗi người dùng chụp lại; sidebar là chỗ nhìn thấy nhiều nhất và lệch ở đây dễ thấy nhất.

**Independent Test**: Mở sidebar có ít nhất hai project, mỗi project có workspace; đo vị trí mép phải của mọi nút hành động trong cột phải → tất cả trùng nhau. Đo mép trái của mũi tên project và chữ "Projects" → trùng theo quy tắc căn trái.

**Acceptance Scenarios**:

1. **Given** sidebar có dòng "Projects" và các project, **When** developer nhìn cột nút "+" bên phải, **Then** mọi nút "+" có cùng mép phải và cùng kích thước, không lệch dù chỉ 1px.
2. **Given** một project đang mở và có workspace, **When** developer rê chuột vào workspace để hiện nút menu, **Then** nút menu của workspace thẳng cột với nút "+" của project phía trên.
3. **Given** project bị thu gọn, mở rộng, rỗng ("No workspaces yet") hoặc có cảnh báo thư mục mất, **When** developer nhìn sidebar, **Then** căn hàng ở trên vẫn đúng.
4. **Given** developer kéo rộng / thu hẹp sidebar, **When** sidebar đổi chiều rộng, **Then** các nút vẫn thẳng cột ở mọi chiều rộng.

---

### User Story 2 - Một bộ khoảng cách chung cho toàn app (Priority: P1)

Developer đi qua các khu vực: sidebar trái, header, hội thoại, composer, side panel phải, hộp thoại, menu và command palette. Khoảng đệm trong ô, khoảng hở giữa các phần tử và lề các khối đều lấy từ cùng một bộ giá trị nhỏ, nên các thành phần cùng loại (hàng danh sách, nút icon, tiêu đề khu vực, hộp thoại) trông giống nhau ở mọi nơi.

**Why this priority**: Nếu chỉ sửa sidebar thì lỗi tương tự sẽ quay lại ở chỗ khác; người dùng yêu cầu "thống nhất bộ space dùng trong app", tức là toàn app.

**Independent Test**: Rà mọi màn hình; liệt kê các giá trị khoảng cách đang được dùng → tất cả đều thuộc bộ chung; các thành phần cùng loại ở hai khu vực khác nhau có cùng khoảng đệm.

**Acceptance Scenarios**:

1. **Given** bộ khoảng cách chung đã được định nghĩa, **When** rà toàn bộ giao diện, **Then** không còn khoảng cách nào ngoài bộ chung, trừ các ngoại lệ được ghi rõ lý do.
2. **Given** hai thành phần cùng vai trò ở hai khu vực (ví dụ tiêu đề khu vực "Projects" ở sidebar và tiêu đề "Agents" ở side panel), **When** so sánh, **Then** chúng có cùng khoảng đệm và cùng khoảng cách tới nội dung bên dưới.
3. **Given** header của sidebar, vùng giữa và side panel cùng nằm trên một hàng, **When** developer nhìn ngang, **Then** chiều cao header và đường viền dưới header thẳng hàng giữa ba vùng.
4. **Given** giao diện sau khi thống nhất, **When** so với trước, **Then** mật độ tổng thể (giao diện gọn ở spec 006) không thay đổi đáng kể; không vùng nào to ra hay chật đi rõ rệt.

---

### User Story 3 - Giữ thống nhất khi thêm giao diện mới (Priority: P2)

Khi có màn hình hoặc thành phần mới, người làm giao diện chỉ cần chọn từ bộ khoảng cách chung và các quy tắc căn hàng đã ghi; một bước kiểm tra tự động báo ngay nếu có giá trị nằm ngoài bộ.

**Why this priority**: Giúp lỗi không quay lại, nhưng giá trị trực tiếp cho người dùng nằm ở P1.

**Independent Test**: Thêm thử một giá trị khoảng cách ngoài bộ chung vào giao diện → bước kiểm tra báo lỗi và chỉ ra vị trí; bỏ giá trị đó → kiểm tra qua.

**Acceptance Scenarios**:

1. **Given** bộ khoảng cách và quy tắc căn hàng đã được ghi lại, **When** người làm giao diện cần biết dùng giá trị nào, **Then** có một chỗ duy nhất mô tả các bậc và vai trò của từng bậc.
2. **Given** có thay đổi giao diện dùng giá trị ngoài bộ chung mà không ghi ngoại lệ, **When** chạy bước kiểm tra chất lượng, **Then** bước kiểm tra thất bại và chỉ ra file, vị trí.

---

### Edge Cases

- Khi zoom giao diện hoặc zoom chữ (spec 006) thay đổi, các khoảng cách co giãn theo cùng tỉ lệ và căn hàng vẫn giữ đúng.
- Nút chỉ hiện khi rê chuột (nút "…" của project, menu của workspace) vẫn giữ chỗ hoặc được căn sao cho khi hiện ra không đẩy các nút khác lệch cột.
- Tên project / workspace rất dài bị cắt bớt mà không đẩy nút bên phải ra khỏi cột.
- Chừa chỗ cho nút đèn giao thông của macOS ở góc trên trái là ngoại lệ được phép, vì kích thước do hệ điều hành quyết định.
- Đường kẻ dọc nối workspace với project (thụt lề cây) phải nằm thẳng dưới tâm mũi tên project dù dùng giá trị trong bộ chung.
- Nội dung do agent sinh (markdown, code, bảng, diff) giữ đúng khoảng cách đọc của chúng; chỉ khung bao quanh theo bộ chung.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: App MUST có một bộ khoảng cách chung gồm số bậc nhỏ (tối đa 8 bậc), mọi bậc là bội số của một đơn vị cơ sở cố định, dùng cho khoảng đệm, khoảng hở giữa phần tử và lề khối.
- **FR-002**: Mọi khoảng đệm, khoảng hở và lề trong giao diện app MUST lấy từ bộ chung; giá trị ngoài bộ chỉ được dùng khi là ngoại lệ có ghi lý do (ví dụ chừa chỗ cho nút hệ điều hành, căn đường kẻ cây theo tâm icon).
- **FR-003**: Các nút hành động nằm ở mép phải của cùng một danh sách hoặc cột (sidebar trái, side panel phải, header) MUST có cùng mép phải và cùng kích thước.
- **FR-004**: Các phần tử dẫn đầu hàng (mũi tên, icon, chữ tiêu đề khu vực) trong cùng một danh sách MUST có cùng mép trái theo từng cấp thụt lề; mỗi cấp thụt lề MUST là một bậc trong bộ chung.
- **FR-005**: Thành phần cùng vai trò (tiêu đề khu vực, hàng danh sách, nút icon, header khu vực, hộp thoại, menu) MUST có cùng khoảng đệm và chiều cao ở mọi khu vực của app.
- **FR-006**: Header của sidebar trái, vùng giữa và side panel phải MUST có cùng chiều cao để đường viền dưới header thẳng hàng.
- **FR-007**: Nút chỉ hiện khi rê chuột hoặc khi focus MUST NOT làm xê dịch vị trí các nút khác trong cùng cột khi hiện / ẩn.
- **FR-008**: Bộ khoảng cách MUST co giãn cùng tỉ lệ với zoom giao diện của spec 006, để căn hàng không vỡ ở mọi mức zoom.
- **FR-009**: Bộ khoảng cách, vai trò của từng bậc và các quy tắc căn hàng MUST được ghi lại ở một chỗ duy nhất trong dự án.
- **FR-010**: Dự án MUST có bước kiểm tra tự động trong quy trình kiểm tra chất lượng, báo lỗi kèm vị trí khi giao diện dùng giá trị khoảng cách ngoài bộ chung mà không ghi ngoại lệ.
- **FR-011**: Việc thống nhất MUST NOT làm thay đổi hành vi hay chức năng nào; chỉ thay đổi khoảng cách và căn hàng.

### Key Entities

- **Bộ khoảng cách (spacing scale)**: danh sách có thứ tự các bậc khoảng cách, mỗi bậc có giá trị và vai trò gợi ý (ví dụ: khe giữa icon và chữ, đệm trong hàng, khoảng giữa các nhóm, lề khung).
- **Quy tắc căn hàng**: các ràng buộc như "nút hành động mép phải cùng cột", "thụt lề theo cấp", "header cùng chiều cao".
- **Ngoại lệ**: một vị trí dùng giá trị ngoài bộ chung, kèm lý do.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong sidebar ở mọi trạng thái (project mở / đóng / rỗng / thư mục mất, sidebar hẹp nhất / rộng nhất), độ lệch mép phải giữa các nút hành động cùng cột là 0px.
- **SC-002**: Số giá trị khoảng cách khác nhau đang dùng trong giao diện giảm từ khoảng 16 xuống không quá 8, và không còn giá trị lẻ đặt tay nào ngoài danh sách ngoại lệ.
- **SC-003**: 100% thành phần cùng vai trò ở các khu vực khác nhau có cùng khoảng đệm khi đo trên ảnh chụp màn hình.
- **SC-004**: Đường viền dưới header của ba vùng (sidebar trái, vùng giữa, side panel phải) lệch nhau 0px.
- **SC-005**: Ảnh chụp màn hình trước và sau ở cùng kích thước cửa sổ: số hàng workspace hiện được trong sidebar và số dòng hội thoại hiện được trong vùng giữa thay đổi không quá ±10%.
- **SC-006**: Thêm một giá trị khoảng cách ngoài bộ chung vào giao diện thì bước kiểm tra chất lượng thất bại 100% các lần.

## Assumptions

- Phạm vi là toàn bộ giao diện app (sidebar, header, hội thoại, composer, side panel, hộp thoại, menu, command palette, toast), không riêng sidebar trong ảnh.
- Đơn vị cơ sở là 4px với một nửa bậc 2px cho khe rất nhỏ; đây là quy ước phổ biến và khớp với phần lớn giá trị đang dùng, nên ít thay đổi mật độ nhất.
- Mật độ giao diện gọn đã chốt ở spec 006 được giữ nguyên; spec này chỉ làm khoảng cách đều và thẳng hàng, không làm giao diện to hay nhỏ đi.
- Cỡ chữ, cỡ icon và bo góc không thuộc phạm vi, trừ khi cần đổi để căn hàng đúng (ví dụ cho mọi nút icon cùng kích thước).
- Khoảng cách bên trong nội dung do agent sinh (markdown, code, bảng, Mermaid, chart, diff) không thuộc phạm vi; chỉ khung chứa chúng theo bộ chung.
- Kiểm tra bằng mắt theo cách hiện có: mở bản web có dữ liệu giả, chụp màn hình sáng và tối và so sánh.
