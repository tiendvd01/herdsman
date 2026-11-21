// Event log append-only NDJSON: {seq, ts, type, ...}. seq tăng dần và không reset khi resume.
import fs from 'node:fs';
import path from 'node:path';

export class EventLog {
  constructor(dir) {
    this.dir = dir;
    fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, 'events.ndjson');
    this.seq = this.#lastSeq();
  }

  #lastSeq() {
    if (!fs.existsSync(this.file)) return 0;
    const text = fs.readFileSync(this.file, 'utf8');
    const lines = text.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line) continue;
      try {
        return JSON.parse(line).seq ?? 0;
      } catch {
        // dòng cuối bị cắt dở (crash giữa lúc ghi): bỏ qua, xét dòng trước
      }
    }
    return 0;
  }

  /** Ghi một event, trả về event đã gán seq. */
  append(type, fields = {}) {
    const event = { seq: ++this.seq, ts: Date.now(), type, ...fields };
    fs.appendFileSync(this.file, JSON.stringify(event) + '\n');
    return event;
  }

  /** Các event có seq > fromSeq (đọc đồng bộ để không lọt event giữa replay và live). */
  readFrom(fromSeq = 0) {
    if (!fs.existsSync(this.file)) return [];
    const out = [];
    for (const line of fs.readFileSync(this.file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const ev = JSON.parse(line);
        if (ev.seq > fromSeq) out.push(ev);
      } catch {
        // bỏ qua dòng hỏng
      }
    }
    return out;
  }
}

/** Metadata của session (id engine để resume), nằm cạnh event log. */
export function readMeta(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  } catch {
    return {};
  }
}

export function writeMeta(dir, meta) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
}
