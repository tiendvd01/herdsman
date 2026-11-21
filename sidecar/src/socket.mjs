// Server Unix socket NDJSON theo contracts/sidecar-socket.md.
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

export const PROTO = 1;

export class SocketServer {
  /**
   * @param {string} sockPath
   * @param {{log: import('./eventlog.mjs').EventLog, info: () => object, onCommand: (cmd: object) => Promise<object|void>|object|void}} opts
   */
  constructor(sockPath, { log, info, onCommand }) {
    this.sockPath = sockPath;
    this.log = log;
    this.info = info;
    this.onCommand = onCommand;
    this.clients = new Set();
  }

  listen() {
    fs.mkdirSync(path.dirname(this.sockPath), { recursive: true });
    try {
      fs.unlinkSync(this.sockPath);
    } catch {
      // chưa có file socket cũ
    }
    this.server = net.createServer((sock) => this.#accept(sock));
    return new Promise((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(this.sockPath, () => resolve());
    });
  }

  close() {
    for (const c of this.clients) c.sock.destroy();
    this.server?.close();
    try {
      fs.unlinkSync(this.sockPath);
    } catch {
      // đã xoá
    }
  }

  /** Gửi event cho mọi client đã subscribe (live). */
  broadcast(event) {
    const line = JSON.stringify(event) + '\n';
    for (const c of this.clients) if (c.live) c.sock.write(line);
  }

  #accept(sock) {
    const client = { sock, live: false, hello: false };
    this.clients.add(client);
    let buf = '';
    sock.setEncoding('utf8');
    sock.on('data', (chunk) => {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (line) this.#handle(client, line);
      }
    });
    const drop = () => this.clients.delete(client);
    sock.on('close', drop);
    sock.on('error', drop);
  }

  async #handle(client, line) {
    const send = (obj) => client.sock.write(JSON.stringify(obj) + '\n');
    let cmd;
    try {
      cmd = JSON.parse(line);
    } catch {
      return send({ type: 'error', code: 'bad_json' });
    }
    const reqId = cmd.req;
    const reply = (obj) => send(reqId === undefined ? obj : { ...obj, req: reqId });

    if (cmd.cmd === 'hello') {
      if (cmd.proto !== PROTO) {
        reply({ type: 'error', code: 'proto_mismatch', expected: PROTO });
        client.sock.end();
        return;
      }
      client.hello = true;
      return reply({ type: 'hello', proto: PROTO, last_seq: this.log.seq, ...this.info() });
    }
    if (!client.hello) return reply({ type: 'error', code: 'hello_required' });

    if (cmd.cmd === 'subscribe') {
      // Đọc log đồng bộ rồi bật live trong cùng một tick: không lọt event.
      const events = this.log.readFrom(Number(cmd.from_seq) || 0);
      for (const ev of events) client.sock.write(JSON.stringify(ev) + '\n');
      client.live = true;
      return reply({ type: 'live', last_seq: this.log.seq });
    }

    try {
      const res = await this.onCommand(cmd);
      reply(res && res.type ? res : { type: 'ack' });
    } catch (err) {
      reply({ type: 'error', code: err.code || 'failed', message: String(err.message || err) });
    }
  }
}
