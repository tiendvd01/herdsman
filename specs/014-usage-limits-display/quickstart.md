# Quickstart: kiểm chứng

## Tự động
- `pnpm test` — `usageFormat` (ngưỡng, làm tròn, kẹp, reset, stale), store (snapshot → `ctxPct`, `limits` chọn bản mới nhất, replay), `UsageIndicators` (hiển thị, `—`, ẩn khi `limits=null`).

## UI bằng mock (Playwright)
1. `pnpm dev`, mở `http://localhost:1420/?mock`.
2. Mở một session mock → thanh composer hiện `ctx N%  5h N%  7d N%`, không có thanh tiến trình.
3. Mock 3 mức (<80, 85, 97) → màu muted / cảnh báo / nguy hiểm.
4. Session mới chưa gửi gì → `ctx —`.
5. Mock `limits=null` → chỉ còn Context.
6. Chuyển session → 5h/Tuần giữ nguyên, Context đổi.
7. Thu cửa sổ 960×600 → toolbar không vỡ.
8. Header không còn `ctx …`.

## Với app thật (tài khoản đăng ký)
Gửi một tin nhắn → trong vòng 5 giây chỉ số xuất hiện; so với `/usage` và `/context` của Claude Code, lệch ≤ 1%.
