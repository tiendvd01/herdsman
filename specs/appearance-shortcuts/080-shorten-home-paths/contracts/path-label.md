# Hợp đồng nhãn đường dẫn

Với home là `/Users/me` hoặc `/Users/me/`, kết quả phải như sau.

| Đầu vào | Nhãn đầy đủ |
| --- | --- |
| /Users/me | ~ |
| /Users/me/ | ~ |
| /Users/me/.herdr/a b | ~/.herdr/a b |
| /Users/me2/a | /Users/me2/a |
| /Volumes/data/a | /Volumes/data/a |
| src/a | src/a |
| ~/src/a | ~/src/a |

Khi thiếu home, nhãn bằng đầu vào. Chuỗi rỗng cho nhãn rỗng. Nếu home là thư mục gốc, hiển thị chính thư mục đó là `~` và tệp con như `/a` là `~/a`. Áp dụng cắt chữ sau khi tính nhãn. Mọi thao tác trên liên kết nhận đích gốc.
