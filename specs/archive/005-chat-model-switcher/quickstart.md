# Quickstart: kiểm tra tính năng đổi model

## Tự động

```sh
pnpm --dir sidecar test               # gồm model.contract.test.mjs (contracts/model-switch.md)
pnpm vitest run                       # modelLabel, sessionStore (model_changed), ModelSwitcher
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tsc --noEmit
```

## UI không cần Tauri (`?mock`)

1. `pnpm dev`, mở `http://localhost:1420/?mock`.
2. Thanh công cụ composer có nút model nằm sau "Ask before editing", hiện "Opus 5.5".
3. Bấm nút: menu liệt kê các model kèm mô tả, model hiện tại có dấu tích.
4. Chọn "Sonnet 5.5": menu đóng, nút và nhãn trên header đổi sang "Sonnet 5.5", hội thoại có notice "Switched model to Sonnet 5.5".
5. Esc khi menu đang mở → menu đóng, model giữ nguyên. Dùng Tab/Enter/mũi tên điều khiển được toàn bộ.

## App thật

1. Tạo session engine **Echo**, mở menu model → thấy "Echo" và "Echo Fast". Chọn "Echo Fast", gửi tin → câu trả lời có dòng `Model | echo-fast`.
2. Gửi `slow ...`, trong lúc đang working thì đổi model → lượt vẫn chạy hết, lượt sau dùng model mới.
3. Đổi model, tắt app, đợi vài giây rồi mở lại → nút vẫn hiện model đã chọn. Gửi tin → dùng đúng model đó.
4. Session Claude: mở menu → danh sách từ Claude Code (Default, Opus, Sonnet, Haiku…). Đổi sang Haiku, gửi tin → `turn_end.model` là id Haiku.
5. Session chạy từ agent bản cũ (không có `list_models`) → nút bị vô hiệu, tooltip "Restart this session to switch models".
