<!--
Sync Impact Report
- Version change: 1.5.0 → 2.0.0 (MAJOR, bỏ yêu cầu bắt buộc dùng shadcn/ui)
- Modified core principles: không có
- Added sections: không có
- Removed sections: không có
- Modified sections: Ràng buộc kỹ thuật, Quy trình phát triển & cổng chất lượng
- Deferred TODOs: không có

Sync Impact Report
- Version change: 1.4.0 → 1.5.0 (MINOR, mở rộng chuẩn màu sắc cho toàn app)
- Modified principles: không có
- Added sections: không có
- Removed sections: không có
- Modified sections: Ràng buộc kỹ thuật, Quy trình phát triển & cổng chất lượng
- Deferred TODOs: không có

Sync Impact Report
- Version change: 1.3.0 → 1.4.0 (MINOR, mở rộng checkout worktree)
- Modified principles: VI cho phép checkout branch local có sẵn
- Related documents: BR-001 F11, technical D8, spec 028
- Templates: không cần sửa

Sync Impact Report
- Version change: 1.2.0 → 1.3.0 (MINOR, bổ sung chuẩn shadcn/ui cho toàn bộ giao diện)
- Modified principles: không có
- Added principles: không có
- Added sections: không có
- Removed sections: không có
- Modified sections: Ràng buộc kỹ thuật, Quy trình phát triển & cổng chất lượng
- Templates: không cần sửa (plan/spec/tasks templates đọc constitution lúc chạy)
- Deferred TODOs: không có
-->

# Herdsman Constitution

Herdsman là app desktop giúp developer **tối ưu hoá việc sử dụng AI agent**: chạy nhiều agent
(Claude, Codex) song song trên nhiều project, theo dõi và điều khiển chúng qua GUI, trong khi
agent vẫn tiếp tục chạy kể cả khi app đã tắt.

## Core Principles

### I. Agent sống độc lập với app (NON-NEGOTIABLE)

- Mọi tiến trình agent và background task MUST chạy trong terminal của `hc` (herdr-core),
  không bao giờ là tiến trình con của app.
- Tắt, crash, update hoặc khởi động lại app MUST NOT dừng, ngắt hay làm hỏng session đang chạy.
- App MUST tự kết nối lại khi mở và khôi phục đúng trạng thái mà không cần người dùng thao tác.
- Mọi tính năng mới MUST trả lời được câu hỏi: "chuyện gì xảy ra với agent nếu app tắt giữa
  chừng?" trước khi được duyệt plan.

**Lý do:** giá trị cốt lõi của sản phẩm là developer giao việc cho agent rồi rời đi; nếu agent
chết theo app thì Herdsman không hơn một terminal thông thường.

### II. Không mất dữ liệu hội thoại

- Mỗi session MUST có event log append-only với `seq` tăng dần, không reset kể cả khi resume.
- App MUST dựng lại hội thoại bằng cách phát lại event log từ `last_seen_seq`; state trong UI
  chỉ là cache, không phải nguồn sự thật.
- Transcript gốc của engine (`~/.claude`, `~/.codex`) MUST NOT bị app sửa hay xoá; đó là đường
  lui để resume khi sidecar chết.
- Thay đổi định dạng event log hoặc giao thức socket MUST tương thích ngược hoặc kèm migration.

**Lý do:** developer dựa vào lịch sử hội thoại để hiểu agent đã làm gì; mất một đoạn là mất
khả năng review và tiếp tục công việc.

### III. Developer luôn nắm quyền kiểm soát agent

- Mọi tool call cần quyền MUST đi qua `canUseTool` và hiện cho người dùng nội dung cụ thể sẽ
  thực thi (diff cho `Edit`/`Write`, lệnh đầy đủ cho `Bash`) trước khi Allow/Deny.
- App MUST NOT tự động cho phép thay người dùng, ngoài `permissionMode` mà người dùng đã chọn
  rõ ràng cho session đó.
- Yêu cầu quyền khi app tắt MUST chờ (trạng thái `blocked`) chứ không tự từ chối hay hết hạn.
- Người dùng MUST luôn có thể interrupt, xem Log (terminal thật của agent) và kill session.
- Trạng thái idle / working / blocked / done / error MUST được hiện đúng và kịp thời; agent cần
  người dùng thì MUST có badge và thông báo hệ điều hành.

