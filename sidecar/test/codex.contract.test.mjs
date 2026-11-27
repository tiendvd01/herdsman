import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { test } from 'node:test';
import { Client, startSidecar, tmpDataDir } from './helpers.mjs';
import { probeCodex } from '../src/engines/codex.mjs';

const fixture = `
import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
const cwd = process.cwd();
const thread = {
  id: 'thread-from-cli', cwd, name: 'CLI conversation', preview: 'Old prompt', updatedAt: 1700000000,
  turns: [{ id: 'old-turn', items: [
    { type: 'userMessage', id: 'old-user', content: [{ type: 'text', text: 'Old prompt' }] },
    { type: 'agentMessage', id: 'old-reply', text: 'Old reply' },
  ] }],
};
const outside = { id: 'other', cwd: '/', preview: 'Outside prompt', updatedAt: 1700000001, status: { type: 'active' }, turns: [] };
let turn = 0;
let extraRoots = [];
const skillAt = (root, scope) => {
  try {
    const file = fs.realpathSync(path.join(root, 'SKILL.md'));
    const body = fs.readFileSync(file, 'utf8');
    const name = body.match(/^name: (.+)$/m)?.[1];
    const description = body.match(/^description: (.+)$/m)?.[1];
    return name && description ? [{ name, description, path: file, scope, enabled: name !== 'disabled-skill', pluginId: null }] : [];
  } catch { return []; }
};
const skillsIn = (root, scope) => !fs.existsSync(root) ? [] : fs.readdirSync(root).flatMap((name) =>
  skillAt(path.join(root, name), scope));
const textId = (text, turn) => text === 'show permissions' ? 'permissions-' + process.pid + '-' + turn : 'item-' + turn;
const send = (message) => console.log(JSON.stringify(message));
const notify = (method, params) => send({ method, params: { threadId: thread.id, ...params } });
const complete = (status) => notify('turn/completed', { turn: { id: String(turn), status } });
readline.createInterface({ input: process.stdin }).on('line', (line) => {
  const msg = JSON.parse(line);
  if (fs.existsSync(path.join(cwd, 'record-probe'))) fs.appendFileSync(path.join(cwd, 'record-probe'), msg.method + '\\n');
  const result = (value = {}) => send({ id: msg.id, result: value });
  switch (msg.method) {
    case 'initialize': result(); break;
    case 'account/read': result({ requiresOpenaiAuth: true, account: { type: 'chatgpt' } }); break;
    case 'account/rateLimits/read': result({ rateLimits: {
      primary: { usedPercent: 41, windowDurationMins: 300, resetsAt: 1900000000 },
      secondary: { usedPercent: 6 + turn, windowDurationMins: 10080 },
    } }); break;
    case 'thread/list': {
      if (msg.params.currentAccountOnly !== true || msg.params.archived !== false || msg.params.sourceKinds.join(',') !== 'cli,exec') {
        send({ id: msg.id, error: { code: -32602, message: 'Expected current account CLI scope' } });
      } else if (!msg.params.cwd) {
        result(msg.params.cursor ? { data: [outside], nextCursor: null } : { data: [thread], nextCursor: 'next' });
      } else {
        result({ data: [thread, outside], nextCursor: null });
      }
      break;
    }
    case 'thread/read': result({ thread: msg.params.threadId === outside.id ? outside : thread }); break;
    case 'skills/extraRoots/set': extraRoots = msg.params.extraRoots; result(); break;
    case 'skills/list': result({ data: [{ cwd: msg.params.cwds[0], skills: [
      ...extraRoots.flatMap((root) => skillAt(root, 'user')),
      ...skillsIn(path.join(msg.params.cwds[0], '.agents/skills'), 'repo'),
    ] }] }); break;
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
      const hasSkill = msg.params.input.some((part) => part.type === 'skill');
      const itemId = hasSkill ? 'skill-' + process.pid + '-' + turn : textId(msg.params.input[0].text, turn);
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
      if (text === 'approve command' || text === '$claude-only approve') {
        send({ id: 'command', method: 'item/commandExecution/requestApproval', params: {
          threadId: thread.id, itemId, command: 'printf test', cwd,
        } });
      } else if (text === 'approve edit') {
        notify('item/started', { item: { type: 'fileChange', id: itemId, changes: [{ path: 'demo.md', diff: '-before\\n+after' }] } });
        send({ id: 'edit', method: 'item/fileChange/requestApproval', params: { threadId: thread.id, itemId } });
      } else if (text === 'show permissions' || hasSkill) {
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

test('Codex can list and read CLI history without opening a thread', async (t) => {
  const cwd = fs.realpathSync(tmpDataDir());
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const binary = path.join(cwd, 'codex-fixture');
  fs.writeFileSync(binary, '#!/bin/sh\nexec "' + process.execPath + '" "' + binary + '.mjs" "$@"\n', { mode: 0o700 });
  fs.writeFileSync(binary + '.mjs', fixture);
  const log = path.join(cwd, 'record-probe');
  fs.writeFileSync(log, '');

  assert.deepEqual(await probeCodex(binary, cwd, 'history'), [
    { id: 'thread-from-cli', cwd, name: 'CLI conversation', preview: 'Old prompt', updated_at: 1700000000000 },
    { id: 'other', cwd: '/', name: '', preview: 'Outside prompt', updated_at: 1700000001000 },
  ]);
  assert.deepEqual(await probeCodex(binary, cwd, 'history-read', 'thread-from-cli', cwd), [
    { role: 'user', text: 'Old prompt' }, { role: 'assistant', text: 'Old reply' },
  ]);
  assert.deepEqual(await probeCodex(binary, cwd, 'history-read', 'other', '/'), []);
  await assert.rejects(probeCodex(binary, cwd, 'history-read', 'other', cwd), /no longer available/);
  await assert.rejects(probeCodex(binary, cwd, 'history-read', 'foreign-account', cwd), /no longer available/);
  assert.deepEqual(fs.readFileSync(log, 'utf8').split('\n').filter((method) => method.startsWith('thread/')), [
    'thread/list', 'thread/list', 'thread/list', 'thread/read', 'thread/list', 'thread/read', 'thread/list', 'thread/list',
  ]);
});

test('Codex lists and invokes readable project skills by workspace and path', async (t) => {
  const dataDir = fs.realpathSync(tmpDataDir());
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }));
  const binary = path.join(dataDir, 'codex-fixture');
  fs.writeFileSync(binary, `#!/bin/sh\nexec "${process.execPath}" "${binary}.mjs" "$@"\n`, { mode: 0o700 });
  fs.writeFileSync(binary + '.mjs', fixture);
  const main = path.join(dataDir, 'main');
  const worktree = path.join(dataDir, 'worktree');
  const empty = path.join(dataDir, 'empty');
  fs.mkdirSync(empty);

  function skill(workspace, root, name, description) {
    const dir = path.join(workspace, root, 'skills', name);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'SKILL.md');
    fs.writeFileSync(file, `---\nname: ${name}\ndescription: ${description}\n---\nTest instruction.\n`);
    return file;
  }
  const native = skill(main, '.agents', 'shared', 'Main native definition');
  skill(main, '.claude', 'shared', 'Lower priority definition');
  const claude = skill(main, '.claude', 'claude-only', 'Claude definition');
  const linked = skill(main, '.claude', 'linked', 'Linked definition');
  fs.symlinkSync(path.dirname(linked), path.join(main, '.agents/skills/linked'));
  fs.symlinkSync('missing-dir', path.join(main, '.agents/skills/broken'));
  skill(main, '.agents', 'disabled-skill', 'Disabled definition');

  const alternate = skill(worktree, '.claude', 'shared', 'Worktree definition');
  const external = skill(main, '.claude', 'outside', 'Outside definition');
  fs.symlinkSync(path.dirname(external), path.join(worktree, '.claude/skills/outside'));
  fs.mkdirSync(path.join(worktree, '.agents/skills'), { recursive: true });
  fs.symlinkSync(path.dirname(linked), path.join(worktree, '.agents/skills/linked'));

  let req = 0;
  async function withSession(cwd, sid, run) {
    const sidecar = await startSidecar({ dataDir, sid, cwd, codexBinary: binary, engine: 'codex' });
    let client;
    try {
      client = await Client.connect(sidecar.sock);
      await client.hello();
      await client.subscribe(0);
      await run(client, sidecar.sock);
    } catch (error) {
      throw new Error(`Codex session ${sid}: ${JSON.stringify(client?.events.slice(-8))}`, { cause: error });
    } finally {
      client?.close();
      await sidecar.stop();
    }
  }
  async function commands(client) {
    const id = ++req;
    client.send({ cmd: 'list_commands', req: id });
    const reply = await client.waitFor((e) => e.req === id);
    assert.equal(reply.type, 'commands', JSON.stringify(reply));
    assert.equal(new Set(reply.commands.map(({ name }) => name)).size, reply.commands.length);
    return Object.fromEntries(reply.commands.map(({ name, description }) => [name, description]));
  }
  async function prompt(client, text, images = []) {
    client.send({ cmd: 'prompt', text, images });
    const user = await client.waitFor((e) => e.type === 'user_message' && e.text === text);
    const reply = await client.waitFor((e) => e.type === 'assistant_message' && e.seq > user.seq);
    return reply.blocks[0].text;
  }
  async function invoke(client, text, file, name, images = []) {
    const params = JSON.parse(await prompt(client, text, images));
    assert.equal(params.input[0].text, text);
    assert.deepEqual(params.input.find((part) => part.type === 'skill'), { type: 'skill', name, path: file });
    assert.equal(params.approvalPolicy, 'on-request');
    assert.equal(params.sandboxPolicy.type, 'readOnly');
    return params.input;
  }
  await withSession(main, 'main', async (client, sock) => {
    assert.deepEqual(await commands(client), {
      compact: 'Compact context', shared: 'Main native definition', 'claude-only': 'Claude definition', linked: 'Linked definition',
      outside: 'Outside definition',
    });
    await invoke(client, '$shared from picker', native, 'shared');
    await invoke(client, '/linked by hand', linked, 'linked');
    const image = { media_type: 'image/png', data_b64: 'aW1hZ2U=' };
    const input = await invoke(client, '$claude-only with attachment', claude, 'claude-only', [image]);
    assert.deepEqual(input.find((part) => part.type === 'image'), { type: 'image', url: 'data:image/png;base64,aW1hZ2U=' });

    client.send({ cmd: 'prompt', text: '$claude-only approve' });
    const request = await client.waitFor((e) => e.type === 'permission_request');
    const reconnected = await Client.connect(sock);
    try {
      await reconnected.hello();
      await reconnected.subscribe(0);
      const pending = await reconnected.waitFor((e) => e.type === 'permission_request');
      assert.equal(pending.id, request.id);
      reconnected.send({ cmd: 'permission_response', id: pending.id, decision: 'deny' });
      await reconnected.waitFor((e) => e.type === 'assistant_message' && e.blocks[0].text === 'decline');
    } finally {
      reconnected.close();
    }

    client.send({ cmd: 'set_permission_mode', mode: 'custom' });
    await client.waitFor((e) => e.type === 'permission_mode_changed' && e.mode === 'custom');
    const params = JSON.parse(await prompt(client, '$claude-only after permission reset'));
    assert.deepEqual(params.input.at(-1), { type: 'skill', name: 'claude-only', path: claude });
    assert.equal(params.sandboxPolicy, undefined);

    fs.unlinkSync(claude);
    assert.match(await prompt(client, '$claude-only after removal'), /claude-only.*no longer available/i);
    assert.equal(await prompt(client, 'ordinary prompt after removal'), 'Final reply');
  });
  await withSession(worktree, 'tree', async (client) => {
    await invoke(client, '$shared in worktree', alternate, 'shared');
    assert.deepEqual(await commands(client), { compact: 'Compact context', shared: 'Worktree definition' });
    assert.match(await prompt(client, '$linked from the other workspace'), /linked.*outside the workspace/);
  });
  skill(worktree, '.claude', 'shared', 'Updated worktree definition');
  await withSession(worktree, 'tree', async (client) => {
    assert.deepEqual(await commands(client), { compact: 'Compact context', shared: 'Updated worktree definition' });
    await invoke(client, '$shared after resume', alternate, 'shared');
  });
  await withSession(empty, 'empty', async (client) => {
    assert.deepEqual(await commands(client), { compact: 'Compact context' });
    assert.equal(await prompt(client, 'ordinary prompt in empty workspace'), 'Final reply');
  });
});

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
    assert.equal(updated.context_pct, undefined);
    client.send({ cmd: 'account_usage', req: 42 });
    const refreshed = await client.waitFor((e) => e.type === 'account_usage' && e.req === 42);
    assert.equal(refreshed.usage.limits.seven_day.pct, 7);
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
