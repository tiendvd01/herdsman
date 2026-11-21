// contracts/sidecar-socket.md — test 3; FR-021, FR-022a, FR-023
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client, startSidecar, tmpDataDir } from './helpers.mjs';

test('permission_request chờ khi không có app, nối lại vẫn nhận và allow cho agent chạy tiếp', async () => {
  const sc = await startSidecar({ dataDir: tmpDataDir() });
  try {
    const a = await Client.connect(sc.sock);
    await a.hello();
    await a.subscribe(0);
    a.send({ cmd: 'prompt', text: 'hãy edit README' });
    await a.waitFor((e) => e.type === 'user_message');
    a.sock.destroy(); // "tắt app"

    await new Promise((r) => setTimeout(r, 1500)); // agent phải đứng chờ, không tự hết hạn
    const b = await Client.connect(sc.sock);
    const hello = await b.hello();
    assert.equal(hello.status, 'blocked');
    await b.subscribe(0);
    const req = await b.waitFor((e) => e.type === 'permission_request');
    assert.equal(req.tool, 'Edit');
    assert.ok(req.input.old_string !== undefined, 'có dữ liệu để dựng diff');
    assert.ok(!b.events.some((e) => e.type === 'permission_resolved' && e.id === req.id), 'chưa bị tự giải quyết');

    b.send({ cmd: 'permission_response', id: req.id, decision: 'allow' });
    const res = await b.waitFor((e) => e.type === 'tool_result');
    assert.equal(res.is_error, false);
    await b.waitFor((e) => e.type === 'turn_end');
    b.close();
  } finally {
    await sc.stop();
  }
});

test('deny → tool không chạy; id lạ → unknown_request', async () => {
  const sc = await startSidecar({ dataDir: tmpDataDir() });
  try {
    const c = await Client.connect(sc.sock);
    await c.hello();
    await c.subscribe(0);
    c.send({ cmd: 'permission_response', id: 'nope', decision: 'allow' });
    const err = await c.waitFor((e) => e.type === 'error');
    assert.equal(err.code, 'unknown_request');
    c.send({ cmd: 'prompt', text: 'chạy bash' });
    const req = await c.waitFor((e) => e.type === 'permission_request');
    c.send({ cmd: 'permission_response', id: req.id, decision: 'deny' });
    const res = await c.waitFor((e) => e.type === 'tool_result');
    assert.equal(res.is_error, true);
    c.close();
  } finally {
    await sc.stop();
  }
});

test('chế độ accept_edits: Edit không hỏi, Bash vẫn hỏi', async () => {
  const sc = await startSidecar({ dataDir: tmpDataDir() });
  try {
    const c = await Client.connect(sc.sock);
    await c.hello();
    await c.subscribe(0);
    c.send({ cmd: 'set_permission_mode', mode: 'accept_edits' });
    await c.waitFor((e) => e.type === 'permission_mode_changed');
    c.send({ cmd: 'prompt', text: 'edit rồi bash' });
    const req = await c.waitFor((e) => e.type === 'permission_request');
    assert.equal(req.tool, 'Bash');
    const edit = c.events.find((e) => e.type === 'tool_result' && e.tool_use_id.endsWith('Edit'));
    assert.equal(edit?.is_error, false);
    c.close();
  } finally {
    await sc.stop();
  }
});
