# Feature Specification: Phiên Codex CLI trong History

**Feature Branch** — `master` (nhánh hiện tại)

**Created** — 2026-11-27

**Status** — Draft

**Input** — “Cho tab history có thể thấy cả session từ codex cli nữa.”

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tìm phiên Codex CLI trong History (Priority: P1)

Developer tìm các phiên Codex CLI cùng với phiên Herdsman và Claude Code CLI trong tab History.

**Why this priority** — Developer có thể tìm phiên đã chạy trong terminal từ cùng một danh sách.

**Independent Test** — Chuẩn bị phiên Codex ở workspace hiện tại, một worktree khác và một thư mục chưa thêm vào Herdsman. Duyệt hai phạm vi rồi tìm bằng từ trong tên hoặc phần xem trước.

**Acceptance Scenarios**

1. **Given** ba phiên ở ba thư mục khác nhau, **When** duyệt **This workspace** và **All projects**, **Then** phạm vi hiện tại chỉ hiện phiên thuộc workspace đó và phạm vi toàn app hiện cả ba phiên, theo thời điểm hoạt động gần nhất.
2. **Given** một phiên Codex đã liên kết với Herdsman, **When** cả hai nguồn nhận diện phiên đó, **Then** History hiện một dòng và chọn dòng đó mở phiên Herdsman. Kết quả khớp tên hoặc phần xem trước của phiên CLI cũng dùng dòng này.
3. **Given** nguồn Codex không tải được, **When** mở History, **Then** người dùng thấy thông báo về nguồn Codex và vẫn duyệt được phiên từ các nguồn khả dụng.

### User Story 2 - Xem lại hội thoại Codex CLI (Priority: P2)

Developer chọn một phiên Codex CLI chưa liên kết để đọc các lời nhắn đã lưu. Đóng bản xem đưa họ về danh sách đang duyệt.

**Why this priority** — Đọc lại hội thoại giúp xác nhận phiên đã tìm là phiên cần dùng.

**Independent Test** — Mở một phiên từ thư mục ngoài Herdsman bằng bàn phím, kiểm tra lời nhắn theo thứ tự, rồi đóng bản xem bằng Escape.

**Acceptance Scenarios**

1. **Given** một phiên CLI chưa liên kết có lời nhắn đã lưu, **When** chọn phiên, **Then** người dùng thấy lời nhắn văn bản của mình và của Codex theo thứ tự trong bản xem chỉ đọc. Khi đóng bản xem, truy vấn và phạm vi vẫn được giữ.
2. **Given** phiên mất quyền truy cập hoặc biến mất sau khi liệt kê, **When** chọn phiên, **Then** bản xem báo lỗi bằng tiếng Anh và người dùng có thể quay lại danh sách.
3. **Given** một phiên CLI đang chạy ở terminal, **When** người dùng xem History hoặc đóng Herdsman, **Then** phiên CLI tiếp tục hoạt động và dữ liệu gốc được giữ nguyên.

### Edge Cases

- Phiên chưa đặt tên dùng phần xem trước làm tiêu đề nếu có, hoặc một nhãn thay thế. Các phiên cùng tiêu đề vẫn hiển thị riêng nếu khác định danh.
- Phiên có thư mục đã di chuyển hoặc bị xóa vẫn có thể xuất hiện ở **All projects** với đường dẫn đã lưu. Bản xem báo lỗi nếu Codex không còn đọc được hội thoại.
- Phiên có dữ liệu nhưng chưa có lời nhắn văn bản hiển thị trạng thái trống trong bản xem.
- Phiên đã liên kết với một workspace dùng vị trí đã lưu trong Herdsman, kể cả khi nhiều workspace dùng chung thư mục.
- Tài khoản có 0 phiên Codex vẫn dùng các trạng thái trống hiện có của History.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** — History MUST liệt kê phiên local chưa archive được Codex CLI cung cấp cho tài khoản hiện tại. **This workspace** dùng thư mục làm việc hoặc liên kết Herdsman hiện có. **All projects** bao gồm cả thư mục chưa thêm vào ứng dụng.
- **FR-002** — History MUST hiển thị nguồn Codex CLI, tiêu đề hoặc nhãn thay thế và lần hoạt động gần nhất nếu biết. Trong phạm vi toàn app, dòng Codex hiển thị thư mục làm việc hoặc vị trí Herdsman. Danh sách chung sắp xếp từ mới đến cũ.
- **FR-003** — History MUST gộp phiên trùng định danh Codex thành một dòng và ưu tiên mở phiên Herdsman đã liên kết, kể cả khi tên hoặc phần xem trước từ CLI là lý do khớp truy vấn.
- **FR-004** — Tìm kiếm MUST khớp tên hoặc phần xem trước của phiên Codex CLI trong phạm vi đã chọn và giữ hành vi tìm kiếm hiện có cho các nguồn khác.
- **FR-005** — Khi chọn phiên Codex CLI chưa liên kết, Herdsman MUST hiển thị lời nhắn văn bản đã lưu theo thứ tự trong bản xem chỉ đọc. Duyệt, tìm và mở bản xem MUST giữ nguyên dữ liệu nguồn và vòng đời của phiên CLI.
- **FR-006** — Lỗi tải Codex MUST giữ các nguồn khả dụng. Nếu phiên không còn mở được hoặc không có lời nhắn văn bản, Herdsman MUST hiển thị trạng thái tương ứng bằng tiếng Anh và cho phép đóng bản xem để tiếp tục duyệt.

### Key Entities *(include if feature involves data)*

- **Mục lịch sử Codex CLI** — Định danh phiên, thư mục làm việc, tên, phần xem trước, lần cập nhật và phiên Herdsman tương ứng nếu có.
- **Bản xem hội thoại** — Danh sách có thứ tự của lời nhắn văn bản do người dùng hoặc Codex gửi, gắn với một mục lịch sử.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — Với bốn phiên thử gồm một phiên đã liên kết, một phiên chưa liên kết trong workspace, một phiên ở worktree khác và một phiên ngoài Herdsman, **This workspace** hiện đúng hai phiên và **All projects** hiện đúng bốn phiên Codex, mỗi phiên xuất hiện một lần.
- **SC-002** — Trong năm lượt thử, ít nhất bốn lượt tìm được phiên theo tên hoặc phần xem trước và mở được bản xem trong 30 giây sau khi History tải xong.
- **SC-003** — Trong ba ca lỗi nguồn Codex, lỗi mở một phiên và phiên trống, các kết quả khả dụng vẫn dùng được và mỗi ca cho thấy trạng thái tương ứng.
- **SC-004** — Trong ca thử mở và đóng bản xem khi một phiên CLI đang hoạt động, người dùng đọc được lời nhắn đã lưu, phiên CLI tiếp tục chạy và không có lượt mới được gửi từ Herdsman.

## Assumptions

- Tính năng mở rộng [063 · Panel History cho phiên agent](../063-session-history-panel/spec.md). Phạm vi phiên CLI mới gồm lịch sử local chưa archive mà Codex cung cấp cho tài khoản hiện tại.
- Tìm phiên Codex CLI chưa liên kết dựa trên tên và phần xem trước. Bản xem tập trung vào lời nhắn văn bản đã lưu. Phiên đã liên kết tiếp tục dùng trải nghiệm và khả năng tìm kiếm của phiên Herdsman.
