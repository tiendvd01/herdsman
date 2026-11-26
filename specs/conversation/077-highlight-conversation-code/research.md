# Research

- Dùng node `pre` để nhận diện code block. Số dòng làm mất phân biệt giữa khối một dòng và code nội tuyến.
- Đưa hiển thị token vào Diff dùng chung. Bộ tô màu diff hiện có tách dòng trước/sau, giữ ngữ cảnh cú pháp từng hunk và cung cấp màu sáng/tối.
- Dùng `--code-content-size` để đồng bộ cả cỡ tùy chỉnh lẫn Default. Áp dụng trực tiếp lên code block và inline code bằng quy tắc chung.
- Dùng WASM Oniguruma đi kèm Shiki qua bộ nạp tài nguyên của Vite. Giữ bộ phân tích cú pháp hiện có và tránh phụ thuộc vào Response.bytes trên WebKit cũ.
