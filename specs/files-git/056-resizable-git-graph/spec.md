# Feature Specification: Git Graph có thể đổi chiều cao

**Feature Branch** — `master` (nhánh hiện tại)

**Created** — 2026-11-25

**Status** — Draft

**Input** — Thêm Git Graph ở nửa dưới tab Git và cho phép kéo thanh chia lên xuống để đổi chiều cao.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem lịch sử ngay trong tab Git (Priority: P1)

Khi đang xem các file thay đổi của workspace, người dùng có thể nhìn lịch sử commit của nhánh đang checkout và các đường tách, nhập nhánh trong cùng tab.

**Why this priority** — Người dùng có thể đối chiếu thay đổi đang làm với lịch sử đã commit mà không cần chuyển tab.

**Independent Test** — Mở tab Git trên workspace có một merge commit rồi chuyển sang workspace checkout nhánh có HEAD khác.

**Acceptance Scenarios**

1. **Given** workspace có lịch sử với một merge commit, **When** người dùng mở tab Git lần đầu, **Then** Changes nằm trên, Git Graph nằm dưới, hai vùng chia gần đều chiều cao, và đồ thị hiển thị commit cùng các đường nối đến commit cha.
2. **Given** hai workspace có HEAD khác nhau, **When** người dùng chuyển workspace, **Then** đồ thị hiển thị lịch sử từ HEAD của workspace mới và gỡ lịch sử cũ ngay khi chuyển.
3. **Given** Changes đang hiển thị diff có thể mở, **When** Git Graph đang hiển thị lịch sử hoặc thông báo trạng thái, **Then** người dùng vẫn có thể chuyển List/Tree và mở diff từ Changes.

### User Story 2 - Điều chỉnh không gian cho Changes và Git Graph (Priority: P1)

Người dùng kéo thanh chia lên để xem thêm commit, hoặc kéo xuống để xem thêm file thay đổi.

**Why this priority** — Số lượng file thay đổi và commit cần xem khác nhau theo từng lần review.

**Independent Test** — Kéo thanh chia theo hai hướng, thử kéo tới hai đầu, rồi cuộn từng vùng có nội dung dài.

**Acceptance Scenarios**

1. **Given** cả hai vùng đang mở, **When** người dùng kéo thanh chia lên rồi kéo xuống, **Then** Git Graph mở rộng rồi thu lại tương ứng và Changes đổi chiều cao theo hướng ngược lại.
2. **Given** người dùng kéo vượt giới hạn trên hoặc dưới, **When** thả thanh chia, **Then** cả hai tiêu đề vẫn nhìn thấy và cả hai vùng vẫn có thể sử dụng.
3. **Given** nội dung trong cả hai vùng vượt chiều cao hiển thị, **When** người dùng cuộn một vùng, **Then** vị trí cuộn của vùng còn lại giữ nguyên.

### Edge Cases

- Khi chưa chọn workspace, Git Graph hướng dẫn chọn workspace. Workspace không thuộc repository Git, repository chưa có commit và lỗi đọc lịch sử có thông báo tương ứng.
- Khi HEAD ở trạng thái detached, đồ thị vẫn bắt đầu từ commit đang checkout.
- Khi cửa sổ thu nhỏ, thanh chia được giữ trong giới hạn cho phép. Khi chiều cao quá thấp để hiển thị nội dung của cả hai vùng, tiêu đề hai vùng được ưu tiên và nội dung có thể xem lại khi tăng chiều cao.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — Tab Git MUST hiển thị Changes phía trên và Git Graph phía dưới, với chiều cao khả dụng chia gần đều ở lần mở đầu tiên.
- **FR-002** — Git Graph MUST hiển thị lịch sử đi từ HEAD của workspace đang chọn, gồm mã rút gọn, tiêu đề mỗi commit và đường nối thể hiện quan hệ với các commit cha trong lịch sử hiển thị, bao gồm merge commit.
- **FR-003** — Git Graph MUST gỡ dữ liệu của workspace trước ngay khi người dùng chuyển workspace. Khi đang tải, chưa chọn workspace, workspace không có Git, repository chưa có commit hoặc không đọc được lịch sử, vùng này MUST hiển thị trạng thái tương ứng bằng tiếng Anh.
- **FR-004** — Người dùng MUST có thể kéo thanh chia theo chiều dọc để thay đổi chiều cao hai vùng ngay trong lúc kéo. Trong cửa sổ đủ cao, giới hạn kéo MUST giữ tiêu đề và một phần nội dung của cả hai vùng hiển thị.
- **FR-005** — Changes và Git Graph MUST cuộn độc lập khi nội dung vượt quá chiều cao của vùng. Các thao tác List/Tree và mở diff hiện có MUST tiếp tục hoạt động, kể cả khi Git Graph gặp lỗi.

### Key Entities

- **Workspace** — Thư mục làm việc đang chọn, xác định repository Git và HEAD dùng để xem lịch sử.
- **Commit** — Mục trong lịch sử với mã định danh, tiêu đề và quan hệ với các commit cha.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Trên workspace thử nghiệm có một merge commit với hai cha, người dùng thấy Changes và Git Graph cùng lúc ngay khi mở tab Git và xác định được cả hai cha từ các đường nối trên đồ thị.
- **SC-002** — Người dùng tăng rồi giảm chiều cao Git Graph bằng đúng hai lần kéo, mỗi lần một hướng. Ở cả hai giới hạn kéo, hai tiêu đề vẫn nhìn thấy.
- **SC-003** — Trong mỗi lần thử chuyển giữa hai workspace có HEAD khác nhau, lịch sử của workspace trước biến mất ngay khi chuyển và lịch sử của workspace mới xuất hiện sau khi tải. Sau đó người dùng vẫn mở được diff từ Changes.

## Assumptions

- Lần đầu mở tab, hai vùng chia đều phần chiều cao dành cho nội dung Git khi kích thước cửa sổ cho phép.
- Git Graph là chế độ chỉ xem cho lịch sử có thể đi tới từ HEAD hiện tại, kể cả khi HEAD không gắn với nhánh. Phạm vi gồm xem và cuộn tối đa 200 commit gần nhất. Git Graph hiển thị thông báo khi còn commit cũ hơn.
- Vị trí thanh chia áp dụng cho phiên sử dụng hiện tại. Việc lưu vị trí qua lần khởi động lại nằm ngoài phạm vi.
