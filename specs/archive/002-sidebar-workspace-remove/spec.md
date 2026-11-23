# Feature Specification: Xoá / archive workspace ngay từ sidebar

**Feature Branch**: `002-sidebar-workspace-remove`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Workspace chưa có nút remove ở sidebar"

**Liên quan**: [001 — FR-008a, FR-008b, FR-008c](../001-herdsman-use-cases/spec.md)

## Bối cảnh

Spec 001 đã yêu cầu developer archive và xoá được workspace (FR-008a–c), nhưng hiện thao tác này chỉ có trong menu "⋯" ở header của workspace **đang mở**. Ở sidebar, project có menu (đổi tên, xoá) còn workspace thì không có gì. Muốn dọn một workspace, developer phải mở nó trước (làm agent của nó nối lại, hiện hội thoại), rồi mới tìm được nút xoá ở chỗ khác. Spec này đưa các thao tác quản lý workspace ra ngay dòng workspace trong sidebar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xoá workspace từ sidebar (Priority: P1)

Developer xong việc với một workspace (ví dụ issue đã merge). Từ sidebar, developer rê chuột vào dòng workspace, mở menu của dòng đó, chọn xoá, xác nhận. Workspace biến khỏi sidebar mà không cần mở nó ra trước.

**Why this priority**: Đây đúng là chỗ thiếu người dùng báo. Không có nó, dọn dẹp workspace cũ tốn nhiều bước và phải mở workspace không còn cần.

**Independent Test**: Có ít nhất hai workspace trong một project, đang mở workspace A. Xoá workspace B từ sidebar → B biến mất khỏi sidebar, A vẫn đang mở, không có gì khác thay đổi.

**Acceptance Scenarios**:

1. **Given** sidebar có workspace B (không phải workspace đang mở), **When** developer rê chuột vào dòng B, **Then** dòng B hiện nút menu "⋯" giống cách dòng project hiện menu.
2. **Given** menu của B đang mở, **When** developer chọn "Delete workspace" rồi xác nhận, **Then** B biến khỏi sidebar, lịch sử session của B bị bỏ khỏi app, thư mục project không bị đụng tới, và workspace đang mở vẫn giữ nguyên.
3. **Given** hộp xác nhận xoá đang mở, **When** developer bấm Cancel hoặc Esc, **Then** không có gì bị xoá.
4. **Given** developer xoá chính workspace đang mở, **When** xoá xong, **Then** vùng giữa không còn hiện workspace đã xoá (về màn hình chọn workspace) và không có lỗi.

---

### User Story 2 - Archive workspace từ sidebar (Priority: P2)

Developer muốn cất workspace đi nhưng vẫn giữ lịch sử để tìm lại. Từ cùng menu ở sidebar, developer chọn archive.

**Why this priority**: Archive là cách kết thúc an toàn hơn xoá (spec 001 Q làm rõ), nên phải có ở cùng chỗ với xoá; nhưng người dùng báo thiếu "remove" trước tiên.

**Independent Test**: Archive một workspace từ sidebar → nó biến khỏi sidebar; tìm theo nội dung hội thoại với phạm vi mọi project vẫn thấy session của nó.

**Acceptance Scenarios**:

1. **Given** menu của một workspace trong sidebar, **When** developer chọn "Archive" và xác nhận, **Then** workspace ẩn khỏi sidebar và session của nó vẫn tìm thấy qua tìm kiếm (FR-028 của spec 001).
2. **Given** workspace có session đang chạy, **When** developer archive, **Then** hộp xác nhận nói rõ các session đang chạy sẽ dừng.

---

### User Story 3 - Đổi tên workspace từ sidebar (Priority: P3)

Cùng menu đó cho đổi tên workspace mà không phải mở nó.

**Why this priority**: Tiện, cho menu workspace đủ như menu project; không phải nhu cầu chính.

**Independent Test**: Đổi tên workspace B từ sidebar → tên mới hiện ở sidebar; nếu B đang mở thì breadcrumb ở header cũng đổi.

**Acceptance Scenarios**:

