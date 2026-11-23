# Quickstart

1. `pnpm test -- tests/unit/mermaidZoom.test.ts tests/unit/mermaidViewer.test.tsx tests/unit/render.test.tsx`
2. `pnpm typecheck`.
3. Chạy web view `?mock`, mở conversation có mermaid, bấm nút phóng to: kiểm tra mở/đóng (Esc, nút, nền), +/−, Ctrl+wheel, kéo, Đặt lại, %, đổi theme. Chụp ảnh bằng Playwright.
Kết quả mong đợi: khớp các Acceptance Scenarios trong [spec.md](spec.md).
