// Báo trạng thái cho hc qua OSC 7501. Cú pháp đã kiểm chứng với hc 0.1.21 (research R10):
//   ESC ] 7501 ; state=<s>[:kind=<k>][:progress=<n>] BEL
// Các trường ngăn bằng ':'; hc đọc state, kind, progress.
const STATES = new Set(['idle', 'working', 'done', 'blocked', 'error']);

export function reportStatus(state, { kind, progress } = {}) {
  if (!STATES.has(state) || !process.stdout.isTTY) return;
  let payload = `state=${state}`;
  if (kind) payload += `:kind=${kind}`;
  if (Number.isInteger(progress)) payload += `:progress=${Math.max(0, Math.min(100, progress))}`;
  process.stdout.write(`\x1b]7501;${payload}\x07`);
}
