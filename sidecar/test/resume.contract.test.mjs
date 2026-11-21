// contracts/sidecar-socket.md — test 4; constitution II (seq không reset khi resume)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client, startSidecar, tmpDataDir } from './helpers.mjs';

test('sidecar chết rồi chạy lại: seq tiếp tục, engine session id giữ nguyên', async () => {
  const dataDir = tmpDataDir();
  let sc = await startSidecar({ dataDir });
  const a = await Client.connect(sc.sock);
  await a.hello();
  await a.subscribe(0);
  a.send({ cmd: 'prompt', text: 'lượt một' });
  await a.waitFor((e) => e.type === 'turn_end');
  await a.waitFor((e) => e.type === 'status' && e.state === 'idle' && e.seq > 3);
  const engineId = (await a.waitFor((e) => e.type === 'engine_session')).engine_session_id;
  const lastSeq = Math.max(...a.events.filter((e) => typeof e.seq === 'number').map((e) => e.seq));
  await sc.stop(); // crash

  sc = await startSidecar({ dataDir });
  try {
    const b = await Client.connect(sc.sock);
    const hello = await b.hello();
    assert.equal(hello.engine_session_id, engineId);
    await b.subscribe(lastSeq);
    const started = await b.waitFor((e) => e.type === 'session_started');
    assert.equal(started.seq, lastSeq + 1);
    assert.equal(started.resumed, true);
    b.close();
  } finally {
    await sc.stop();
  }
});
