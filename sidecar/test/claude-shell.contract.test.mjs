import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trackClaudeShells } from '../src/engines/claude-shell.mjs';

const flush = async () => new Promise((resolve) => setImmediate(resolve));

test('Claude tracks independent Bash tasks and keeps output after interruption', async () => {
  const events = [];
  const output = new Map([
    ['a', { output: 'early a\n', truncated: false }],
    ['b', { output: 'tail b\n', truncated: true }],
  ]);
  const shells = trackClaudeShells({ getTaskOutput: async (id) => output.get(id) }, (_, fields) => events.push(fields));
  try {
    shells.start({ task_type: 'local_agent', task_id: 'ignore', tool_use_id: 'ignored' });
    shells.start({ task_type: 'local_bash', task_id: 'a', tool_use_id: 'one' });
    shells.start({ task_type: 'local_bash', task_id: 'b', tool_use_id: 'two', is_backgrounded: true });
    await flush();
    output.set('a', { output: '', truncated: false });
    await shells.finish({ task_id: 'a', status: 'stopped' });
    shells.close();
    assert.deepEqual(events, [
      { tool_use_id: 'one', status: 'running', background: false },
      { tool_use_id: 'two', status: 'running', background: true },
      { tool_use_id: 'one', output: 'early a\n', truncated: false, unavailable: false },
      { tool_use_id: 'two', output: 'tail b\n', truncated: true, unavailable: false },
      { tool_use_id: 'one', status: 'interrupted' },
      { tool_use_id: 'two', status: 'unknown', unavailable: true },
    ]);
  } finally {
    shells.close();
  }
});

test('Claude preserves task status when live reads are unavailable', async () => {
  const events = [];
  const shells = trackClaudeShells({}, (_, fields) => events.push(fields));
  try {
    shells.start({ task_type: 'local_bash', task_id: 'a', tool_use_id: 'one' });
    await shells.finish({ task_id: 'a', status: 'completed' });
    assert.deepEqual(events, [
      { tool_use_id: 'one', status: 'running', background: false },
      { tool_use_id: 'one', unavailable: true },
      { tool_use_id: 'one', status: 'success' },
    ]);
  } finally {
    shells.close();
  }
});
