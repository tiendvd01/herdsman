# Quickstart

## Kiểm thử tự động

```sh
pnpm --dir sidecar test
pnpm test
pnpm typecheck
```

Contract test kiểm tra hai nguồn, liên kết, tên trùng, cách gọi bằng tay, lỗi khi nguồn biến mất, phân biệt workspace và chính sách duyệt. Test Composer kiểm tra cả thao tác chọn và gõ trực tiếp.

## Kết quả xác minh ngày 2026-11-27

- Sidecar đạt 43/43 test. Frontend đạt 358/358 test. TypeScript kiểm tra thành công.
- Codex App Server 0.172.0 liệt kê đúng một mục `speckit-specify` trong repo Herdsman. Với một skill mẫu chỉ có trong `.claude/skills`, App Server đưa nội dung `SKILL.md` vào yêu cầu của lượt và hoàn tất lượt qua nhà cung cấp kiểm thử trên loopback.
- Nghiệm thu bằng GUI Tauri và bài thử thời gian với 5 developer trong SC-004 còn chờ thực hiện.

## Nghiệm thu trên Herdsman

1. Chạy `pnpm tauri dev` và tạo session Codex trong Herdsman. Gõ `/speckit-specify` và kiểm tra menu chỉ có một mục tương ứng.
2. Trong repo thử nghiệm, dùng skill có tên như `local-probe` với hướng dẫn trả về một chuỗi dễ nhận biết. Thử lần lượt với `.agents/skills`, `.claude/skills` và liên kết giữa hai thư mục. Chọn qua menu rồi thử gõ `$local-probe` kèm một yêu cầu. Cả hai lượt phải áp dụng đúng nội dung.
3. Tạo worktree với cùng tên skill và chuỗi kết quả khác. Gọi trong cả hai session, đổi tab, đóng và mở lại Herdsman rồi gọi lại. Mỗi session dùng đúng phiên bản trong thư mục riêng.
4. Chọn một skill trong ô soạn tin, xóa tệp skill thử nghiệm và gửi. Kiểm tra lỗi hiện tên skill và lý do. Gửi yêu cầu thường tiếp theo để kiểm tra session còn dùng được.
5. Gọi skill thử nghiệm có thao tác cần quyền. Đóng app tại lúc chờ duyệt, mở lại và từ chối. Kiểm tra yêu cầu còn chờ và thao tác bị từ chối.
