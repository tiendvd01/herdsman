# Feature Specification: Duyệt file project

**Feature Branch**: `master`

**Created**: 2026-11-23

**Status**: Draft

**Input**: Hiện cây file project ở panel phải, xem và sửa nội dung mỗi file trong một tab, chuyển đến tab đang mở khi chọn lại file và đổi tên module Files hiện tại thành Git.

## Clarifications

### Session 2026-11-23

- Q: Có thể sửa nội dung file ngay trong tab đang mở không? → A: Có, người dùng có thể sửa và lưu file văn bản ngay trong tab file.
- Quyết định cho bước lập plan — dùng **CodeMirror 6** để xem và sửa file. Có thể dùng thư viện cây file bên ngoài nếu hỗ trợ tải thư mục khi mở, điều hướng bằng bàn phím và tùy chỉnh theo theme Herdsman.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Duyệt, xem và sửa file (Priority: P1)

Developer duyệt các thư mục của project ở panel phải rồi xem, sửa và lưu nội dung file ngay trong vùng tab chính.

**Why this priority**: Developer có thể cập nhật file liên quan trong khi làm việc với session hiện tại.

**Independent Test**: Mở file văn bản từ thư mục lồng nhau, sửa một dòng, lưu, đóng tab rồi mở lại file để kiểm tra nội dung.

**Acceptance Scenarios**:

1. **Given** project có thư mục lồng nhau, **When** người dùng chọn Files ở panel phải và mở hoặc thu gọn thư mục, **Then** cây hiển thị hoặc ẩn các mục con tương ứng.
2. **Given** file văn bản chưa có tab, **When** người dùng chọn file, **Then** vùng tab chính thêm một tab mang tên file, chuyển sang tab đó và hiển thị đúng nội dung, cho phép sửa nếu file có quyền ghi.
3. **Given** hai project có file cùng đường dẫn tương đối, **When** người dùng chọn một project ở sidebar, **Then** cây và nội dung file lấy từ thư mục gốc của project đó, kể cả khi chưa mở workspace. Chuyển giữa các workspace của cùng project vẫn dùng cùng cây và tab file.
4. **Given** tab file có thể sửa, **When** người dùng sửa nội dung, **Then** tab báo có thay đổi chưa lưu. Khi người dùng chọn **Save** và thao tác thành công, trạng thái này biến mất và lần mở lại hiển thị nội dung vừa lưu.
5. **Given** tab có thay đổi chưa lưu, **When** người dùng đóng tab hoặc thoát app theo cách thông thường, **Then** app cho chọn **Save**, Bỏ thay đổi hoặc Hủy. Chọn **Save** chỉ tiếp tục đóng sau khi lưu thành công. Chọn **Cancel** giữ tab và nội dung đang sửa.
6. **Given** người dùng đang sửa và một agent hoặc ứng dụng khác đã lưu thay đổi vào cùng file, **When** người dùng chọn **Save**, **Then** app báo xung đột, giữ nội dung đang sửa trong tab và giữ bản mới nhất trên đĩa.
7. **Given** cây có thư mục lồng nhau và tên file dài, **When** người dùng duyệt bằng chuột hoặc bàn phím, **Then** biểu tượng và thụt lề giúp phân biệt file, thư mục và cấp lồng nhau. Mục có focus và file đang mở có chỉ báo rõ ràng. Khi tên bị cắt, người dùng có thể xem tên đầy đủ.

---

### User Story 2 - Quay lại tab file đang mở (Priority: P1)

Developer chọn lại một file trong cây để quay ngay về tab của file đó.

**Why this priority**: Việc mở lại cùng một file giữ số tab ổn định và giúp developer tiếp tục đọc ở đúng tab.

**Independent Test**: Mở một file, chuyển sang tab khác rồi chọn lại file nhiều lần từ cây.

**Acceptance Scenarios**:

1. **Given** file đã có tab và tab khác đang hiển thị, **When** người dùng chọn lại file, **Then** app kích hoạt tab file hiện có và số tab giữ nguyên.
2. **Given** hai file trùng tên ở hai thư mục khác nhau, **When** người dùng mở cả hai, **Then** mỗi file có tab riêng với đúng nội dung và người dùng nhìn được đường dẫn để phân biệt.
3. **Given** người dùng đã đóng tab file, **When** chọn lại file, **Then** app tạo đúng một tab mới và hiển thị nội dung file.
4. **Given** tab file có thay đổi chưa lưu, **When** người dùng chuyển sang tab khác rồi chọn lại file từ cây, **Then** tab hiện có hiển thị nội dung đang sửa và trạng thái chưa lưu.

---

### User Story 3 - Xem thay đổi trong Git (Priority: P2)

Developer vào Git ở panel phải để xem thay đổi chưa commit của workspace.

**Why this priority**: Tên Git giúp developer tìm đúng nơi xem thay đổi, còn mục Files ở panel phải dùng để duyệt thư mục.

**Independent Test**: Chọn workspace có file đã sửa, mở Git ở panel phải rồi xem diff của file.

**Acceptance Scenarios**:

1. **Given** workspace có thay đổi chưa commit, **When** người dùng chọn Git tại vị trí của mục Files cũ ở panel phải, **Then** mục điều hướng và tiêu đề đều hiển thị Git, đồng thời người dùng vẫn xem được danh sách thay đổi và diff.

### Edge Cases