1. **Given** menu của workspace B, **When** developer chọn "Rename", nhập tên mới và lưu, **Then** sidebar hiện tên mới.

---

### Edge Cases

- Workspace dùng worktree còn file chưa commit: khi chọn xoá luôn worktree, hộp xác nhận liệt kê các file đó và chờ developer đồng ý (FR-008c của spec 001), giống hệt luồng từ header.
- Workspace có session đang chạy hoặc đang chờ duyệt quyền: xoá/archive phải dừng các session đó trước, không để tiến trình chạy tiếp mà app không quản lý.
- Worktree đã bị xoá bên ngoài app: không hiện lựa chọn "xoá luôn worktree".
- Thao tác thất bại (ví dụ git từ chối xoá worktree): hiện lỗi, workspace vẫn còn trong sidebar, không mất dữ liệu.
- Project của workspace đang ở trạng thái thư mục không còn tồn tại: vẫn xoá/archive được workspace.
- Workspace là workspace duy nhất của project: xoá xong project hiện "No workspaces yet".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Mỗi dòng workspace trong sidebar MUST có nút menu "⋯", hiện khi rê chuột vào dòng hoặc khi focus bằng bàn phím, và luôn hiện khi menu đang mở; cách hiện giống nút menu của dòng project.
- **FR-002**: Menu workspace ở sidebar MUST có các mục Rename, Archive và Delete workspace (Delete tách riêng, kiểu nguy hiểm).
- **FR-003**: Archive và Delete từ sidebar MUST đi qua đúng hộp xác nhận và quy tắc như khi làm từ header (FR-008a–c của spec 001): mô tả hậu quả, tuỳ chọn xoá luôn worktree với workspace dùng worktree, cảnh báo file chưa commit.
- **FR-004**: Thao tác trên một workspace từ sidebar MUST NOT làm đổi workspace hay session đang mở, trừ khi chính workspace đang mở bị xoá hoặc archive.
- **FR-005**: Khi workspace đang mở bị xoá hoặc archive, app MUST bỏ chọn nó và hiện màn hình chọn workspace của project đó.
- **FR-006**: Bấm nút menu MUST NOT đồng thời mở (chọn) workspace đó.
- **FR-007**: Sau khi xoá/archive/đổi tên, sidebar, header và kết quả tìm kiếm MUST cập nhật ngay, không cần tải lại app.
- **FR-008**: Xoá hoặc archive workspace MUST dừng mọi session đang chạy của workspace đó trước khi bỏ nó khỏi sidebar; agent con và transcript gốc của engine giữ nguyên như spec 001 quy định.
- **FR-009**: Nút menu MUST có nhãn cho trình đọc màn hình gồm tên workspace (ví dụ "Options for workspace Fix login OAuth").

### Key Entities

- **Workspace**: như spec 001. Spec này không thêm thuộc tính; chỉ thêm chỗ thao tác.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer xoá được một workspace không đang mở trong tối đa 3 thao tác (mở menu, chọn Delete, xác nhận) và không phải mở workspace đó.
- **SC-002**: 100% thao tác xoá/archive từ sidebar hiện hộp xác nhận trước khi có gì bị xoá; Cancel không thay đổi gì.
- **SC-003**: Xoá/archive một workspace không đang mở không làm đổi hội thoại đang hiện ở vùng giữa trong 100% trường hợp thử.
- **SC-004**: Sau khi xác nhận, workspace biến khỏi sidebar trong vòng 1 giây.

## Assumptions

- Dùng lại hộp xác nhận, hộp đổi tên và quy tắc dọn worktree đã có cho menu workspace ở header; menu ở header vẫn giữ.
- "Remove" người dùng nói nghĩa là xoá workspace khỏi app (FR-008b của spec 001); archive được thêm cạnh đó vì spec 001 coi archive là cách kết thúc workspace chính.
- Không thêm thao tác kéo-thả, chọn nhiều workspace hay xoá hàng loạt.
- Bỏ archive (unarchive) không nằm trong spec này; vẫn theo spec 001.
- Nhãn trên UI bằng tiếng Anh như phần còn lại của app.
