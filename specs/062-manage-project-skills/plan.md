# Implementation Plan: Quản lý skills theo project

**Branch**: `master` (Git) | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: `specs/062-manage-project-skills/spec.md`  
**Spec Kit feature**: `062-manage-project-skills`

## Summary

Thêm **Settings → Skills** với bộ chọn project, tìm kiếm, làm mới, bật/tắt skill và quản lý thư mục nguồn. Lưu cấu hình theo project trong SQLite. Khi tạo session Claude, chuẩn bị một plugin local chỉ chứa skill đã chọn và chuyển plugin vào Claude Agent SDK. Settings tự phát hiện skill Claude của thư mục chính để hiển thị chỉ đọc. Lúc tạo session, kiểm tra xung đột dựa trên thư mục làm việc thực tế.

## Technical Context

- **Language/Version** — TypeScript, React 18, Rust 2021 và Node.js theo các phiên bản repo hiện hành.
- **Primary Dependencies** — Tauri 2, TanStack Query, shadcn/ui, rusqlite và Claude Agent SDK đang khóa trong lockfile. Dùng parser YAML hỗ trợ mô tả nhiều dòng khi đọc frontmatter nếu repo chưa có parser phù hợp.
- **Storage** — SQLite hiện tại cho lựa chọn và nguồn của project. Thư viện dùng chung tại `<app data>/skills`. Plugin riêng của session được lưu trong thư mục dữ liệu session.
- **Testing** — Vitest cho Settings, Rust cho discovery, giao dịch và chuẩn bị launch, Node contract test cho sidecar và smoke test có tài khoản Claude.
- **Target Platform / Project Type** — Herdsman desktop local, macOS trước. Dùng thao tác filesystem tương thích Linux.
- **Performance Goals** — p95 tối đa 2 giây khi chuyển giữa hai project với 50 skill. Thực hiện I/O ngoài luồng giao diện và khóa DB.
- **Constraints / Scale** — Phạm vi Claude và project local. Một cấu hình mỗi project, plugin khi cần cho mỗi session. Có thể dùng Settings offline.

## Constitution Check

| Nguyên tắc | Trước nghiên cứu | Sau thiết kế |
|---|---|---|
| I. Agent sống độc lập với app | Đạt | Sidecar vẫn chạy qua hc. Plugin nằm trong dữ liệu session. Kiểm tra tắt app trong lúc ghi cấu hình và kết nối lại session đang chạy. |
| II. Không mất dữ liệu hội thoại | Đạt | Giữ cơ chế nối log và resume. Cảnh báo khi bỏ qua skill đi qua event tương thích với lịch sử cũ. |
| III. Developer kiểm soát agent | Đạt | Chỉ đưa skill do người dùng bật vào plugin. Duy trì `canUseTool` và permission mode hiện hành. |
| IV. Hiển thị giàu thông tin | Đạt | Dùng query theo project và loại cache cũ sau mutation. Hiển thị metadata dạng text và lỗi nguồn riêng từng mục. |
| V. Tương thích hệ sinh thái | Đạt | Dùng tùy chọn plugin local của Claude Agent SDK. Bao phủ tham số launch bằng contract test và kiểm chứng skill thực sự xuất hiện trong smoke test. |
| VI. Project → Workspace → Session | Đạt | Cấu hình thuộc project. Workspace chỉ cung cấp thư mục chạy Claude. Các thiết lập toàn cục và native để nguyên. |

Review giao diện dùng component shadcn/ui của app, theme tokens sáng/tối, nhãn tiếng Anh, keyboard focus và trạng thái tải/lỗi. Khi triển khai cập nhật mô tả launch và lưu trữ trong `specs/technical.md`.

## Project Structure

### Documentation (this feature)

```text
specs/062-manage-project-skills/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/settings-and-launch.md
```

### Source Code (repository root)

```text
src/components/settings/
  SettingsDialog.tsx
  ProjectSkillsSection.tsx
src/lib/
  api.ts
  queries.ts
  types.ts
src-tauri/
  migrations/
  src/
    project_skills.rs
    commands.rs
    lib.rs
    store.rs
    agent.rs
sidecar/
  src/index.mjs
  src/engines/claude.mjs
  test/
tests/unit/settingsDialog.test.tsx
```

**Structure Decision** — Giữ Settings, query client, database và launcher hiện tại. Gom discovery, validation và chuẩn bị plugin vào một module Rust. Tích hợp cả đường tạo workspace kèm session và đường thêm session vào workspace. Launch lại session đã có dùng bộ plugin đã chốt nếu có. Session cũ và session import giữ luồng hiện hành.

## Complexity Tracking

Không có ngoại lệ constitution. Dùng SQLite hiện có và query cache theo project.
