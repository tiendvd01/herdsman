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

async function waitForBashOutput(client, marker, fromSeq = 0) {
  const hasOutput = (e) => e.seq > fromSeq && e.type === 'shell_update' && e.output?.includes(marker);
  const first = await client.waitFor((e) => hasOutput(e) || (e.seq > fromSeq && e.type === 'permission_request' && e.tool === 'Bash'), 60000);
  if (first.type === 'shell_update') return first;
  assert.ok(!client.events.some((e) => e.seq > fromSeq && e.type === 'shell_update'));
  client.send({ cmd: 'permission_response', id: first.id, decision: 'allow' });
  return client.waitFor((e) => hasOutput(e) && e.tool_use_id === first.tool_use_id, 10000);
}

test('Claude sends Bash output during execution and replays output after reconnect', { skip: process.env.HERDSMAN_SKIP_SMOKE === '1', timeout: 120000 }, async () => {
  const sc = await startSidecar({ dataDir: tmpDataDir(), engine: 'claude' });
  const clients = [];
  try {
    async function connect(from) {
      const client = await Client.connect(sc.sock);
      clients.push(client);
      await client.hello();
      await client.subscribe(from);
      return client;
    }

    const c = await connect(0);
    c.send({ cmd: 'prompt', text: "Use Bash to run exactly this one foreground command, preserving the failing exit code: printf 'herdsman-start\\n'; sleep 3; printf 'herdsman-away\\n'; sleep 5; printf 'herdsman-error\\n' >&2; exit 3. Do not run any other command." });
    const first = await waitForBashOutput(c, 'herdsman-start');
    assert.ok(!c.events.some((e) => e.type === 'tool_result' && e.tool_use_id === first.tool_use_id));
    c.close();

    await new Promise((resolve) => setTimeout(resolve, 4200));
    const next = await connect(first.seq);
    const away = await next.waitFor((e) => e.type === 'shell_update' && e.output?.includes('herdsman-away'));
    const live = next.events.find((e) => e.type === 'live');
    assert.ok(next.events.indexOf(away) < next.events.indexOf(live), 'output while away arrived during replay');
    const failed = await next.waitFor((e) => e.type === 'shell_update' && e.tool_use_id === first.tool_use_id && e.status === 'failed', 12000);
    const result = await next.waitFor((e) => e.type === 'tool_result' && e.tool_use_id === first.tool_use_id);
    assert.match(result.content, /herdsman-error/);
    next.close();

    const history = await connect(0);
    assert.ok(history.events.some((e) => e.seq === failed.seq));
    assert.ok(history.events.some((e) => e.seq === result.seq));
    const turn = await history.waitFor((e) => e.type === 'turn_end' && e.seq > result.seq, 20000);
    history.send({ cmd: 'prompt', text: "Use Bash to run exactly this one foreground command: printf 'herdsman-success\\n'; sleep 6. Do not run any other command." });
    const firstSuccess = await waitForBashOutput(history, 'herdsman-success', turn.seq);
    assert.notEqual(firstSuccess.tool_use_id, first.tool_use_id);
    await history.waitFor((e) => e.type === 'shell_update' && e.tool_use_id === firstSuccess.tool_use_id && e.status === 'success', 15000);
  } finally {
    for (const c of clients) c.close();
    await sc.stop();
  }
});

test('Claude keeps Bash output when the user interrupts a foreground command', { skip: process.env.HERDSMAN_SKIP_SMOKE === '1', timeout: 90000 }, async () => {
  const sc = await startSidecar({ dataDir: tmpDataDir(), engine: 'claude' });
  let c;
  try {
    c = await Client.connect(sc.sock);
    await c.hello();
    await c.subscribe(0);
    c.send({ cmd: 'prompt', text: "Use Bash to run exactly this one foreground command: printf 'herdsman-before-interrupt\\n'; sleep 25. Do not run any other command." });
    const first = await waitForBashOutput(c, 'herdsman-before-interrupt');
    c.send({ cmd: 'interrupt' });
    await c.waitFor((e) => e.type === 'shell_update' && e.tool_use_id === first.tool_use_id && e.status === 'interrupted', 10000);
    const lastOutput = c.events.filter((e) => e.type === 'shell_update' && e.tool_use_id === first.tool_use_id && typeof e.output === 'string').at(-1);
    assert.match(lastOutput.output, /herdsman-before-interrupt/);
  } finally {
    c?.close();
    await sc.stop();
  }
});
