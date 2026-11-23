# Data Model: Usage indicators

## Event `usage_snapshot` (event log, append-only)
| Field | Kiểu | Ghi chú |
|---|---|---|
| `context_pct` | number \| null | % context đã dùng của session, 0–100 (làm tròn khi hiển thị) |
| `limits` | object \| null | null khi tài khoản/engine không có hạn mức |
| `limits.five_hour` / `limits.seven_day` | `{ pct: number\|null, resets_at: string\|null }` \| absent | `resets_at` ISO 8601 |

## Store
- `SessionView.ctxPct: number | null` — theo session, mặc định `null`. Thay `ctxTokens`.
- `useSessionStore.limits: { five_hour?, seven_day?, ts: number } | null` — toàn app; chỉ ghi đè khi snapshot mới có `ts` lớn hơn.

## Quy tắc hiển thị
- `pct` → `Math.round`, kẹp 0–100; `null` → `—`.
- Mức: `<80` bình thường, `80–94` cảnh báo, `≥95` nguy hiểm.
- Hạn mức: `now > resets_at` → `—`; `now - ts > 15 phút` → thêm `~`.
- `limits == null` → không render chỉ số hạn mức.

## Chuyển trạng thái
`turn_end` → (sidecar) lấy số liệu → `usage_snapshot` → store cập nhật → chỉ báo đổi. Session mới: `ctxPct = null` → `—`. Replay event log tái tạo đúng giá trị.
