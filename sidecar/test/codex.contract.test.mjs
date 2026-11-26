import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { test } from 'node:test';
import { Client, startSidecar, tmpDataDir } from './helpers.mjs';
import { probeCodex } from '../src/engines/codex.mjs';

const fixture = `
import readline from 'node:readline';
const cwd = process.cwd();
const thread = {
  id: 'thread-from-cli', cwd, name: 'CLI conversation',
  turns: [{ id: 'old-turn', items: [
    { type: 'userMessage', id: 'old-user', content: [{ type: 'text', text: 'Old prompt' }] },
    { type: 'agentMessage', id: 'old-reply', text: 'Old reply' },
  ] }],
};
let turn = 0;
const textId = (text, turn) => text === 'show permissions' ? 'permissions-' + process.pid + '-' + turn : 'item-' + turn;
const send = (message) => console.log(JSON.stringify(message));
const notify = (method, params) => send({ method, params: { threadId: thread.id, ...params } });
const complete = (status) => notify('turn/completed', { turn: { id: String(turn), status } });
readline.createInterface({ input: process.stdin }).on('line', (line) => {
  const msg = JSON.parse(line);
  const result = (value = {}) => send({ id: msg.id, result: value });
  switch (msg.method) {
    case 'initialize': result(); break;
    case 'account/read': result({ requiresOpenaiAuth: true, account: { type: 'chatgpt' } }); break;
    case 'account/rateLimits/read': result({ rateLimits: {
      primary: { usedPercent: 41, windowDurationMins: 300, resetsAt: 1900000000 },
      secondary: { usedPercent: 6, windowDurationMins: 10080 },
    } }); break;
    case 'thread/list': result({ data: [thread, { id: 'other', cwd: '/' }], nextCursor: null }); break;
    case 'thread/read': result({ thread }); break;
    case 'thread/start': result({ thread, model: 'test-model' }); break;
    case 'thread/resume':
      if (msg.params.threadId === 'unused-thread') send({ id: msg.id, error: { code: -32602, message: 'no rollout found' } });
      else result({ thread, model: 'test-model' });
      break;
    case 'thread/compact/start':
      result();
      turn++;
      notify('turn/started', { turn: { id: String(turn) } });
      notify('item/completed', { item: { type: 'contextCompaction', id: 'compacted' } });
      complete('completed');
      break;
    case 'turn/start': {
      turn++;
      const itemId = textId(msg.params.input[0].text, turn);
      result({ turn: { id: String(turn) } });
      send({ method: 'account/rateLimits/updated', params: { rateLimits: {
        primary: { usedPercent: 43, windowDurationMins: 300, resetsAt: 1900000000 },
      } } });
      notify('turn/started', { turn: { id: String(turn) } });
      notify('item/agentMessage/delta', { itemId, delta: 'Streaming reply' });
      const text = msg.params.input[0].text;
      if (text === 'measure usage') {
        const first = { inputTokens: 450, cachedInputTokens: 300, outputTokens: 30, totalTokens: 480 };
        const last = { inputTokens: 700, cachedInputTokens: 500, outputTokens: 100, totalTokens: 800 };
        const prior = { inputTokens: 1200, cachedInputTokens: 900, outputTokens: 200, totalTokens: 1400 };
        const sum = (...calls) => Object.fromEntries(Object.keys(first).map((key) => [
          key, calls.reduce((total, call) => total + call[key], 0),
        ]));
        for (const [latest, total] of [[first, sum(prior, first)], [last, sum(prior, first, last)]]) {
          notify('thread/tokenUsage/updated', {
            turnId: String(turn), tokenUsage: { last: latest, total, modelContextWindow: 1000 },
          });
        }
      }
      if (text === 'approve command') {
        send({ id: 'command', method: 'item/commandExecution/requestApproval', params: {
          threadId: thread.id, itemId, command: 'printf test', cwd,
        } });
      } else if (text === 'approve edit') {
        notify('item/started', { item: { type: 'fileChange', id: itemId, changes: [{ path: 'demo.md', diff: '-before\\n+after' }] } });
        send({ id: 'edit', method: 'item/fileChange/requestApproval', params: { threadId: thread.id, itemId } });
      } else if (text === 'show permissions') {
        notify('item/completed', { item: { type: 'agentMessage', id: itemId, text: JSON.stringify({ ...msg.params, serverPid: process.pid }) } });
        complete('completed');
      } else if (text !== 'interrupt') {
        notify('item/completed', { item: { type: 'agentMessage', id: itemId, text: 'Final reply' } });
        complete('completed');
      }
      break;
    }
    case 'turn/interrupt': result(); complete('interrupted'); break;
    default:
      if (msg.result?.decision) {
        notify('item/completed', { item: { type: 'agentMessage', id: 'decision-' + turn, text: msg.result.decision } });
        complete('completed');
      }
  }
});
`;

