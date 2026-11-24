// Smoke test Agent SDK (T050): một lượt prompt với Claude thật → assistant_message + turn_end.
// Bỏ qua khi HERDSMAN_SKIP_SMOKE=1 (CI không có tài khoản Claude).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client, startSidecar, tmpDataDir } from './helpers.mjs';

test('Claude Agent SDK trả lời một lượt', { skip: process.env.HERDSMAN_SKIP_SMOKE === '1', timeout: 120000 }, async () => {
  const sc = await startSidecar({ dataDir: tmpDataDir(), engine: 'claude' });
  try {
    const c = await Client.connect(sc.sock);
    await c.hello();
    await c.subscribe(0);
    c.send({ cmd: 'prompt', text: 'Chỉ trả lời đúng một chữ: OK' });
    const end = await c.waitFor((e) => e.type === 'turn_end' || e.type === 'error', 110000);
    assert.equal(end.type, 'turn_end', JSON.stringify(c.events.filter((e) => e.type === 'error')));
    const status = await c.waitFor((e) => e.type === 'status' && e.seq > end.seq, 10000);
    assert.equal(status.state, 'idle');
    assert.equal(status.kind, 'turn_complete');
    const msg = c.events.find((e) => e.type === 'assistant_message');
    assert.ok(msg, 'có assistant_message');
    assert.match(msg.blocks.map((b) => b.text).join(''), /OK/i);
    assert.ok(c.events.some((e) => e.type === 'engine_session' && e.engine_session_id), 'có id session engine');
    assert.ok(c.events.some((e) => e.type === 'delta'), 'có stream delta');
    c.close();
  } finally {
    await sc.stop();
  }
});
