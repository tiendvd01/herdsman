# Quickstart: kiểm tra phím tắt ẩn/hiện sidebar

```bash
pnpm dev     # mở http://localhost:1420/?mock (trình duyệt macOS)
```

1. **⌘B** — sidebar trái đang hiện: nhấn ⌘B → ẩn, nút header thành "Expand sidebar"; nhấn lại → hiện với độ rộng cũ. (US1)
2. **⌘R** — side panel ở tab Log: ⌘R → ẩn, trang không tải lại (kiểm bằng một biến `window.__marker` vẫn còn); ⌘R → hiện, vẫn tab Log, độ rộng cũ. (US2, FR-002)
3. **Đang gõ** — mở một workspace, gõ "hello" vào ô nhập, nhấn ⌘B rồi ⌘R: ô nhập vẫn là "hello", con trỏ cuối chữ. (FR-004)
4. **Hộp thoại mở** — mở ⌘K, nhấn ⌘B: sidebar không đổi. (Edge case)
5. **Tổ hợp khác** — ⌘⇧B, ⌘⌥R: không đổi gì. (FR-007)
6. **Focus** — focus vào ô tìm kiếm ở sidebar trái, nhấn ⌘B: focus chuyển về ô nhập tin nhắn (hoặc vùng giữa). (FR-010)
7. **Khám phá** — rê chuột vào nút ẩn/hiện ở header: tooltip có ⌘B / ⌘R; ⌘K gõ "sidebar": có lệnh kèm phím tắt. (US3)

```bash
pnpm typecheck && pnpm test   # gồm tests/unit/sidebarShortcuts.test.ts
```