test('Codex history, live turns, approval reconnect and interrupt use the existing sidecar socket', async (t) => {
  const dataDir = tmpDataDir();
  const binary = path.join(dataDir, 'codex-fixture');
  fs.writeFileSync(binary, `#!/bin/sh\nexec "${process.execPath}" "${binary}.mjs" "$@"\n`, { mode: 0o700 });
  fs.writeFileSync(binary + '.mjs', fixture);
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }));
  assert.deepEqual(await probeCodex(binary, os.tmpdir(), 'list'), [{ id: 'thread-from-cli', name: 'CLI conversation' }]);

  const dir = path.join(dataDir, 'sessions', 's1');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ engine_session_id: 'thread-from-cli' }));
  const start = () => startSidecar({ dataDir, codexBinary: binary, engine: 'codex' });
  const first = await start();
  let client;
  async function attach(from = 0) {
    const socket = await Client.connect(first.sock);
    await socket.hello();
    await socket.subscribe(from);
    return socket;
  }
  try {
    client = await attach();
    await client.waitFor((e) => e.type === 'engine_session' && e.engine_session_id === 'thread-from-cli');
    assert.equal(client.events.filter((e) => e.type === 'user_message' && e.text === 'Old prompt').length, 1);

    const usage = await client.waitFor((e) => e.type === 'usage_snapshot' && e.provider === 'codex');
    assert.deepEqual(usage.limits, {
      five_hour: { pct: 41, resets_at: new Date(1900000000 * 1000).toISOString() },
      seven_day: { pct: 6, resets_at: null },
    });
    client.send({ cmd: 'prompt', text: 'approve command' });
    const updated = await client.waitFor((e) => e.type === 'usage_snapshot' && e.limits?.five_hour?.pct === 43);
    assert.equal(updated.limits.seven_day.pct, 6);
    await client.waitFor((e) => e.type === 'delta' && e.text === 'Streaming reply');
    const request = await client.waitFor((e) => e.type === 'permission_request');
    assert.equal(request.input.command, 'printf test');
    client.close();

    client = await attach();
    assert.equal((await client.waitFor((e) => e.type === 'permission_request')).id, request.id);
    client.send({ cmd: 'permission_response', id: request.id, decision: 'deny' });
    await client.waitFor((e) => e.type === 'assistant_message' && e.blocks[0].text === 'decline');

    client.send({ cmd: 'prompt', text: 'approve edit' });
    const edit = await client.waitFor((e) => e.type === 'permission_request' && e.tool === 'Edit');
    assert.match(edit.input.unified_diff, /-before\n\+after/);
    client.send({ cmd: 'permission_response', id: edit.id, decision: 'allow' });
    await client.waitFor((e) => e.type === 'assistant_message' && e.blocks[0].text === 'accept');

    client.send({ cmd: 'prompt', text: 'interrupt' });
    await client.waitFor((e) => e.type === 'delta' && e.message_id === 'item-3');
    client.send({ cmd: 'interrupt' });
    await client.waitFor((e) => e.type === 'turn_end' && e.interrupted);

    let previousServerPid;
    for (const [mode, expectedPolicy, expectedReviewer, expectedSandbox] of [
      ['auto', 'on-request', 'user', 'workspaceWrite'],
      ['accept_edits', 'on-request', 'auto_review', 'workspaceWrite'],
      ['bypass', 'never', 'user', 'dangerFullAccess'],
      ['custom', undefined, undefined, undefined],
    ]) {
      client.send({ cmd: 'set_permission_mode', mode });
      const changed = await client.waitFor((e) => e.type === 'permission_mode_changed' && e.mode === mode);
      client.send({ cmd: 'prompt', text: 'show permissions' });
      const reply = await client.waitFor((e) => e.type === 'assistant_message' && e.seq > changed.seq);
      const params = JSON.parse(reply.blocks[0].text);
      assert.equal(params.approvalPolicy, expectedPolicy);
      assert.equal(params.approvalsReviewer, expectedReviewer);
      assert.equal(params.sandboxPolicy?.type, expectedSandbox);
      if (mode === 'custom') assert.notEqual(params.serverPid, previousServerPid);
      previousServerPid = params.serverPid;
    }

    client.send({ cmd: 'prompt', text: 'measure usage' });
    const snapshot = await client.waitFor((e) => e.type === 'usage_snapshot' && e.context_pct === 80);
    const measured = await client.waitFor((e) => e.type === 'turn_end' && e.seq > snapshot.seq);
    assert.deepEqual(measured.usage, {
      input_tokens: 1150, cache_read_input_tokens: 800, output_tokens: 130,
    });

    client.send({ cmd: 'prompt', text: '/compact' });
    const compacted = await client.waitFor((e) => e.type === 'usage_snapshot' && e.seq > measured.seq
      && e.context_pct === null && e.limits === null);
    await client.waitFor((e) => e.type === 'turn_end' && e.seq > compacted.seq && !e.is_error);
  } finally {
    client?.close();
    await first.stop();
  }

  const reopened = await start();
  try {
    client = await attach();
    await client.waitFor((e) => e.type === 'engine_session' && e.seq > 10);
    assert.equal(client.events.filter((e) => e.type === 'user_message' && e.text === 'Old prompt').length, 1);
  } finally {
    client?.close();
    await reopened.stop();
  }
});

test('Codex can reopen a local session whose first thread was never saved', async (t) => {
  const dataDir = tmpDataDir();
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }));
  const binary = path.join(dataDir, 'codex-fixture');
  fs.writeFileSync(binary, `#!/bin/sh\nexec "${process.execPath}" "${binary}.mjs" "$@"\n`, { mode: 0o700 });
  fs.writeFileSync(binary + '.mjs', fixture);
  const dir = path.join(dataDir, 'sessions', 's1');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ engine_session_id: 'unused-thread' }));
  const events = [
    { seq: 1, type: 'session_started', resumed: false },
    { seq: 2, type: 'codex_history_imported' },
  ];
  fs.writeFileSync(path.join(dir, 'events.ndjson'), events.map((event) => JSON.stringify(event)).join('\n') + '\n');
  const sidecar = await startSidecar({ dataDir, codexBinary: binary, engine: 'codex' });
  let client;
  try {
    client = await Client.connect(sidecar.sock);
    await client.hello();
    await client.subscribe(0);
    await client.waitFor((event) => event.type === 'engine_session' && event.engine_session_id === 'thread-from-cli');
  } finally {
    client?.close();
    await sidecar.stop();
  }
});
