# Contract: bật tắt server Claude tự nạp

## Tauri command `mcp_native_toggle`

```ts
invoke<void>('mcp_native_toggle', { projectId: string, name: string, enabled: boolean })
```

- `enabled=false` thì thêm dòng vào `project_mcp_disabled`, còn `enabled=true` thì xoá dòng. Lệnh idempotent.
- Lỗi: `not_found` khi project không tồn tại, `mcp_invalid` khi tên không hợp lệ.
- Lệnh không đọc hay ghi `.mcp.json` hoặc `~/.claude.json`.

## `mcp_catalog` (mở rộng)

`native[]` có thêm `enabled: boolean`. Các trường khác giữ nguyên như spec 071.

## Sidecar CLI

```
--mcp-denied-file <path>   # JSON string[]; chỉ truyền khi file tồn tại
```

- Sidecar đọc file mà không xoá. Nội dung hợp lệ (mảng chuỗi khác rỗng) thì đặt `options.settings = { deniedMcpServers: names.map((serverName) => ({ serverName })) }`.
- Đọc lỗi hoặc sai dạng thì không chặn gì và phát `project_skills_warning` với message `Could not load disabled MCP servers for this session`.
- Áp dụng cho cả session mới lẫn resume, vì file được Herdsman giữ trong thư mục session.
