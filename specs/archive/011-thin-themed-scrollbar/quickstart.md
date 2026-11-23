# Quickstart: kiểm tra thanh cuộn mảnh

## Tự động

```bash
pnpm test -- scrollbar     # token có mặt, tương phản ≥ 3:1, quy tắc mảnh
pnpm typecheck
```

## Bằng mắt (`?mock` + Playwright)

1. `pnpm dev`, mở `http://localhost:<port>/?mock`.
2. Light: cuộn sidebar, khung chat, khối code dài, diff → thanh cuộn mảnh (~4px thấy được), xám đậm hơn nền, không mũi tên.
3. Rê chuột lên thumb → đậm hơn.
4. ⌘⇧L sang Dark → thumb xám sáng trên nền tối, đổi ngay.
5. Mở panel Log (nền tối) khi app đang Light → thumb vẫn thấy rõ.
6. Dải tab session tràn ngang → vẫn không có thanh cuộn.
