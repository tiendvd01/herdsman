// Slash command engine báo về (built-in + skill + custom command) cho menu "/" của Composer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client, startSidecar, tmpDataDir } from './helpers.mjs';

test('list_commands trả danh sách slash command của engine', async () => {
  const sc = await startSidecar({ dataDir: tmpDataDir() });
  const c = await Client.connect(sc.sock);
  try {
    await c.hello();
    await c.subscribe(0);
    await c.waitFor((e) => e.type === 'engine_session');
    c.send({ cmd: 'list_commands', req: 1 });
    const res = await c.waitFor((e) => e.req === 1, 10000);
    assert.equal(res.type, 'commands');
    assert.ok(res.commands.length >= 1);
    for (const cmd of res.commands) {
      assert.equal(typeof cmd.name, 'string');
      assert.ok(!cmd.name.startsWith('/'));
      assert.equal(typeof cmd.description, 'string');
      assert.equal(typeof cmd.argument_hint, 'string');
      assert.equal(typeof cmd.builtin, 'boolean');
    }
    assert.ok(res.commands.some((cmd) => !cmd.builtin));
  } finally {
    c.sock.destroy();
    await sc.stop();
  }
});
