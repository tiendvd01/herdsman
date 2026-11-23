# Data Model: Phím tắt ẩn/hiện hai sidebar

Không có dữ liệu mới. Dùng lại hai trường đã có (và đã persist) trong `useUiStore`:

| Trường | Phím | Action |
|---|---|---|
| `sidebarOpen` | ⌘B | `setSidebarOpen(!sidebarOpen)` |
| `rightOpen` | ⌘R | `setRightOpen(!rightOpen)` |

Độ rộng (`sidebarWidth`, `rightWidth`, spec 004) và tab (`rightTab`) không bị đụng tới khi ẩn/hiện, nên hiện lại giữ nguyên (FR-005).
