import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClaudeEngine } from '../src/engines/claude.mjs';
import { Client, startSidecar, tmpDataDir } from './helpers.mjs';

test('Claude keeps native settings and attaches the session plugin before querying', async (t) => {
  let options;
  const engine = createClaudeEngine({
    cwd: '/tmp',
    mode: 'ask',
    projectSkillsPlugin: '/tmp/project-skills',
    emit() {},
    onEngineSession() {},
    onTurnState() {},
  }, (query) => {
    options = query.options;
    return {
      async supportedCommands() { return []; },
      async *[Symbol.asyncIterator]() {},
    };
  });
  t.after(() => engine.shutdown());
  await engine.listCommands();
  assert.deepEqual(options.settingSources, ['user', 'project', 'local']);
  assert.deepEqual(options.plugins, [{ type: 'local', path: '/tmp/project-skills', skipMcpDiscovery: true }]);
  assert.equal(typeof options.canUseTool, 'function');
});

test('new Claude sidecar discovers and invokes the skill from its local plugin', {
  skip: process.env.HERDSMAN_SKIP_SMOKE === '1',
  timeout: 45000,
}, async (t) => {
  const dataDir = tmpDataDir();
  const plugin = path.join(dataDir, 'plugin');
  const skill = path.join(plugin, 'skills', 'fixture-greeting');
  await fs.mkdir(skill, { recursive: true });
  await fs.mkdir(path.join(plugin, '.claude-plugin'));
  await fs.writeFile(path.join(plugin, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'herdsman-project-test' }));
  await fs.writeFile(path.join(skill, 'SKILL.md'), [
    '---', 'name: fixture-greeting', 'description: Return the greeting fixture.', '---',
    'Reply with HERDSMAN_FIXTURE_GREETING.', '',
  ].join('\n'));
  let sc;
  let c;
  t.after(async () => {
    c?.sock.destroy();
    await sc?.stop();
    await fs.rm(dataDir, { recursive: true, force: true });
  });
  sc = await startSidecar({
    dataDir, engine: 'claude', cwd: dataDir,
    projectSkillsPlugin: plugin,
    projectSkillsWarning: 'missing-fixture: skill source is unavailable',
  });
  c = await Client.connect(sc.sock);
  await c.hello();
  await c.subscribe(0);
  const warning = await c.waitFor((event) => event.type === 'project_skills_warning');
  assert.match(warning.message, /missing-fixture/);
  c.send({ cmd: 'list_commands', req: 17 });
  const reply = await c.waitFor((event) => event.req === 17, 15000);
  assert.equal(reply.type, 'commands', JSON.stringify(reply));
  const command = reply.commands.find(({ name }) => name.endsWith('herdsman-project-test:fixture-greeting'));
  assert.ok(command, 'The staged skill should appear in the Claude command list');

  c.send({ cmd: 'prompt', text: '/herdsman-project-test:fixture-greeting' });
  const end = await c.waitFor((event) => event.type === 'turn_end' || event.type === 'error', 25000);
  assert.equal(end.type, 'turn_end', JSON.stringify(end));
  assert.equal(end.is_error, false, JSON.stringify(end));
  assert.match(JSON.stringify(c.events.filter((event) => event.type === 'assistant_message')), /HERDSMAN_FIXTURE_GREETING/);
});
