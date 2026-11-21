// specs/005-chat-model-switcher/contracts/model-switch.md — test 1–6 (+ US2: đổi khi đang chờ quyền)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client, startSidecar, tmpDataDir } from './helpers.mjs';

let reqId = 100;
/** Gửi lệnh có `req` rồi chờ đúng reply của nó. */
function request(c, cmd) {
  const req = ++reqId;
  c.send({ ...cmd, req });
  return c.waitFor((e) => e.req === req, 10000);
}

async function open(dataDir) {
  const sc = await startSidecar({ dataDir });
  const c = await Client.connect(sc.sock);
  await c.hello();
  await c.subscribe(0);
  await c.waitFor((e) => e.type === 'engine_session');
  return { sc, c };
}

const changes = (c) => c.events.filter((e) => e.type === 'model_changed');

test('list_models trả danh sách và model hiện tại', async () => {
  const { sc, c } = await open(tmpDataDir());
  try {
    const res = await request(c, { cmd: 'list_models' });
    assert.equal(res.type, 'models');
    assert.ok(res.models.length >= 2);
    for (const m of res.models) {
      assert.equal(typeof m.value, 'string');
      assert.equal(typeof m.display_name, 'string');
    }
    assert.equal(res.current, 'echo');
  } finally {
    c.sock.destroy();
    await sc.stop();
  }
});

test('set_model ghi model_changed và lượt sau dùng model mới', async () => {
  const { sc, c } = await open(tmpDataDir());
  try {
    const ack = await request(c, { cmd: 'set_model', model: 'echo-fast' });
    assert.equal(ack.type, 'ack');
    const ev = await c.waitFor((e) => e.type === 'model_changed');
    assert.equal(typeof ev.seq, 'number');
    assert.equal(ev.model, 'echo-fast');
    assert.equal(ev.previous, 'echo');
    c.send({ cmd: 'prompt', text: 'xin chào' });
    const end = await c.waitFor((e) => e.type === 'turn_end');
    assert.equal(end.model, 'echo-fast');
    const msg = c.events.find((e) => e.type === 'assistant_message');
    assert.match(msg.blocks[0].text, /\| Model \| echo-fast \|/);
    assert.equal((await request(c, { cmd: 'list_models' })).current, 'echo-fast');
  } finally {
    c.sock.destroy();
    await sc.stop();
  }
});

test('set_model trùng model hiện tại: ack, không ghi event', async () => {
  const { sc, c } = await open(tmpDataDir());
  try {
    assert.equal((await request(c, { cmd: 'set_model', model: 'echo' })).type, 'ack');
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(changes(c).length, 0);
  } finally {
    c.sock.destroy();
    await sc.stop();
  }
});

test('set_model rỗng: lỗi bad_model, không ghi event', async () => {
  const { sc, c } = await open(tmpDataDir());
  try {
    for (const model of ['', '   ', null, 42]) {
      const res = await request(c, { cmd: 'set_model', model });
      assert.equal(res.type, 'error');
      assert.equal(res.code, 'bad_model');
    }
    assert.equal(changes(c).length, 0);
  } finally {
    c.sock.destroy();
    await sc.stop();
  }
});

test('đổi model rồi sidecar chết, chạy lại: vẫn dùng model đã chọn', async () => {
  const dataDir = tmpDataDir();
  let { sc, c } = await open(dataDir);
  await request(c, { cmd: 'set_model', model: 'echo-fast' });
  await c.waitFor((e) => e.type === 'model_changed');
  c.sock.destroy();
  await sc.stop();

  ({ sc, c } = await open(dataDir));
  try {
    const started = c.events.filter((e) => e.type === 'session_started').at(-1);
    assert.equal(started.model, 'echo-fast');
    c.send({ cmd: 'prompt', text: 'sau khi chạy lại' });
    const end = await c.waitFor((e) => e.type === 'turn_end');
    assert.equal(end.model, 'echo-fast');
  } finally {
    c.sock.destroy();
    await sc.stop();
  }
});

test('đổi model khi đang chạy: lượt hiện tại không bị ngắt', async () => {
  const { sc, c } = await open(tmpDataDir());
  try {
    c.send({ cmd: 'prompt', text: 'slow chạy chậm' });
    await c.waitFor((e) => e.type === 'status' && e.state === 'working');
    assert.equal((await request(c, { cmd: 'set_model', model: 'echo-fast' })).type, 'ack');
    const end = await c.waitFor((e) => e.type === 'turn_end', 15000);
    assert.equal(end.interrupted, false);
    c.send({ cmd: 'prompt', text: 'lượt sau' });
    const end2 = await c.waitFor((e) => e.type === 'turn_end' && e.seq > end.seq, 15000);
    assert.equal(end2.model, 'echo-fast');
  } finally {
    c.sock.destroy();
    await sc.stop();
  }
});

test('đổi model khi đang chờ quyền: yêu cầu quyền vẫn duyệt được', async () => {
  const { sc, c } = await open(tmpDataDir());
  try {
    c.send({ cmd: 'prompt', text: 'please edit' });
    const req = await c.waitFor((e) => e.type === 'permission_request');
    assert.equal((await request(c, { cmd: 'set_model', model: 'echo-fast' })).type, 'ack');
    assert.equal((await request(c, { cmd: 'permission_response', id: req.id, decision: 'allow' })).type, 'ack');
    const resolved = await c.waitFor((e) => e.type === 'permission_resolved' && e.id === req.id);
    assert.equal(resolved.decision, 'allow');
    await c.waitFor((e) => e.type === 'turn_end');
  } finally {
    c.sock.destroy();
    await sc.stop();
  }
});
