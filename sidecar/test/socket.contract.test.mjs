// contracts/sidecar-socket.md — test 1, 2, 5
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Client, startSidecar, tmpDataDir } from './helpers.mjs';

const logged = (e) => typeof e.seq === 'number';

test('subscribe phát lại đúng event seq > from_seq rồi live', async () => {
  const sc = await startSidecar({ dataDir: tmpDataDir() });
  try {
    const a = await Client.connect(sc.sock);
    await a.hello();
    await a.subscribe(0);
    a.send({ cmd: 'prompt', text: 'xin chào' });
    await a.waitFor((e) => e.type === 'turn_end');
    const completed = await a.waitFor((e) => e.type === 'status' && e.state === 'idle' && e.seq > 3);
    assert.equal(completed.kind, 'turn_complete');
    const all = a.events.filter(logged);
    const seqs = all.map((e) => e.seq);
    assert.deepEqual(seqs, [...seqs].sort((x, y) => x - y), 'seq tăng dần');
    assert.equal(new Set(seqs).size, seqs.length, 'không trùng');
    a.close();

    const mid = seqs[Math.floor(seqs.length / 2)];
    const b = await Client.connect(sc.sock);
    await b.hello();
    await b.subscribe(mid);
    const replay = b.events.filter(logged).map((e) => e.seq);
    assert.deepEqual(replay, seqs.filter((s) => s > mid));
    b.close();
  } finally {
    await sc.stop();
  }
});

test('ngắt kết nối giữa chừng rồi nối lại từ last_seen_seq không mất event', async () => {
  const sc = await startSidecar({ dataDir: tmpDataDir() });
  try {
    const a = await Client.connect(sc.sock);
    await a.hello();
    await a.subscribe(0);
    a.send({ cmd: 'prompt', text: 'slow chạy chậm để ngắt giữa chừng' });
    await a.waitFor((e) => e.type === 'user_message');
    const lastSeen = Math.max(...a.events.filter(logged).map((e) => e.seq));
    a.sock.destroy();

    await new Promise((r) => setTimeout(r, 300));
    const b = await Client.connect(sc.sock);
    await b.hello();
    await b.subscribe(lastSeen);
    await b.waitFor((e) => e.type === 'turn_end', 15000);
    const seqs = b.events.filter(logged).map((e) => e.seq);
    assert.equal(seqs[0], lastSeen + 1, 'nối tiếp ngay sau last_seen_seq');
    for (let i = 1; i < seqs.length; i++) assert.equal(seqs[i], seqs[i - 1] + 1, 'không có lỗ hổng');
    b.close();
  } finally {
    await sc.stop();
  }
});

test('proto khác bị từ chối và đóng kết nối', async () => {
  const sc = await startSidecar({ dataDir: tmpDataDir() });
  try {
    const c = await Client.connect(sc.sock);
    c.send({ cmd: 'hello', proto: 99 });
    const err = await c.waitFor((e) => e.type === 'error');
    assert.equal(err.code, 'proto_mismatch');
    await c.closed;
  } finally {
    await sc.stop();
  }
});

test('image references and payloads survive a chat disconnect and replay', async () => {
  const dataDir = tmpDataDir();
  const sc = await startSidecar({ dataDir });
  const images = [
    { media_type: 'image/png', data_b64: 'AQID' },
    { media_type: 'image/jpeg', data_b64: 'BAUG' },
  ];
  let first, reopened;
  try {
    first = await Client.connect(sc.sock);
    await first.hello();
    await first.subscribe();
    first.send({ cmd: 'prompt', text: 'slow attached images', images });
    const message = await first.waitFor((event) => event.type === 'user_message');
    first.sock.destroy();
    await first.closed;
    reopened = await Client.connect(sc.sock);
    await reopened.hello();
    await reopened.subscribe();
    const replay = await reopened.waitFor((event) => event.type === 'user_message');
    assert.deepEqual(replay, message);
    assert.equal(new Set(replay.images.map((image) => image.attachment_id)).size, 2);
    for (const [index, image] of replay.images.entries()) {
      assert.equal(image.media_type, images[index].media_type);
      assert.equal(image.data_b64, undefined);
      const file = path.join(dataDir, 'sessions', 's1', 'images', image.attachment_id);
      assert.equal(fs.readFileSync(file, 'utf8'), images[index].data_b64);
    }
    await reopened.waitFor((event) => event.type === 'turn_end', 15000);
  } finally {
    first?.sock.destroy();
    reopened?.sock.destroy();
    await sc.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
