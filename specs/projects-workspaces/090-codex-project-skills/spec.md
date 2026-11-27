# Feature Specification: Dùng skill trong project với Codex

**Feature Branch**: `master` (nhánh hiện tại)

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "Codex chưa đọc được các skill local ngay chính trong projects"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gọi skill đã có trong repo (Priority: P1)

Developer mở session Codex trong Herdsman và gọi skill có sẵn trong repo bằng tên. Developer có thể chọn skill từ gợi ý trong ô soạn tin hoặc gõ trực tiếp, kèm yêu cầu cần xử lý. Codex đọc hướng dẫn của skill và áp dụng vào lượt đó.

**Why this priority**: Developer cần dùng lại quy trình đã lưu trong repo ngay từ session Codex, không cần cài thêm hay chép nội dung skill vào prompt.

**Independent Test**: Dùng repo thử nghiệm có một skill quy định phản hồi bằng cụm từ kiểm thử riêng. Chọn skill trong ô soạn tin và gửi, sau đó gõ tên skill trực tiếp trong một lượt khác. Kiểm tra cả hai lượt thực hiện đúng hướng dẫn và nhận phần yêu cầu gửi kèm.

**Acceptance Scenarios**

1. **Given** workspace có skill local hợp lệ, **When** developer tìm theo tên trong ô soạn tin, **Then** gợi ý hiện đúng tên và mô tả. Chọn và gửi skill khiến Codex áp dụng hướng dẫn vào yêu cầu gửi kèm.
2. **Given** developer biết tên skill, **When** gửi lời gọi bằng tên trực tiếp trong session Codex, **Then** Codex dùng đúng skill như khi chọn từ gợi ý.
3. **Given** cùng một skill có thư mục thật trong `.claude/skills` và một liên kết tới thư mục đó trong `.agents/skills`, **When** developer tìm và gọi skill, **Then** gợi ý chỉ hiện một mục và Codex dùng được nội dung gốc. Ca nghiệm thu thực tế dùng `speckit-specify` của Herdsman.
4. **Given** skill yêu cầu một thao tác mà session phải xin quyền, **When** Codex làm theo skill, **Then** người dùng thấy yêu cầu duyệt và quyết định của họ được áp dụng. Việc tìm và gọi skill giữ nguyên định nghĩa gốc.

---

### User Story 2 - Dùng bộ skill của đúng workspace (Priority: P1)

Developer làm việc trong thư mục chính và nhiều worktree. Mỗi session Codex gọi phiên bản skill có trong thư mục làm việc của session, kể cả sau khi mở lại Herdsman hoặc tiếp tục session.

**Why this priority**: Cùng một skill có thể mang hướng dẫn khác nhau giữa các branch. Áp dụng nhầm phiên bản sẽ chạy sai quy trình của công việc đang mở.

**Independent Test**: Tạo thư mục chính và một worktree có cùng tên skill nhưng hướng dẫn tạo hai kết quả dễ phân biệt. Gọi skill trong từng session, chuyển tab, đóng rồi mở lại Herdsman và tiếp tục gọi skill.

**Acceptance Scenarios**

1. **Given** thư mục chính và worktree có cùng tên skill với nội dung khác nhau, **When** developer gọi skill trong từng session, **Then** nội dung được áp dụng khớp với thư mục làm việc của từng session.
2. **Given** skill chỉ tồn tại trong một project hoặc worktree khác, **When** developer chuyển sang session trong workspace thiếu skill đó, **Then** gợi ý của session hiện tại không chứa skill từ workspace kia.
3. **Given** một session Codex đang chạy hoặc đã lưu, **When** Herdsman kết nối lại hoặc developer tiếp tục session trong workspace đó, **Then** skill local khả dụng theo thư mục làm việc của session. Lượt đang chạy tiếp tục khi app đóng và lịch sử vẫn đầy đủ khi mở lại.

### Edge Cases

