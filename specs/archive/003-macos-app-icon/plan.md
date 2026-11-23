# Implementation Plan: Icon app đúng chuẩn macOS và đồng bộ logo trong app

**Branch**: `003-macos-app-icon` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-macos-app-icon/spec.md`

## Summary

Giữ thiết kế chữ H hiện tại làm **một file gốc duy nhất** (`src/assets/herdsman-mark.svg`, nền tràn khung). Một script nhỏ sinh từ file gốc:

- `src-tauri/icons/icon.svg`: khung 1024 với nền 824×824 ở giữa, lề trong suốt 100 px và bóng đổ nhẹ, theo chuẩn icon app macOS. Từ file này `tauri icon` sinh `icon.icns` và các PNG dùng cho macOS/Linux.
- Bản tràn khung dùng cho `icon.ico` và các logo Windows (`Square*`, `StoreLogo`) để Windows không bị nhỏ bất thường.

Trong app, `HerdsmanMark` hiển thị chính file gốc qua import của Vite, thay logo ba chấm. `index.html` khai báo favicon trỏ tới cùng file gốc, còn `public/icon.svg` trùng lặp thì bỏ.

## Technical Context

**Language/Version**: TypeScript 5.8 (React 18), Node ≥ 20 cho script sinh icon; Rust/Tauri 2 chỉ đọc file icon

**Primary Dependencies**: Vite 6 (import asset SVG), `@tauri-apps/cli` 2 (`tauri icon` render SVG → PNG/ICNS/ICO). Không thêm dependency mới.

**Storage**: N/A (file ảnh trong repo)

**Testing**: Vitest + Testing Library (logo sidebar render đúng file gốc); kiểm tra bằng mắt theo quickstart (Dock, sidebar, favicon)

**Target Platform**: macOS trước; Windows/Linux giữ icon hợp lý

**Project Type**: desktop-app (Tauri 2 + React)

**Performance Goals**: N/A (asset tĩnh, SVG < 1 KB)

**Constraints**: Khung chuẩn macOS 1024/824; icon rõ ở 16 px; logo rõ ở theme sáng và tối

**Scale/Scope**: 1 file gốc, 1 script, 1 component, `index.html`, bộ icon trong `src-tauri/icons/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Đánh giá |
|---|---|
| I. Agent sống độc lập với app | Không đụng tiến trình agent/`hc`. Tắt app giữa chừng không ảnh hưởng gì vì chỉ đổi asset. ✅ |
| II. Không mất dữ liệu hội thoại | Không đụng event log, transcript, persistence. ✅ |
| III. Developer nắm quyền kiểm soát | Không đụng permission/trạng thái. Icon thông báo hệ điều hành vẫn là icon app (chỉ đổi hình). ✅ |
| IV. Hiển thị giàu thông tin nhưng không chậm | SVG tĩnh từ repo (không phải nội dung agent), không cần sanitize; không ảnh hưởng hiệu năng. ✅ |
| V. Tương thích hệ sinh thái | Không đụng engine/adapter. ✅ |
| VI. Giữ đơn giản | Không thêm khái niệm hay dependency. Thêm 1 script `scripts/gen-icons.mjs` (~40 dòng) để giữ một nguồn duy nhất (FR-008); xem Complexity Tracking. ✅ |

Cổng chất lượng: thay đổi không chạm persistence/permission/giao thức nên không cần test app-tắt-giữa-chừng. Có unit test cho logo.

**Re-check sau Phase 1**: thiết kế không đổi so với trên → vẫn PASS.

## Project Structure

### Documentation (this feature)

```text
specs/003-macos-app-icon/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── herdsman-mark.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/assets/herdsman-mark.svg        # MỚI — thiết kế gốc duy nhất (tràn khung)
scripts/gen-icons.mjs               # MỚI — sinh icon macOS (có lề) + chạy tauri icon
package.json                        # thêm script "icons"
index.html                          # thêm <link rel="icon"> trỏ file gốc
public/icon.svg                     # XOÁ — trùng file gốc
src/components/layout/Sidebar.tsx   # HerdsmanMark hiển thị file gốc
src-tauri/icons/                    # sinh lại: icon.svg (có lề), icns, png, ico, Square*
tests/unit/herdsmanMark.test.tsx    # MỚI
```

**Structure Decision**: Giữ cấu trúc hiện có (single project: `src/` frontend, `src-tauri/` backend). Chỉ thêm thư mục `scripts/` cho script sinh icon.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Thêm `scripts/gen-icons.mjs` | Giữ một thiết kế gốc cho cả icon hệ điều hành (cần lề) và logo trong app (tràn khung), FR-008 | Sửa tay hai file SVG → dễ lệch nhau khi chỉnh thiết kế lần sau |
