# Research — Herdsman (001-herdsman-use-cases)

Nguồn: [spec.md](./spec.md), [technical.md](../technical.md), constitution v1.1.0, `hc` 0.1.21 (`hc schema`).
`technical.md` viết trước khi có Workspace (F11) và trước khi chọn shadcn/ui, nên các mục R1–R5 dưới đây bổ sung cho nó.

## R1. Mô hình Workspace và worktree

- **Decision**: Thêm bảng `workspaces` giữa `projects` và `sessions`. Workspace giữ `work_dir` (thư mục project hoặc đường dẫn worktree). Worktree tạo bằng CLI `git worktree add -b <branch> <path> <base>` do backend Rust gọi (`tokio::process`), đặt tại `<project>/../.herdsman-worktrees/<project-name>/<workspace-slug>` (cạnh repo, ngoài cây làm việc của repo). Xoá bằng `git worktree remove` (+ `--force` chỉ sau khi người dùng xác nhận). Kiểm tra thay đổi chưa commit bằng `git -C <wt> status --porcelain`.
- **Rationale**: CLI `git` tôn trọng hook, config, credential của người dùng; `git2`/libgit2 hỗ trợ worktree chưa đủ (không chạy hook, khác hành vi sparse/LFS). Đặt ngoài repo để công cụ của repo (watcher, linter) không quét worktree.
- **Alternatives**: `git2` crate (thiếu hook, khó đồng nhất với hành vi `git`); đặt worktree trong `<app data>` (đường dẫn xa, khó mở bằng editor); chạy `git worktree` qua `hc exec` (thêm một tầng không cần thiết vì project là local).

## R2. Chế độ duyệt quyền (FR-022a/b)

- **Decision**: Ánh xạ 3 chế độ sang `permissionMode` của Agent SDK: Hỏi mọi lần → `default`; Tự cho phép sửa file → `acceptEdits`; Bỏ qua mọi duyệt → `bypassPermissions`. Với Codex: `approval_policy` tương ứng `untrusted` / `on-failure` + sandbox `workspace-write` / `never` + `danger-full-access`. Đổi chế độ lúc chạy qua lệnh socket `set_permission_mode`. Chế độ lưu ở `sessions.permission_mode`; bước xác nhận cho `bypass` làm ở UI.
- **Rationale**: Dùng đúng cơ chế engine có sẵn, không tự chặn tool ở tầng app (tuân thủ nguyên tắc V). `acceptEdits` của SDK chỉ tự cho phép sửa file trong `cwd` và thư mục thêm vào, khớp FR-022a.
- **Alternatives**: Tự quyết trong `canUseTool` theo danh sách tool (lặp logic của SDK, dễ lệch khi SDK đổi); chỉ hỗ trợ `default` (trái kết quả clarify Q2).

## R3. Giao diện shadcn/ui minimal

- **Decision**: Tailwind CSS v4 + shadcn/ui (copy component vào `src/components/ui`), Radix primitives, icon `lucide-react`, font Geist / Geist Mono đóng gói kèm app (không tải Google Fonts lúc chạy). Token màu zinc theo BR 3.2, khai báo bằng CSS variables cho Light/Dark; theme mặc định theo `prefers-color-scheme`, lưu lựa chọn của người dùng.
- **Rationale**: Khớp artifact đã chọn; shadcn là source trong repo nên tuỳ biến được, không thêm dependency runtime lớn. App desktop cần chạy offline nên font phải đóng gói.
- **Alternatives**: Mantine / Chakra (style khác artifact, bundle lớn); tự viết CSS (tốn công, khó giữ nhất quán).

## R4. Tìm kiếm hội thoại (FR-028, SC-010)

- **Decision**: SQLite FTS5, bảng ảo `message_fts(session_id, workspace_id, project_id, text)`. Backend Rust index mỗi message hoàn chỉnh (user, assistant text, tóm tắt tool) khi nó được ghi vào event log hoặc khi app phát lại log lần đầu. Truy vấn có bộ lọc workspace hoặc toàn app, trả về `snippet()`.
- **Rationale**: Đã có SQLite; FTS5 trả kết quả < 50 ms với hàng triệu dòng, đạt SC-010 (< 1 s / 1.000 session). Không cần dịch vụ ngoài.
- **Alternatives**: `tantivy` (mạnh hơn nhưng thêm index riêng phải đồng bộ); quét file `events.ndjson` (chậm, tuyến tính theo dung lượng).

## R5. Archive / xoá workspace và xoá project (FR-002a, FR-008a–c)