- Khi chưa chọn project, Files hiển thị lời nhắc chọn project. Khi thư mục project trống, Files hiển thị trạng thái trống.
- Nếu file đã bị xóa, không thể đọc hoặc có định dạng chưa hỗ trợ, app hiển thị lý do ngay tại nơi người dùng mở file và vẫn cho phép duyệt các mục khác.
- Chọn nhanh cùng một file nhiều lần trong lúc nội dung đang tải vẫn chỉ tạo một tab.
- Cùng đường dẫn tương đối trong hai project có thể trỏ đến hai file khác nhau. Mỗi file phải mở đúng nội dung và đúng tab.
- File đọc được nhưng thiếu quyền ghi vẫn xem được và có chỉ báo chỉ đọc. Nếu quyền ghi mất sau khi bắt đầu sửa hoặc file bị xóa trước khi lưu, app báo lỗi và giữ nội dung chưa lưu trong tab.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** App MUST có mục Files ở panel phải, hiển thị cây file và thư mục từ thư mục gốc của project đang chọn, với thao tác mở và thu gọn thư mục. Files MUST hiển thị trạng thái phù hợp khi chưa chọn project hoặc thư mục trống.
- **FR-002** Khi người dùng chọn một file chưa mở, app MUST thêm và kích hoạt một tab ở vùng tab chính. Tab MUST hiển thị tên và nội dung file văn bản, kèm chỉ báo chỉ đọc nếu file đọc được nhưng thiếu quyền ghi.
- **FR-003** Khi người dùng chọn file đã có tab, kể cả trong lúc đang tải, app MUST kích hoạt đúng tab hiện có. Mỗi file trong một project MUST có tối đa một tab đang mở.
- **FR-004** App MUST phân biệt file theo project và đường dẫn tương đối từ thư mục project. Người dùng MUST xem được đường dẫn để phân biệt các tab trùng tên và có thể đóng rồi mở lại từng tab file.
- **FR-005** App MUST báo lỗi hoặc trạng thái định dạng chưa hỗ trợ khi không thể xem nội dung. Cây file và các tab khác MUST tiếp tục sử dụng được.
- **FR-006** Mục Files hiện tại ở panel phải MUST hiển thị tên Git trên mục điều hướng và tiêu đề. Git MUST tiếp tục hiển thị thay đổi chưa commit và diff của workspace.
- **FR-007** Tab MUST cho phép sửa file văn bản có quyền ghi và báo trạng thái chưa lưu. App MUST giữ nội dung đang sửa khi chuyển tab hoặc chọn lại file. Thao tác **Save** MUST ghi nội dung vào đúng file trong phạm vi thư mục project gắn với tab và chỉ xóa chỉ báo chưa lưu sau khi ghi thành công.
- **FR-008** Khi đóng tab hoặc thoát app theo cách thông thường, app MUST cho người dùng quyết định **Save**, **Discard** hoặc **Cancel** đối với mỗi file còn thay đổi chưa lưu. App MUST giữ tab nếu người dùng hủy hoặc lưu thất bại.
- **FR-009** App MUST giữ nội dung đang sửa và báo lý do khi lưu thất bại. Nếu file đã thay đổi trên đĩa kể từ lần đọc hoặc lưu thành công gần nhất, app MUST báo xung đột và giữ nguyên nội dung trên đĩa.
- **FR-010** Cây file MUST dùng biểu tượng phân biệt thư mục và các loại file phổ biến, thụt lề theo cấp và có chỉ báo mở hoặc thu gọn thư mục. Cây MUST theo theme hiện tại của app, phân biệt trạng thái focus với file đang mở, cho xem tên đầy đủ khi bị cắt và hỗ trợ điều hướng, mở thư mục và mở file bằng bàn phím.

### Key Entities *(include if feature involves data)*

- **Mục cây file** biểu thị một file hoặc thư mục trong thư mục project, có tên và đường dẫn tương đối.
- **Tab file** biểu thị một file đang được xem hoặc sửa, gắn với project và đường dẫn của file, có tên, nội dung hiện tại và trạng thái lưu.
- **Thư mục project** là thư mục gốc đã đăng ký cho project. Các workspace của cùng project chia sẻ cây và tab file.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** Trong ca thử với file văn bản nằm sâu ba cấp, người dùng xem được đúng nội dung ở lần chọn file đầu tiên sau khi mở các thư mục cha.
- **SC-002** Trong 10 lần chọn lại file từ cây, gồm cả chọn liên tiếp khi đang tải và chọn sau khi chuyển sang tab khác, app luôn hiển thị đúng tab và chỉ có một tab cho file đó.
- **SC-003** Qua các ca thử hai file trùng tên trong cùng project và hai file có cùng đường dẫn tương đối ở hai project, người dùng mở được đúng hai tab với nội dung tương ứng trong mỗi ca.
- **SC-004** Với một workspace có một thay đổi chưa commit, người dùng mở được Git ở panel phải và xem được diff của thay đổi đó trong hai thao tác.
- **SC-005** Với hai file có cùng đường dẫn tương đối trong hai project, sau khi sửa và lưu một file rồi mở lại cả hai, chỉ file đã chọn hiển thị nội dung vừa lưu.
- **SC-006** Trong các ca thử đóng tab, thoát app, lỗi ghi và xung đột với bản trên đĩa, nội dung đang sửa vẫn còn cho đến khi lưu thành công hoặc người dùng chủ động chọn bỏ thay đổi.
- **SC-007** Ở cả theme sáng và tối, người dùng có thể dùng bàn phím để mở file sâu ba cấp và nhận ra file đang mở trong cây khi chuyển qua lại giữa hai tab file.

## Assumptions

- Phạm vi gồm xem và sửa file văn bản hiện có. Lưu là thao tác do người dùng chủ động thực hiện. Tạo, đổi tên, xóa file và trình xem định dạng nhị phân nằm ngoài phạm vi.
- Tab file dùng chung vùng tab chính với tab session. Khôi phục tab file sau khi thoát app nằm ngoài phạm vi.
- Đóng tab file hoặc thoát app không tác động tới tiến trình agent đang chạy.
