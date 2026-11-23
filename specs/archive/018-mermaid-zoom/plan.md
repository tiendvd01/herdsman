# Implementation Plan: Zoom Mermaid diagram trong rich conversation

**Branch**: `018-mermaid-zoom` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

## Summary

Thêm nút phóng to trên diagram mermaid đã render; bấm mở một Dialog gần toàn màn hình chứa SVG đã render sẵn (dùng lại chuỗi `svg` từ cache của `Mermaid.tsx`), hỗ trợ zoom (nút, Ctrl/Cmd+wheel, pinch), kéo pan, đặt lại, hiển thị %. Zoom/pan bằng CSS transform trên SVG vector nên không vỡ hình. Không đổi cách render inline.

## Technical Context

**Language/Version**: TypeScript, React 18.3
**Primary Dependencies**: `@radix-ui/react-dialog` (qua `src/components/ui/dialog.tsx`), `lucide-react`, `mermaid` (đã có); không thêm dependency mới
**Storage**: N/A (trạng thái zoom tạm thời, không lưu)
**Testing**: vitest + @testing-library/react (jsdom); kiểm UI qua Playwright với `?mock`
**Target Platform**: desktop app (webview)
**Project Type**: desktop-app (frontend only)
**Performance Goals**: mở khung < 0,5 s; zoom/pan mượt trên diagram 50 node (transform CSS, không re-render mermaid)
**Constraints**: không đổi render lười/cache/lỗi inline; SVG đã qua `securityLevel: strict`
**Scale/Scope**: 1 component mới + sửa `Mermaid.tsx`

## Constitution Check

- I (agent độc lập app): không liên quan, chỉ UI. ✅
- II (không mất dữ liệu): không đụng event log. ✅
- III (quyền kiểm soát): không đụng permission. ✅
- IV (hiển thị giàu, không chậm): giữ render lười; zoom không render lại; SVG đến từ mermaid strict, không thêm HTML thô mới. ✅
- V (engine): không liên quan. ✅

Post-design: vẫn đạt.

## Project Structure

### Documentation

```text
specs/018-mermaid-zoom/
├── plan.md, research.md, data-model.md, quickstart.md
├── contracts/ui-contract.md
└── tasks.md   (do /speckit-tasks tạo)
```

### Source Code

```text
src/components/conversation/
├── Mermaid.tsx            # sửa: thêm nút phóng to, mở viewer
├── MermaidViewer.tsx      # mới: Dialog + zoom/pan
└── mermaidZoom.ts         # mới: hàm thuần (clamp, zoom quanh điểm, fit)
tests/unit/
├── mermaidZoom.test.ts
└── mermaidViewer.test.tsx
```

**Structure Decision**: giữ trong `components/conversation`, tách logic toán zoom thành hàm thuần để test.

## Complexity Tracking

Không có vi phạm.