**Lý do:** tối ưu việc dùng agent nghĩa là giao nhiều việc hơn mà vẫn an toàn; developer chỉ
dám để agent chạy lâu khi biết chắc không có thay đổi nào lọt qua mà mình không thấy.

### IV. Hiển thị giàu thông tin nhưng không chậm

- Hội thoại MUST render thành GUI: markdown (GFM), code highlight, Mermaid, khối ` ```chart `,
  KaTeX, bảng, tool card thu gọn được và diff.
- Nội dung đang stream MUST hiện theo thời gian thực; delta chỉ re-render message đang chạy.
- Hội thoại trên 5.000 message MUST cuộn mượt (virtual list); Mermaid/chart MUST render lười
  khi vào viewport; lỗi render MUST rơi về hiển thị source, không làm vỡ cả view.
- Nội dung từ agent MUST được coi là không tin cậy: không chèn HTML thô khi chưa sanitize.

**Lý do:** đọc hiểu output của agent nhanh là chỗ developer tiết kiệm thời gian nhiều nhất;
GUI đẹp mà giật lag thì phản tác dụng.

### V. Tương thích hệ sinh thái, không thay thế engine

- Herdsman MUST NOT tự viết engine agent hay gọi model API trực tiếp; engine là Claude Agent SDK
  và `codex app-server`, nối qua engine adapter.
- UI MUST chỉ phụ thuộc kiểu `AgentEvent` chuẩn hoá; thêm engine mới không được sửa component UI.
- Session MUST hiện trong `hc ls` / Herdr với đúng trạng thái, nhận việc được qua `hc send`, và
  session Claude MUST resume được bằng `claude --resume`.
- Phiên bản Agent SDK và giao thức `hc` MUST được cố định và có smoke test khi nâng cấp.

**Lý do:** developer đã có quy trình với Claude Code, Codex, Herdr; Herdsman phải nhân giá trị
của chúng lên chứ không bắt người dùng bỏ công cụ quen thuộc.

### VI. Tổ chức theo Project → Workspace → Session, giữ đơn giản

- Mô hình tổ chức MUST là ba tầng cố định: **Project** (một thư mục local) → **Workspace** (nhóm
  session cùng làm một việc, ví dụ một issue) → **Session** (một hội thoại với agent). Session
  MUST thuộc đúng một workspace; workspace MUST thuộc đúng một project.
- Workspace MUST có đúng một thư mục làm việc dùng chung cho mọi session của nó: thư mục project
  hoặc một worktree riêng (branch mới từ base branch hoặc branch local chưa được checkout).
  Worktree MUST gắn với workspace, không gắn
  với từng session.
- MUST NOT thêm khái niệm tổ chức nào khác (space, nhóm lồng nhau, tag thay cấp) khi chưa sửa
  constitution hoặc BR.
- Tính năng ngoài phạm vi v1 (Mods, remote machine, cloud sync, đa người dùng) MUST NOT được làm
  khi chưa sửa constitution hoặc BR.
- Mọi độ phức tạp thêm vào (store mới, tầng trừu tượng mới, dependency lớn) MUST được giải thích
  trong mục Complexity Tracking của plan.

**Lý do:** developer nghĩ theo repo và theo việc đang làm; workspace gom các session của cùng một
việc và cho phép chạy song song an toàn bằng worktree. Mỗi khái niệm thừa ngoài ba tầng này là
thêm một bước giữa developer và agent.

## Ràng buộc kỹ thuật

- **Phong cách giao diện**. Herdsman MAY dùng shadcn/ui hoặc chọn thành phần giao diện phù hợp
  với tính năng. Mọi thành phần MUST dùng token theme của app và tuân theo quy ước chung về bố
  cục, khoảng cách, typography, bo góc và trạng thái tương tác trong cả theme sáng lẫn tối.
- **Màu sắc có chủ đích**. Giao diện Herdsman MUST dùng màu để người dùng nhận ra hành động
  chính, mục đang chọn và trạng thái quan trọng ngay khi lướt qua. Chip, badge, biểu tượng và
  nền nhấn MUST dùng token màu theo vai trò của theme. Cùng một ý nghĩa MUST dùng cùng vai trò
  màu giữa các màn hình. Khi màu truyền tải trạng thái hoặc lựa chọn, giao diện MUST có thêm
  nhãn, biểu tượng hoặc chỉ báo hình dạng. Chữ và biểu tượng MUST đủ tương phản với nền trong
  cả theme sáng lẫn tối.
- **Ngôn ngữ giao diện**: Mọi nội dung giao diện do Herdsman cung cấp MUST dùng tiếng Anh,
  gồm nhãn, nút, menu, hộp thoại, tooltip, thông báo trạng thái và thông báo lỗi.
  Nội dung do người dùng hoặc agent cung cấp được hiển thị bằng ngôn ngữ gốc.
- **App:** Tauri 2. Backend Rust (tokio, serde, sqlx, SQLite). Frontend React + TypeScript,
  state bằng Zustand, server state bằng TanStack Query.
- **Runtime:** `hc` (herdr-core) do người dùng cài; Herdsman gắn label `herdsman.*` cho mọi
  terminal của mình.
- **Agent:** sidecar `herdsman-agent` (Node, đóng gói kèm app) chạy trong terminal của `hc`,
  giao tiếp với app qua Unix socket + event log NDJSON, báo status cho `hc` qua OSC 7501.
- **Bảo mật:** credential (API key) MUST lưu trong Keychain và chỉ truyền vào env của sidecar lúc
  chạy; không ghi vào SQLite, event log hay log thường.
- **Nền tảng:** macOS trước, sau đó Linux.
- Tài liệu nguồn: `specs/business-requirement/BR-001.md` và `specs/technical.md`. Khi code và tài
  liệu mâu thuẫn, MUST cập nhật một trong hai trong cùng thay đổi.

## Quy trình phát triển & cổng chất lượng

- Tính năng đi theo luồng Spec Kit: specify → (clarify) → plan → tasks → implement. Mỗi plan MUST
  có Constitution Check đối chiếu sáu nguyên tắc trên.
- **Test bắt buộc:**
  - Contract test cho giao thức socket sidecar và các lệnh `hc` mà app dùng.
  - Smoke test sidecar với Agent SDK cho mỗi lần nâng phiên bản.
  - Test tích hợp cho ba tiêu chí chấp nhận chính của BR: tắt app 10 phút rồi mở lại không mất
    gì; Mermaid/chart render đúng; duyệt quyền `Edit` hiện diff và Allow cho agent chạy tiếp.
- Thay đổi chạm tới persistence, permission hoặc giao thức MUST có test tái hiện kịch bản app tắt
  giữa chừng.
- Plan và review cho mọi thay đổi giao diện MUST kiểm tra việc dùng token theme và tính nhất
  quán với quy ước giao diện của Herdsman trong cả theme sáng lẫn tối.
- Plan và review giao diện MUST xác định điểm nhấn màu cho hành động chính, mục đang chọn và
  trạng thái quan trọng khi có. Review MUST kiểm tra ý nghĩa màu nhất quán, độ tương phản và
  khả năng nhận biết trạng thái khi hiển thị ở thang xám.
- Review MUST kiểm tra: không có đường nào agent chạy tool cần quyền mà không qua người dùng;
  không có dữ liệu nhạy cảm trong log.

## Governance

- Constitution này có hiệu lực cao hơn mọi quy ước khác của dự án; plan hoặc PR vi phạm MUST
  sửa lại hoặc ghi rõ lý do trong Complexity Tracking.
- Sửa đổi MUST ghi trong file này kèm Sync Impact Report, cập nhật version và ngày sửa.
- Versioning theo semver: MAJOR khi bỏ hoặc định nghĩa lại nguyên tắc; MINOR khi thêm nguyên tắc
  hoặc mở rộng đáng kể; PATCH khi chỉnh câu chữ.
- Mỗi lần `/speckit-plan` và review PR MUST kiểm tra tuân thủ; khi BR hoặc Technical Architecture
  đổi phạm vi, MUST rà lại constitution.

**Version**: 2.0.0 | **Ratified**: 2026-11-21 | **Last Amended**: 2026-11-26
