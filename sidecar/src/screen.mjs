// In hội thoại dạng chữ dễ đọc ra terminal, để `hc read` / `hc attach` vẫn có ý nghĩa.
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function short(value, max = 160) {
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export function printEvent(ev) {
  const out = process.stdout;
  switch (ev.type) {
    case 'session_started':
      out.write(`${DIM}── herdsman-agent · ${ev.engine} · ${ev.cwd} · mode=${ev.permission_mode}${ev.resumed ? ' · resumed' : ''}${RESET}\n`);
      break;
    case 'user_message':
      out.write(`\n${BOLD}${CYAN}› ${ev.text}${RESET}\n`);
      break;
    case 'assistant_message':
      for (const b of ev.blocks) {
        if (b.kind === 'text') out.write(`\n${b.text}\n`);
        else if (b.kind === 'thinking') out.write(`${DIM}(thinking) ${short(b.text, 200)}${RESET}\n`);
      }
      break;
    case 'tool_use':
      out.write(`${YELLOW}⏺ ${ev.tool}${RESET} ${DIM}${short(ev.input)}${RESET}\n`);
      break;
    case 'tool_result':
      if (ev.is_error) out.write(`${RED}  ✗ ${short(ev.content)}${RESET}\n`);
      break;
    case 'permission_request':
      out.write(`${YELLOW}? Awaiting approval: ${ev.tool}${RESET}\n`);
      break;
    case 'permission_resolved':
      out.write(`${DIM}  → ${ev.decision}${RESET}\n`);
      break;
    case 'turn_end':
      out.write(`${DIM}── turn complete${ev.interrupted ? ' (interrupted)' : ''}${RESET}\n`);
      break;
    case 'error':
      out.write(`${RED}! ${ev.message}${RESET}\n`);
      break;
    default:
  }
}
