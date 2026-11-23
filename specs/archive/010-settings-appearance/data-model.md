# Data Model: Settings — Appearance

## AppearancePrefs (trong `useUiStore`, persist key `herdsman-ui`, version 3)

| Field | Type | Default | Ghi chú |
|-------|------|---------|---------|
| `theme` | `'system' \| 'light' \| 'dark'` | `'system'` | đã có |
| `uiFont` | `string`: id preset hoặc `family:<tên>` | `'geist'` | id lạ → mặc định |
| `codeFont` | `string`: id preset hoặc `family:<tên>` | `'geist-mono'` | id lạ → mặc định |

Transient (không persist): `settingsOpen: boolean`.

## FontOption

| Field | Type | Ví dụ |
|-------|------|-------|
| `id` | string | `'sf-mono'` |
| `label` | string | `'SF Mono'` |
| `family` | string \| null | `'SF Mono'` (null = generic hệ thống) |
| `bundled` | boolean | `true` cho Geist / Geist Mono |

`stack` = `"<family>", <default stack>` → luôn rơi về Geist/Geist Mono rồi generic.

## Migration v2 → v3
Thêm `uiFont = 'geist'`, `codeFont = 'geist-mono'` nếu chưa có.
