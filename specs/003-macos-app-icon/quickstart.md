# Quickstart: kiểm tra icon mới

## 1. Sinh icon

```sh
pnpm icons
```

Kỳ vọng: `src-tauri/icons/icon.svg` có `translate(100 100)`; mở `src-tauri/icons/icon.png` thấy lề trong suốt quanh nền bo góc; không có `src-tauri/icons/android` hay `ios`.

## 2. Test tự động

```sh
pnpm test
pnpm typecheck
```

Kỳ vọng: `tests/unit/herdsmanMark.test.tsx` pass (logo là `<img>` trỏ tới file gốc).

## 3. Logo trong app (US2) và favicon (US3)

```sh
pnpm dev   # mở http://localhost:1420/?mock
```

Kỳ vọng: góc trên sidebar là chữ H trên nền tối với chấm xanh lá và vàng; đổi theme sáng/tối vẫn rõ; tab trình duyệt có icon chữ H.

## 4. Dock macOS (US1)

```sh
pnpm tauri build --debug   # hoặc pnpm tauri dev
```

Mở app, so icon trên Dock với Finder/Safari/Terminal: nền bo góc cùng kích cỡ (SC-001). Nếu Dock vẫn hiện icon cũ: `killall Dock`.
