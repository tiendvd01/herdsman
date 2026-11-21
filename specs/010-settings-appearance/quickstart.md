# Quickstart: Settings — Appearance

## Tự động
```sh
pnpm typecheck && pnpm test
```

## Thủ công (`pnpm dev` → mở `http://localhost:1420/?mock`)
1. Footer sidebar có bánh răng cạnh "hc connected"; header không còn nút theme.
2. Bấm bánh răng → dialog Settings, mục Appearance. Esc → đóng. ⌘, → mở lại.
3. Chọn Dark → app tối ngay. Reload → vẫn tối. ⌘⇧L vẫn đổi theme.
4. Interface font → chọn font khác → chữ UI đổi, code block giữ Geist Mono.
5. Code font → chọn Menlo → code block/diff/đường dẫn đổi. Reset → về Geist Mono.
6. Reload → font giữ nguyên. Sửa localStorage `herdsman-ui` thành `codeFont: "xxx"` → app dùng Geist Mono.

Xem [contracts/ui.md](contracts/ui.md), [data-model.md](data-model.md).
