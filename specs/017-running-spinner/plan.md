# Implementation Plan: Vòng quay "đang chạy" cho workspace và tab agent

**Branch**: `017-running-spinner` (thư mục spec; nhánh git hiện tại `master`) | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-running-spinner/spec.md`

## Summary

Thay chấm nhấp nháy bằng vòng quay cho phiên ở trạng thái `working` trên thanh tab, và thêm một vòng quay vào hàng workspace ở thanh bên khi workspace có ≥ 1 phiên `working`. Chỉ thay đổi tầng hiển thị React: dùng lại `useUiStore.statuses` (trạng thái trực tiếp đã có), một component `Spinner` dùng chung (icon `Loader2` của lucide, `animate-spin`), tôn trọng `prefers-reduced-motion`. Không đổi dữ liệu, giao thức hay sidecar.

## Technical Context

**Language/Version**: TypeScript, React (Vite)

**Primary Dependencies**: Tailwind, lucide-react (`Loader2` đã dùng ở `ModelSwitcher`), Zustand (`useUiStore`)

**Storage**: N/A

**Testing**: Vitest + Testing Library (`tests/unit/*.test.tsx`)

**Target Platform**: App desktop Tauri (macOS)

**Project Type**: desktop-app (frontend-only change)

**Performance Goals**: Cập nhật trong < 1 giây sau khi trạng thái đổi (đã thỏa nhờ store realtime); animation chỉ dùng CSS transform

**Constraints**: Không đổi kích thước/bố cục khi bật tắt (ô 6px → dùng ô cố định); đủ tương phản 3 theme qua token `st-working`; giảm chuyển động

**Scale/Scope**: 2 component sửa (`WorkspaceView.tsx`, `Sidebar.tsx`), 1 component mới, 1 test

## Constitution Check

| Nguyên tắc | Đánh giá |
|---|---|
| I. Agent sống độc lập với app | Đạt. Chỉ đọc trạng thái hiển thị; app tắt thì agent không bị ảnh hưởng. Mở lại app thì trạng thái được khôi phục từ nguồn hiện có và vòng quay hiện lại. |
| II. Không mất dữ liệu | Đạt. Không chạm event log. |
| III. Developer nắm quyền | Đạt, còn hỗ trợ: trạng thái `working` dễ thấy hơn; `blocked`/`error` giữ dấu hiệu riêng, không bị gộp vào "chạy" (FR-004). |
| IV. Hiển thị không chậm | Đạt. Animation CSS, không re-render thêm ngoài selector hiện có. |
| V. Tương thích hệ sinh thái | Đạt. UI chỉ dùng trạng thái chuẩn hoá. |
| VI. Giữ đơn giản | Đạt. Không store, dependency hay khái niệm tổ chức mới. |

Kết quả: không vi phạm; không cần Complexity Tracking. Đánh giá lại sau thiết kế: vẫn đạt.

## Project Structure

### Documentation (this feature)

```text
specs/017-running-spinner/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md             # tạo bởi /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ui/
│   │   ├── spinner.tsx          # MỚI: vòng quay dùng chung
│   │   └── status-dot.tsx       # SỬA: status 'working' → Spinner
│   └── layout/
│       ├── WorkspaceView.tsx    # tab dùng StatusDot (tự có spinner)
│       └── Sidebar.tsx          # SỬA: hàng workspace thêm Spinner khi có phiên working
└── styles/globals.css           # (chỉ nếu cần quy tắc reduced-motion)

tests/unit/
└── runningSpinner.test.tsx      # MỚI
```

**Structure Decision**: Dự án đơn (frontend Tauri). Đặt logic hiển thị vào `StatusDot` để mọi nơi dùng nó thống nhất (FR-009); riêng hàng workspace tự tính "có phiên working" từ `statuses`.

Lưu ý phạm vi: `StatusDot` còn được dùng ở bảng tìm nhanh, lịch sử và bảng bên phải. Spec để các nơi này ngoài phạm vi, nên `StatusDot` nhận prop `spin` (mặc định tắt); chỉ thanh tab bật nó.
