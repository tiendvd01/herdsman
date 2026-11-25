# Research — Quản lý skills theo project

## Scope và nguồn

- **Decision** — Lấy project ID đã đăng ký trong Herdsman làm phạm vi. Quét thư viện chung và nguồn bổ sung theo thứ tự thêm. Ở Settings, hiển thị skill native theo thư mục chính của project và thư mục Claude user đang dùng, kèm nhãn chỉ đọc. Kiểm tra native lại theo cwd thực tế khi tạo session.
- **Rationale** — `Workspace.project_id` giữ liên kết ngay cả khi cwd là worktree hoặc project nằm ngoài Git. Claude adapter hiện nạp `user`, `project`, `local`. Dùng cùng cấu hình home của engine khi xác định nguồn user. Đối chiếu đường dẫn phát hiện native với SDK đang cài bằng fixture thư mục chính, cwd lồng nhau và worktree, trước khi chốt resolver. Package SDK 0.3.329 khai báo Claude Code 2.1.329. Khi worktree thiếu thư mục skill cấp gốc, Claude có thể dùng nguồn từ checkout chính theo quy tắc native. Dùng thư mục skill rỗng để kiểm tra trường hợp chủ động không nạp bản từ checkout chính.
- **Alternatives considered** — Dùng Git common dir như mod herdr-app sẽ bỏ qua project ngoài Git. Chỉ kiểm tra thư mục chính khi launch sẽ bỏ sót khác biệt ở worktree. [Claude Code settings](https://code.claude.com/docs/en/settings) · [Claude Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)

## Định danh, ưu tiên và persistence

- **Decision** — Dùng nguồn đã chuẩn hóa và thư mục con làm định danh lựa chọn. Dùng tên hiệu lực từ định nghĩa skill để so xung đột, đối chiếu quy tắc tên với SDK. Thư viện chung thắng nguồn bổ sung. Nguồn bổ sung được xét theo thứ tự thêm. Khi nguồn được ưu tiên tạm thời mất, không tự cấp một bản khác cùng tên. Khi xóa nguồn, xóa lựa chọn liên quan trong cùng giao dịch.
- **Rationale** — Tên trùng không nên biến một lựa chọn rõ ràng thành quyền nạp nội dung từ thư mục khác. Ràng buộc duy nhất theo project và giao dịch cho phép phục hồi nhất quán sau khi đóng app.
- **Alternatives considered** — File JSON riêng cần quản lý ghi nguyên tử và lifecycle riêng. Dùng tên skill làm khóa sẽ tái gán khi nguồn thay đổi.

## Nạp skill trong session Claude

- **Decision** — Đọc cấu hình đã commit trước khi tạo session. Chuẩn bị plugin local gồm manifest và thư mục skill được chọn, công bố bằng rename nguyên tử trong vùng dữ liệu session. Sao chép thư mục skill cùng tài nguyên đi kèm vào vùng staging. Xác minh containment, phát hiện vòng lặp symlink, từ chối đích ra ngoài thư mục skill gốc và bỏ qua file đặc biệt. Truyền đường dẫn nội bộ qua đối số sidecar tùy chọn rồi ánh xạ vào `Options.plugins` của SDK. Giữ cấu hình native của Claude và loại skill quản lý xung đột trước khi tạo plugin.
- **Rationale** — Tùy chọn `SdkPluginConfig` dạng `{ type: 'local', path }` có trong `sidecar/node_modules/@anthropic-ai/claude-agent-sdk/sdk.d.ts`. Plugin có namespace riêng nên cần phát hiện và lọc xung đột theo đặc tả. Giữ một plugin cho mỗi session bảo toàn danh sách đã chốt dù Claude query hiện khởi động lười. Bản đã chốt giữ nguyên khi nguồn được sửa hoặc gỡ. Smoke test phải kiểm tra skill xuất hiện và gọi được với tên Claude báo về.
- **Alternatives considered** — Dùng một plugin thay đổi theo project có thể làm session đã tạo thấy lựa chọn mới khi query chưa khởi động. Sửa cấu hình Claude trong repo sẽ ảnh hưởng Claude chạy bên ngoài Herdsman.

## An toàn và lỗi một phần

- **Decision** — Quét file chỉ đọc, giới hạn metadata đọc, parse frontmatter thành text. Chuẩn hóa source path và kiểm tra đích symlink trước khi cấp. Hỗ trợ thư mục skill được link bởi người dùng tại nguồn đã đăng ký. Chỉ sinh cấu trúc dưới app data và không đưa hooks, MCP hoặc cấu hình quyền vào plugin. Kiểm tra frontmatter trong bản đóng gói và loại các khai báo cấp quyền hoặc tự chạy hook. Giữ nguyên bản gốc và kiểm chứng bằng fixture rằng tool call cần duyệt vẫn tới canUseTool. Cảnh báo tên skill và lý do qua UI hiện hành khi không thể cấp.
- **Rationale** — Người dùng có thể chọn lại hoặc phục hồi nguồn. Lỗi ở một skill vẫn cho chạy các skill còn lại. Nếu chuẩn bị plugin thất bại hoàn toàn, vẫn cho chạy Claude và hiện cảnh báo. Kiểm chứng adapter tiếp tục đi qua luồng xin quyền.
- **Alternatives considered** — Chặn tạo session khi một nguồn mất gây gián đoạn công việc. Nuốt lỗi khiến người dùng tưởng skill đang được áp dụng.

[Claude Agent SDK Plugins](https://code.claude.com/docs/en/agent-sdk/plugins) · [Claude Code skill discovery and frontmatter](https://code.claude.com/docs/en/skills)