- Workspace không có skill local khả dụng vẫn gửi và nhận yêu cầu bình thường.
- Khi hai định nghĩa local khác nhau dùng cùng tên, bản trong `.agents/skills` được ưu tiên. Cả gợi ý lẫn lời gọi trực tiếp dùng cùng bản.
- Một skill lỗi định dạng, không đọc được hoặc có liên kết hỏng không chặn các skill hợp lệ. Nếu người dùng gọi một skill đã chọn nhưng nguồn vừa biến mất, thông báo bằng tiếng Anh nêu tên skill và lý do không thể dùng.
- Khi thêm, sửa hoặc xóa skill, session mở mới hoặc tiếp tục sau khi đã dừng phản ánh nội dung và danh sách hiện có của workspace.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Session Codex trong Herdsman MUST tìm và đọc skill hợp lệ có sẵn trong `.agents/skills` và `.claude/skills` của thư mục làm việc hiện tại, kể cả liên kết hợp lệ giữa hai thư mục này. Developer MUST dùng được các skill đó mà không cần cài lại, sao chép nội dung hay bật thủ công trong màn Skills.
- **FR-002**: Ô soạn tin của session Codex MUST gợi ý skill local theo tên, hiển thị mô tả và cho phép chọn. Chọn một gợi ý hoặc gửi lời gọi trực tiếp bằng tên MUST dẫn đến cùng một skill. Codex MUST nhận cả hướng dẫn skill và yêu cầu gửi kèm.
- **FR-003**: Herdsman MUST chỉ hiện một mục cho cùng một skill được tham chiếu qua hai thư mục. Nếu hai định nghĩa local khác nhau trùng tên, gợi ý và lời gọi trực tiếp MUST ưu tiên bản hợp lệ trong `.agents/skills`.
- **FR-004**: Khi tạo hoặc tiếp tục session Codex, danh sách gợi ý và nội dung skill được gọi MUST thuộc thư mục làm việc của session. Chuyển tab, mở lại Herdsman hoặc tiếp tục session MUST giữ đúng phạm vi này. Việc đóng ứng dụng MUST cho phép lượt đang chạy tiếp tục và việc mở lại MUST khôi phục lịch sử.
- **FR-005**: Skill không khả dụng MUST được loại khỏi gợi ý mà vẫn cho phép dùng các skill hợp lệ và gửi yêu cầu bình thường. Khi skill local đã chọn không còn đọc được tại lúc gửi, Herdsman MUST nêu tên skill và lý do bằng tiếng Anh.
- **FR-006**: Việc tìm và gọi skill MUST giữ nguyên định nghĩa skill của repo và áp dụng quyền hiện có của session cho các thao tác mà skill yêu cầu. Với thao tác cần duyệt, người dùng MUST nhận được yêu cầu duyệt như khi giao thao tác trực tiếp.

### Key Entities

- **Skill local** — Hướng dẫn do repo cung cấp, có tên, mô tả, nội dung và nguồn.
- **Workspace** — Xác định thư mục làm việc mà session Codex dùng để tìm skill local.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trong cả ba repo kiểm thử (chỉ có `.agents/skills`, chỉ có `.claude/skills`, có liên kết giữa hai thư mục), skill hợp lệ xuất hiện đúng một lần và Codex áp dụng đúng hướng dẫn khi chọn từ gợi ý hoặc gọi trực tiếp.
- **SC-002**: Trong ma trận gồm thư mục chính, hai worktree, một project khác và lượt thử sau khi mở lại hoặc tiếp tục session, 100% lời gọi thử dùng đúng phiên bản theo workspace và có 0 gợi ý lấy nhầm từ workspace khác.
- **SC-003**: Trong ca kiểm thử có một skill hợp lệ, một skill có liên kết hỏng và một workspace trống, cả ba lượt gửi yêu cầu thường đều hoạt động. Skill hợp lệ vẫn gọi được và trường hợp xóa skill sau khi chọn hiển thị lý do.
- **SC-004**: Ít nhất 4/5 developer trong bài thử lần đầu tìm, chọn và gửi đúng skill local trong vòng 30 giây sau khi session Codex sẵn sàng, không cần cài đặt thêm.

## Assumptions

- Phạm vi là skill đã có trong repo của session Codex chạy qua Herdsman. Quản lý thư viện skill dùng chung, cấp skill do Herdsman quản lý cho Codex và quản lý MCP thuộc các tính năng riêng.
- Cả hai thư mục skill local thuộc phạm vi hỗ trợ vì repo Herdsman đang dùng đồng thời hai đường dẫn này. Khi nội dung khác nhau nhưng tên trùng, ưu tiên nguồn `.agents/skills` trong workspace.
- Danh sách và nội dung phải cập nhật khi mở session mới hoặc tiếp tục session đã dừng. Cập nhật gợi ý ngay trong session đang chạy nằm ngoài yêu cầu ban đầu.
- Luồng session Codex của spec 048 và ô soạn tin hiện có là nền tảng cho tính năng này.
