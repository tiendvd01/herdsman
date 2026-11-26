# Implementation Plan — Highlight code trong Rich Conversation

**Feature** [spec.md](spec.md)

## Summary

Dùng Shiki hiện có cho khối code và diff. Dùng cùng biến cỡ chữ của Settings cho cả dạng tô màu và dạng văn bản thuần.

## Technical Context

React, TypeScript, Shiki, CSS và Vitest trong ứng dụng Tauri. Phạm vi là Markdown, thẻ tool và diff dùng chung. Code tới dần và diff khả dụng ngay khi dữ liệu đến. Tô màu chạy khi nội dung hoàn tất hoặc diff được mở.

## Constitution Check

1. Vòng đời agent và kết nối khi mở lại app đi qua luồng hiện có.
2. Transcript và event log giữ định dạng hiện có. Diff lịch sử hiển thị lại từ input đã lưu.
3. Luồng duyệt quyền và quyết định của người dùng giữ hành vi hiện có.
4. Markdown tiếp tục được sanitize. Shiki nhận mã nguồn dưới dạng văn bản. Diff hiển thị văn bản trước khi có màu. Màu theo theme sáng/tối và dấu dòng phân biệt thay đổi.
5. UI đọc dữ liệu sự kiện đã chuẩn hóa cho cả hai engine.
6. Tận dụng component, Settings và thư viện hiện có.

## Project Structure

- `src/components/conversation` — Nhận diện khối Markdown, tô màu diff và cung cấp đường dẫn tệp.
- `src/components/files` — Tái sử dụng diff tô màu.
- `src/lib/highlightCode.ts` — Nạp WASM tương thích với mục tiêu WebKit.
- `src/styles/globals.css` — Cỡ chữ code thống nhất.
- `tests/unit/render.test.tsx` — Kiểm tra luồng hiển thị Rich Conversation.

## Design

[Research](research.md) · [Data model](data-model.md) · [UI contract](contracts/rich-conversation.md) · [Quickstart](quickstart.md)

Thiết kế thỏa sáu nguyên tắc trên và áp dụng được cho hội thoại mới lẫn lịch sử.