- **Decision**: Archive = `workspaces.archived_at` khác null; sidebar ẩn, lịch sử và FTS giữ nguyên. Xoá workspace = xoá dòng workspace/sessions/FTS khỏi SQLite và thư mục `<app data>/sessions/<sid>/`; không đụng transcript `~/.claude`, `~/.codex`. Xoá project: liệt kê terminal `hc` có label `herdsman.project=<pid>` đang live → hộp xác nhận → `terminal.kill` từng cái → chờ `finished` → `terminal.rm` → xoá dữ liệu app.
- **Rationale**: Nguồn sự thật về tiến trình nằm ở `hc` (nguyên tắc I), lọc theo label bảo đảm không bỏ sót tiến trình mồ côi kể cả khi SQLite lệch.
- **Alternatives**: Soft delete cho project (không cần, spec không yêu cầu khôi phục project).

## R6. Cây multi-agent (FR-025)

- **Decision**: Dựng cây từ trường `parent` / `children` của terminal trong `hc` (có trong `hc schema`), qua `terminal.list` và `events.subscribe`. Tiến độ lấy từ `Status {state, kind, msg, progress}`.
- **Rationale**: `hc` đã theo dõi quan hệ khi agent dùng `hc run --bg`; không cần đọc tin nhắn giữa agent (đúng phạm vi BR).
- **Alternatives**: Suy cây từ tool call `Task` trong event log (chỉ thấy sub-agent nội bộ của SDK, không thấy agent giao qua `hc`).

## R7. Background tasks (FR-026)

- **Decision**: Chạy bằng `terminal.run` với `cwd = project.path`, `outlive_parent: true`, label `herdsman.app=1, herdsman.project=<pid>, herdsman.kind=task`. Log xem bằng xterm.js qua `terminal.attach`; kill/dọn bằng `terminal.kill` / `terminal.rm`.
- **Rationale**: Dùng chung cơ chế với session nên tự sống qua việc tắt app (nguyên tắc I).
- **Alternatives**: Chạy tiến trình con từ Rust (chết theo app, vi phạm nguyên tắc I).

## R8. Thông báo hệ điều hành (FR-020)

- **Decision**: `tauri-plugin-notification`, kích hoạt từ `useStatusStore` khi trạng thái chuyển sang `done` / `blocked` / `error` và cửa sổ app không focus. Click thông báo → focus app + mở đúng session (payload mang `session_id`).
- **Rationale**: Plugin chính thức của Tauri 2, hỗ trợ macOS và Linux.
- **Alternatives**: `notify-rust` trực tiếp (phải tự xử lý quyền thông báo trên macOS).

## R9. Kiểm thử

- **Decision**: Rust: `cargo test` (unit + integration với `hc` thật chạy trong CI macOS). Sidecar: `node --test` + smoke test Agent SDK (port `devdy/sidecar/test-smoke.mjs`). Frontend: Vitest + Testing Library. E2E: WebdriverIO + `tauri-driver` (Linux) cho kịch bản nghiệm thu; macOS chạy kịch bản thủ công theo [quickstart.md](./quickstart.md) cho tới khi có driver.
- **Rationale**: Constitution yêu cầu contract test cho socket và lệnh `hc`, smoke test SDK, test tích hợp cho ba tiêu chí chính.
- **Alternatives**: Playwright (chưa hỗ trợ WebView của Tauri trên macOS).

## R10. Rủi ro còn mở (kế thừa technical.md §9)

| Rủi ro | Xử lý trong plan |
|---|---|
| Cú pháp OSC 7501 | **Đã kiểm chứng (T009, 2026-11-21, hc 0.1.21)**: `ESC ] 7501 ; state=<s>[:kind=<k>][:progress=<n>] BEL`, các trường ngăn bằng `:` (`;` không được nhận). hc lưu `state`, `kind`, `progress`; trường `msg` bị bỏ qua. `hc get` thấy ngay `blocked/permission` |
| `hc send` nhiều dòng vào stdin sidecar | PoC bracketed paste trong US12 |
| Sidecar trong hc, app ngắt rồi nối lại (T010) | **Đã kiểm chứng**: sidecar sống khi client rời đi giữa lúc chờ duyệt quyền, `hc` thấy `blocked/permission`, nối lại nhận đủ event. Lưu ý: hc core **không có PATH của shell người dùng** → app phải truyền đường dẫn tuyệt đối tới `node` (và `git`, lệnh task chạy qua `zsh -lc`). `hc send` từ chối gõ khi terminal đang `blocked` (đúng thiết kế của hc) |
| Đặt worktree cạnh repo có thể không ghi được (quyền thư mục) | Fallback `<app data>/worktrees/...`, báo trong UI |
