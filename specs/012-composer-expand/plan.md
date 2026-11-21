# Implementation Plan: Nút mở rộng ô chat để soạn text dài

**Branch**: `012-composer-expand` | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

## Summary

Thêm state `expanded` vào `Composer`. Nút icon `Maximize2` / `Minimize2` (lucide) đặt ngay sau nút đính kèm ảnh, bọc `Tooltip`, có `aria-label` "Expand editor"/"Collapse editor" và `aria-pressed`. Khi mở rộng, textarea bỏ `field-sizing-content` + `max-h-60` và dùng chiều cao cố định `h-[65vh]` (cuộn bên trong); thanh công cụ nằm dưới nên luôn hiện. Esc khi mở rộng (không có danh sách `/`) thu nhỏ thay vì interrupt. Gửi thành công → thu nhỏ. Toggle xong trả focus về textarea. Không đổi backend.

## Technical Context

**Language/Version**: TypeScript 5, React 18, Tailwind v4
**Primary Dependencies**: `lucide-react` (đã có `Maximize2`, `Minimize2`); không thêm dependency.
**Storage**: không (state cục bộ trong component).
**Testing**: Vitest + Testing Library (`tests/unit/composerExpand.test.tsx`); kiểm UI bằng `?mock` + Playwright.
**Target Platform**: Tauri 2 / WKWebView macOS.
**Performance Goals**: toggle tức thì (một re-render).
**Scope**: chỉ `src/components/composer/Composer.tsx` + test + một dòng BR-001.

## Constitution Check

- I (agent sống độc lập): thuần UI; app tắt giữa chừng chỉ mất trạng thái mở rộng, agent không bị ảnh hưởng — PASS.
- II (không mất hội thoại): không đụng event log; nội dung soạn giữ nguyên khi toggle — PASS.
- III (kiểm soát agent): Esc ở chế độ mở rộng thu nhỏ thay vì interrupt, nhưng nút "Interrupt turn" vẫn luôn hiện và Esc lần sau vẫn interrupt — PASS.
- IV (hiển thị không chậm): không listener mới — PASS.
- V (tương thích): không liên quan — PASS.
- VI (giữ đơn giản): một boolean state, không dialog/component mới — PASS.

Post-design re-check: PASS.

## Design

- `const [expanded, setExpanded] = useState(false)`; `useEffect(() => setExpanded(false), [session.id])` để session khác mở ở trạng thái thường (FR-010).
- `toggleExpanded()`: đảo state rồi `ta.current?.focus()` (FR-004). Textarea không bị remount nên nội dung và con trỏ giữ nguyên.
- Textarea class: thường `max-h-60 field-sizing-content`; mở rộng `h-[65vh] shrink`. Khi mở rộng, wrapper Composer đổi `shrink-0` → `min-h-0 shrink` và khung viền thêm `min-h-0`, nên khi khung hội thoại thấp (có thẻ xin quyền, cửa sổ 600px) textarea tự co lại và thanh công cụ không bị đẩy khỏi màn hình (FR-002, edge case cửa sổ thấp). Phát hiện khi kiểm tra bằng Playwright.
- Nút: `<Button variant="ghost" size="icon" aria-label=... aria-pressed={expanded} disabled={disabled}>` trong `<Tooltip content=...>`, đặt sau nút Paperclip (FR-001, FR-003, FR-008, FR-009).
- `onKeyDown` Escape: nhánh slash giữ nguyên trước; sau đó `else if (expanded) setExpanded(false)`; cuối cùng `else if (working) interrupt()` (FR-005).
- `send()`: sau khi gửi thành công gọi `setExpanded(false)`; nhánh lỗi không đổi (FR-006).
- Enter/Shift+Enter không đổi (FR-007).

## Project Structure

```text
src/components/composer/Composer.tsx    # state expanded, nút, Esc, send
tests/unit/composerExpand.test.tsx      # mới
specs/business-requirement/BR-001.md    # F4 thêm "mở rộng ô chat"
```

## Complexity Tracking

Không có.
