# Implementation Plan: Thống nhất bộ khoảng cách (spacing) trong app

**Branch**: `009-unified-spacing-scale` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-unified-spacing-scale/spec.md`

## Summary

Giao diện đang dùng 18 giá trị khoảng cách khác nhau; nút "+" của dòng "Projects" và nút menu workspace lệch 2px so với nút "+" của project vì lề phải tự đặt (`pr-0.5`, `right-0.5`). Plan:

1. Chốt bộ 8 bậc trên lưới 4px (`0.5, 1, 1.5, 2, 3, 4, 6, 8`) cộng `0`, ghi ở một chỗ: `src/lib/spacing.ts` (bậc, vai trò, danh sách ngoại lệ có lý do).
2. Đổi ~33 token ngoài bộ theo bảng D2 trong [research.md](./research.md); giữ 2 ngoại lệ (`pl-[84px]` đèn giao thông macOS, `ml-[15px]` đường cây).
3. Sửa căn hàng sidebar: bỏ `pr-0.5` ở dòng "Projects", `right-0.5` → `right-0` cho nút menu workspace, `pr-7` → `pr-8`.
4. Test Vitest `tests/unit/spacingScale.test.ts` quét `src/` và báo `file:dòng token` khi có giá trị ngoài bộ.
5. Kiểm tra bằng Playwright trên `?mock`: đo mép phải các nút, chụp sáng / tối.

## Technical Context

**Language/Version**: TypeScript 5.8, React 18

**Primary Dependencies**: Tailwind CSS v4 (bậc spacing mặc định 4px), Vitest — không thêm dependency

**Storage**: N/A

**Testing**: Vitest (`tests/unit`), Playwright CLI chụp `http://localhost:1420/?mock`

**Target Platform**: Tauri 2 webview trên macOS (sau đó Linux)

**Project Type**: desktop-app (frontend React trong `src/`)

**Performance Goals**: không đổi; test quét file chạy < 1s

**Constraints**: giữ mật độ của spec 006 (SC-005 ±10%); không đổi hành vi (FR-011)

**Scale/Scope**: ~20 file `.tsx` trong `src/components`, 1 module mới, 1 test mới

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Đánh giá |
|------------|----------|
| I. Agent sống độc lập với app | Chỉ đổi class CSS; không chạm tiến trình agent. App tắt giữa chừng không ảnh hưởng gì. ✅ |
| II. Không mất dữ liệu hội thoại | Không chạm event log / persistence. ✅ |
| III. Developer nắm quyền kiểm soát | Không đổi luồng duyệt quyền; hộp thoại quyền chỉ đổi khoảng đệm, vẫn hiện đủ nội dung. ✅ |
| IV. Hiển thị giàu thông tin nhưng không chậm | Nội dung agent (`.prose-hs`) giữ nguyên; không thêm render. ✅ |
| V. Tương thích hệ sinh thái | Không liên quan. ✅ |
| VI. Giữ đơn giản | Một module hằng số + một test, không store, không dependency. ✅ |

Post-design re-check: không có vi phạm; không cần Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/009-unified-spacing-scale/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/spacing-scale.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── lib/spacing.ts                     # MỚI: bậc, vai trò, ngoại lệ, isAllowedSpacing
├── lib/platform.ts                    # TRAFFIC_LIGHTS_PAD (ngoại lệ)
└── components/
    ├── layout/Sidebar.tsx             # căn mép phải, gap-px, pr-7, pl-2.5
    ├── workspace/WorkspaceMenu.tsx    # right-0.5 → right-0
    ├── ui/button.tsx                  # size sm px-2.5
    ├── panels/RightPanel.tsx          # p-[3px], 3.5, 2.5
    ├── history/HistoryPopover.tsx     # p-[3px]
    ├── conversation/*.tsx             # 3.5, 2.5, 5, 12
    ├── layout/WorkspaceView.tsx       # 2.5 nếu có
    └── …                              # các file còn lại theo kết quả test
tests/unit/spacingScale.test.ts        # MỚI
```

**Structure Decision**: giữ cấu trúc frontend sẵn có; danh sách file cụ thể lấy từ kết quả chạy test quét (test viết trước, đỏ, rồi sửa tới khi xanh).

## Complexity Tracking

Không có.
