# Quickstart: kiểm tra menu workspace ở sidebar

## Chuẩn bị

```bash
pnpm install
pnpm dev            # http://localhost:1420
```

Mở `http://localhost:1420/?mock` (dữ liệu mẫu: project `herdsman` có workspace "Fix login OAuth" và "Refactor store").

## Kịch bản

1. **Menu hiện khi hover** — rê chuột vào dòng "Refactor store": nút "⋯" hiện; rời chuột thì ẩn. Tab tới nút bằng bàn phím: nút hiện. (FR-001)
2. **Xoá workspace không đang mở** — đang mở "Fix login OAuth"; mở menu của "Refactor store" → Delete workspace → hộp xác nhận → Delete. "Refactor store" biến khỏi sidebar, vùng giữa vẫn là "Fix login OAuth". (US1, FR-004, SC-003)
3. **Cancel không đổi gì** — mở lại hộp xác nhận, bấm Cancel/Esc: không có gì bị xoá. (SC-002)
4. **Xoá workspace đang mở** — xoá "Fix login OAuth" từ sidebar: vùng giữa về màn "Pick or create a workspace". (FR-005)
5. **Archive** — Archive một workspace: biến khỏi sidebar; hộp xác nhận ghi "Running sessions will stop". (US2)
6. **Rename** — Rename từ sidebar: tên mới hiện ở sidebar và breadcrumb nếu đang mở. (US3)
7. **Worktree bẩn** — workspace worktree, chọn "Also delete worktree": khung cảnh báo liệt kê file chưa commit. (Edge case; mock trả 1 file)

## Tự động

```bash
pnpm typecheck
pnpm test           # gồm tests/unit/workspaceMenu.test.tsx
```

Kiểm giao diện bằng Playwright trên `?mock` (hover dòng workspace, chụp menu và hộp xác nhận ở light/dark).
