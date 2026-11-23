# Kế hoạch triển khai `/clear [name]`

**Nhánh Git** — `master`  
**Ngày** — 2026-11-23  
**Đặc tả** — [spec.md](spec.md)

## Summary

Nhận diện `/clear [name]` tại composer trước khi gửi prompt. Tái sử dụng luồng tạo session để mở một hội thoại mới trong cùng workspace, cùng loại agent và cùng chế độ quyền như khi tạo session thông thường. Lưu tên tùy chọn cùng bản ghi session mới. Lịch sử và lượt đang chạy vẫn thuộc session gốc.

## Technical Context

- **Ngôn ngữ và phụ thuộc** — TypeScript, React, TanStack Query và Zustand ở giao diện. Rust, Tauri 2 và SQLite ở backend. Dùng luồng khởi động sidecar qua `hc` hiện có.
- **Dữ liệu** — Dùng trường `Session.title` hiện có trong SQLite. Trường này để trống khi không có tên để quy tắc đặt tên từ prompt đầu tiên tiếp tục áp dụng.
- **Kiểm thử** — Vitest cho composer và lệnh gọi backend, Cargo cho lưu tiêu đề và đọc lại session, kiểm thử desktop cho luồng qua `hc` và phục hồi sau khi đóng app.
- **Nền tảng** — Desktop macOS trước, Linux theo phạm vi hiện có.
- **Hiệu năng** — Mỗi lần gửi lệnh gọi tạo một session và dùng cùng đường khởi động với thao tác New Session.
- **Phạm vi** — Composer, menu slash command và tạo session. Giao thức sidecar và cách xử lý các lệnh chat khác giữ nguyên tương thích.

## Constitution Check

| Nguyên tắc | Kết quả trước nghiên cứu và sau thiết kế |
| --- | --- |
| I. Agent sống độc lập | Đạt. Session mới chạy qua `hc`. Đóng app sau khi tạo hoàn tất vẫn để agent chạy và session được tìm lại qua luồng kết nối hiện có. Kiểm tra thêm khi đóng app trong lúc khởi tạo theo quickstart. |
| II. Giữ dữ liệu hội thoại | Đạt. Session mới có ID riêng. Session cũ giữ event log và transcript. Tiêu đề ban đầu được ghi cùng bản ghi session. |
| III. Quyền người dùng | Đạt. Session mới đi qua luồng thiết lập quyền mặc định hiện có. Yêu cầu đang chờ thuộc session gốc. |
| IV. Hiệu năng giao diện | Đạt. Tái sử dụng cache session và điều hướng tab. Không tải hay dựng lại lịch sử cũ để xử lý lệnh. |
| V. Tương thích engine | Đạt. Cùng luồng tạo sidecar cho các engine hiện có. Có kiểm tra hồi quy hợp đồng. |
| VI. Project → Workspace → Session | Đạt. Session mới dùng lại workspace và thư mục làm việc của session gốc. |

## Project Structure

### Documentation

```text
specs/019-fix-clear-name/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── clear-command.md
```

### Source Code

```text
src/components/composer/Composer.tsx
src/lib/actions.ts
src/lib/api.ts
src-tauri/src/commands.rs
src-tauri/src/store.rs
tests/unit/
sidecar/test/
```

**Quyết định cấu trúc** — Tách thao tác tạo và cập nhật cache dùng chung khỏi cách báo lỗi và chọn session của từng nơi gọi. Composer lưu ID session gửi lệnh để thao tác hoàn tất vẫn thuộc đúng workspace khi người dùng đã chuyển tab. Chỉ tự chuyển sang session mới nếu người dùng vẫn ở nơi đã gửi lệnh.

## Complexity Tracking

Không có ngoại lệ đối với constitution.
