import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/index.mjs');

export function tmpDataDir() {
  // đường dẫn ngắn: giới hạn độ dài Unix socket trên macOS (104 byte)
  return fs.mkdtempSync(path.join('/tmp', 'hsa-'));
}

export async function startSidecar({ dataDir, sid = 's1', mode = 'ask', engine = 'echo', inheritedModel, codexBinary, cwd = os.tmpdir(), projectSkillsPlugin, projectSkillsWarning, mcpServersFile, mcpDeniedFile } = {}) {
  fs.rmSync(path.join(dataDir, 'sock', `${sid}.sock`), { force: true }); // socket cũ của tiến trình đã chết
  const args = [ENTRY, '--session', sid, '--cwd', cwd, '--engine', engine, '--permission-mode', mode, '--data-dir', dataDir];
  if (projectSkillsPlugin) args.push('--project-skills-plugin', projectSkillsPlugin);
  if (projectSkillsWarning) args.push('--project-skills-warning', projectSkillsWarning);
  if (mcpServersFile) args.push('--mcp-servers-file', mcpServersFile);
  if (mcpDeniedFile) args.push('--mcp-denied-file', mcpDeniedFile);
  if (codexBinary) args.push('--codex-binary', codexBinary);
  if (inheritedModel) args.push('--model', inheritedModel, '--inherited-model');
  const child = spawn(process.execPath, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (d) => (stderr += d));
  const sock = path.join(dataDir, 'sock', `${sid}.sock`);
  for (let i = 0; i < 100; i++) {
    if (fs.existsSync(sock)) break;
    await new Promise((r) => setTimeout(r, 30));
  }
  if (!fs.existsSync(sock)) throw new Error('sidecar không mở socket: ' + stderr);
  return {
    child,
    sock,
    stop: () =>
      new Promise((r) => {
        if (child.exitCode !== null) return r();
        child.once('exit', r);
        child.kill('SIGKILL');
      }),
  };
}

export class Client {
  static connect(sockPath) {
    return new Promise((resolve, reject) => {
      const sock = net.createConnection(sockPath, () => resolve(new Client(sock)));
      sock.once('error', reject);
    });
  }
  constructor(sock) {
    this.sock = sock;
    this.events = [];
    this.waiters = [];
    let buf = '';
    sock.setEncoding('utf8');
    sock.on('data', (c) => {
      buf += c;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (!line.trim()) continue;
        this.events.push(JSON.parse(line));
        this.#check();
      }
    });
    this.closed = new Promise((r) => sock.on('close', r));
  }
  send(obj) {
    this.sock.write(JSON.stringify(obj) + '\n');
  }
  #check() {
    for (const w of [...this.waiters]) {
      const ev = this.events.find(w.pred);
      if (ev) {
        this.waiters.splice(this.waiters.indexOf(w), 1);
        w.resolve(ev);
      }
    }
  }
  waitFor(pred, ms = 5000) {
    const found = this.events.find(pred);
    if (found) return Promise.resolve(found);
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout chờ event')), ms);
      this.waiters.push({ pred, resolve: (e) => (clearTimeout(t), resolve(e)) });
    });
  }
  async hello() {
    this.send({ cmd: 'hello', proto: 1 });
    return this.waitFor((e) => e.type === 'hello');
  }
  async subscribe(fromSeq = 0) {
    this.send({ cmd: 'subscribe', from_seq: fromSeq });
    return this.waitFor((e) => e.type === 'live');
  }
  close() {
    this.sock.end();
  }
}
