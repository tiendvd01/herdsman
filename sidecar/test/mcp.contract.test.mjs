// spec 071: MCP servers reach Claude through a short-lived 0600 file, never through argv.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createClaudeEngine } from '../src/engines/claude.mjs';
import { Client, startSidecar, tmpDataDir } from './helpers.mjs';

test('Claude receives the MCP servers Herdsman chose for the session', async (t) => {
  let options;
  const mcpServers = { tools: { type: 'stdio', command: 'npx', args: ['-y', 'server'], env: { TOKEN: 'x' } } };
  const engine = createClaudeEngine({
    cwd: '/tmp', mode: 'ask', mcpServers, emit() {}, onEngineSession() {}, onTurnState() {},
  }, (query) => {
    options = query.options;
    return { async supportedCommands() { return []; }, async *[Symbol.asyncIterator]() {} };
  });
  t.after(() => engine.shutdown());
  await engine.listCommands();
  assert.deepEqual(options.mcpServers, mcpServers);
  assert.deepEqual(options.settingSources, ['user', 'project', 'local']);
});

test('Claude gets no mcpServers option when none were chosen', async (t) => {
  let options;
  const engine = createClaudeEngine({
    cwd: '/tmp', mode: 'ask', emit() {}, onEngineSession() {}, onTurnState() {},
  }, (query) => {
    options = query.options;
    return { async supportedCommands() { return []; }, async *[Symbol.asyncIterator]() {} };
  });
  t.after(() => engine.shutdown());
  await engine.listCommands();
  assert.ok(!('mcpServers' in options));
});

test('a failed Herdsman MCP server is reported without stopping the session', async (t) => {
  const events = [];
  const engine = createClaudeEngine({
    cwd: '/tmp', mode: 'ask', mcpServers: { tools: { command: 'missing' } },
    emit: (type, data) => events.push({ type, ...data }), onEngineSession() {}, onTurnState() {},
  }, () => ({
    async supportedCommands() { return []; },
    async *[Symbol.asyncIterator]() {
      yield { type: 'system', subtype: 'init', session_id: 'x', model: 'm', mcp_servers: [
        { name: 'tools', status: 'failed' }, { name: 'native', status: 'failed' },
      ] };
    },
  }));
  t.after(() => engine.shutdown());
  await engine.listCommands();
  await new Promise((r) => setTimeout(r, 20));
  const warnings = events.filter((e) => e.type === 'project_skills_warning').map((e) => e.message);
  assert.deepEqual(warnings, ['tools: MCP server failed to connect']);
});

test('the sidecar deletes the MCP file as soon as it starts', async (t) => {
  const dataDir = tmpDataDir();
  const file = path.join(dataDir, 'mcp-servers.json');
  fs.writeFileSync(file, JSON.stringify({ tools: { command: 'npx' } }), { mode: 0o600 });
  const sc = await startSidecar({ dataDir, mcpServersFile: file });
  t.after(() => sc.stop());
  assert.equal(fs.existsSync(file), false);
});

test('an unreadable MCP file becomes a warning and the session still opens', async (t) => {
  const dataDir = tmpDataDir();
  const file = path.join(dataDir, 'mcp-servers.json');
  fs.writeFileSync(file, '{not json', { mode: 0o600 });
  const sc = await startSidecar({ dataDir, mcpServersFile: file });
  const c = await Client.connect(sc.sock);
  t.after(async () => {
    c.sock.destroy();
    await sc.stop();
  });
  await c.hello();
  await c.subscribe(0);
  const warning = await c.waitFor((e) => e.type === 'project_skills_warning');
  assert.equal(warning.message, 'Could not load MCP servers for this session');
  assert.equal(fs.existsSync(file), false);
  await c.waitFor((e) => e.type === 'session_started');
});

// spec 072: servers Claude loads by itself that the project turned off.
test('disabled MCP servers reach Claude as a deny list in flag settings', async (t) => {
  let options;
  const engine = createClaudeEngine({
    cwd: '/tmp', mode: 'ask', mcpDenied: ['codegraph', 'sora-pms'], emit() {}, onEngineSession() {}, onTurnState() {},
  }, (query) => {
    options = query.options;
    return { async supportedCommands() { return []; }, async *[Symbol.asyncIterator]() {} };
  });
  t.after(() => engine.shutdown());
  await engine.listCommands();
  assert.deepEqual(options.settings, { deniedMcpServers: [{ serverName: 'codegraph' }, { serverName: 'sora-pms' }] });
});

test('Claude gets no settings option when nothing is disabled', async (t) => {
  let options;
  const engine = createClaudeEngine({
    cwd: '/tmp', mode: 'ask', mcpDenied: [], emit() {}, onEngineSession() {}, onTurnState() {},
  }, (query) => {
    options = query.options;
    return { async supportedCommands() { return []; }, async *[Symbol.asyncIterator]() {} };
  });
  t.after(() => engine.shutdown());
  await engine.listCommands();
  assert.ok(!('settings' in options));
});

test('the sidecar keeps the deny file so resume can read it again', async (t) => {
  const dataDir = tmpDataDir();
  const file = path.join(dataDir, 'mcp-denied.json');
  fs.writeFileSync(file, JSON.stringify(['codegraph']));
  const sc = await startSidecar({ dataDir, mcpDeniedFile: file });
  const c = await Client.connect(sc.sock);
  t.after(async () => {
    c.sock.destroy();
    await sc.stop();
  });
  await c.hello();
  await c.subscribe(0);
  await c.waitFor((e) => e.type === 'session_started');
  assert.equal(fs.existsSync(file), true);
});

test('an unreadable deny file becomes a warning and the session still opens', async (t) => {
  const dataDir = tmpDataDir();
  const file = path.join(dataDir, 'mcp-denied.json');
  fs.writeFileSync(file, '{"codegraph": true}');
  const sc = await startSidecar({ dataDir, mcpDeniedFile: file });
  const c = await Client.connect(sc.sock);
  t.after(async () => {
    c.sock.destroy();
    await sc.stop();
  });
  await c.hello();
  await c.subscribe(0);
  const warning = await c.waitFor((e) => e.type === 'project_skills_warning');
  assert.equal(warning.message, 'Could not load disabled MCP servers for this session');
  await c.waitFor((e) => e.type === 'session_started');
});
