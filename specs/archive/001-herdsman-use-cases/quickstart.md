# Quickstart — kiểm chứng Herdsman end-to-end

Hướng dẫn chạy và các kịch bản nghiệm thu. Chi tiết giao thức: [contracts/](./contracts/); dữ liệu: [data-model.md](./data-model.md).

## Điều kiện

- macOS (Apple Silicon) hoặc Linux; Rust stable, Node 20+, pnpm.
- `hc` ≥ 0.1.21 đang chạy: `hc server status`.
- Đã đăng nhập Claude (thư mục config của tài khoản) và/hoặc Codex.
- Một repo git mẫu, ví dụ `~/tmp/demo-repo` có branch `main`.

## Chạy

```bash
pnpm install
pnpm tauri dev          # app ở chế độ dev
pnpm test               # Vitest (frontend)
cargo test -p herdsman  # Rust unit + integration (cần hc)
pnpm --filter herdsman-agent test   # sidecar + smoke test Agent SDK
```

## Kịch bản nghiệm thu

| # | Kịch bản | Kết quả mong đợi | Story / SC |
|---|---|---|---|
| 1 | + Project mới → chọn `~/tmp/demo-repo`; thêm lại lần nữa | Project hiện trong sidebar; lần hai báo đã tồn tại | US4 |
| 2 | + cạnh project, để trống tên, thư mục project, gửi "Vẽ sơ đồ Mermaid luồng login và một bảng so sánh" | Session chạy, chữ hiện dần; sơ đồ và bảng render; workspace dùng tiêu đề Claude khi có, mặc định là “New workspace” | US1, US5, SC-002, SC-004 |
| 3 | Gửi prompt có khối ` ```chart ` Vega-Lite và một khối Mermaid lỗi | Biểu đồ hiện; khối lỗi hiện source | US1, SC-002 |
| 4 | Yêu cầu agent sửa `README.md` (chế độ Hỏi mọi lần) | Hộp duyệt có diff; Allow → file đổi, agent chạy tiếp ≤2 s | US3, SC-003 |
| 5 | Gửi task dài, **Quit app**, đợi 10 phút, mở lại | Hội thoại đầy đủ, agent tiếp tục/xong, trạng thái đúng; `hc ls` vẫn thấy terminal | US2, SC-001 |
| 6 | Quit app, cho agent một task cần sửa file, mở lại sau khi agent blocked | Tab chấm vàng, sidebar chấm vàng, hộp duyệt còn đó | US3, US6 |
| 7 | Đổi chế độ sang Tự cho phép sửa file → yêu cầu sửa file rồi chạy `ls` | Sửa file không hỏi; `ls` vẫn hỏi | US3 (FR-022a) |
| 8 | Chọn Bỏ qua mọi duyệt → huỷ, rồi xác nhận | Huỷ: không đổi; xác nhận: badge cảnh báo trên tab | US3 (FR-022b) |
| 9 | Tạo 2 workspace worktree (base `main`), cho cả hai sửa cùng file | Hai branch riêng, thư mục gốc không đổi; chip branch hiện đúng | US7, SC-005 |
| 10 | Archive workspace worktree có thay đổi chưa commit, chọn xoá worktree | Cảnh báo dirty; xác nhận → ẩn khỏi sidebar, tìm thấy trong lịch sử/tìm kiếm | US5 (FR-008a–c) |
| 11 | Mở lịch sử, mở lại session đã xong, gửi tin nhắn | Mở thành tab tạm; resume và chạy tiếp | US8 |
| 12 | Tìm một cụm từ chỉ có ở project khác; mở rộng phạm vi | Có kết quả kèm tên project/workspace <1 s | US8, SC-010 |
| 13 | Mở tab Log của session đang chạy | Màn hình terminal cập nhật realtime | US9 |
| 14 | Chạy `python3 -m http.server` như background task, Quit/mở app, kill | Task sống qua restart; kill dừng; dọn được | US10 |
| 15 | Cho agent giao việc bằng `hc run --bg` cho 2 agent con | Panel Agents hiện cây cha → 2 con kèm trạng thái | US11 |
| 16 | Từ shell: `hc send <terminal> "liệt kê file"`; `claude --resume <sid>` | Tin nhắn hiện trong GUI; CLI mở đúng hội thoại | US12 |
| 17 | Xoá project khi còn session + task chạy | Hộp xác nhận liệt kê đủ; đồng ý → `hc ls` không còn terminal của project | US4 (FR-002a) |
| 18 | Mở hội thoại seed 5.000 message, cuộn nhanh | ≥60 fps, Mermaid chỉ render khi vào khung nhìn | SC-006 |
| 19 | Đổi theme Light/Dark | Giao diện theo shadcn/ui minimal (zinc, Geist) | FR-033 |
