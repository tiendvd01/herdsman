// Nhận text từ `hc send` (dán + Enter) qua stdin. Bật bracketed paste để text nhiều dòng
// đến nguyên khối; ngoài khối paste, Enter là gửi.
const PASTE_START = '\x1b[200~';
const PASTE_END = '\x1b[201~';

export function listenStdin({ onSubmit, onInterrupt }) {
  const stdin = process.stdin;
  if (!stdin.isTTY) return;
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');
  process.stdout.write('\x1b[?2004h');

  let buf = '';
  let inPaste = false;
  stdin.on('data', (chunk) => {
    let s = chunk;
    while (s.length) {
      if (inPaste) {
        const end = s.indexOf(PASTE_END);
        if (end < 0) {
          buf += s;
          return;
        }
        buf += s.slice(0, end);
        s = s.slice(end + PASTE_END.length);
        inPaste = false;
        continue;
      }
      const start = s.indexOf(PASTE_START);
      const head = start < 0 ? s : s.slice(0, start);
      for (const ch of head) {
        if (ch === '\x03') onInterrupt();
        else if (ch === '\r' || ch === '\n') {
          const text = buf.trim();
          buf = '';
          if (text) onSubmit(text);
        } else if (ch === '\x7f') buf = buf.slice(0, -1);
        else if (ch >= ' ' || ch === '\t') buf += ch;
      }
      if (start < 0) return;
      s = s.slice(start + PASTE_START.length);
      inPaste = true;
    }
  });
}
