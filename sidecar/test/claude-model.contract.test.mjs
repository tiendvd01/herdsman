import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createClaudeEngine } from '../src/engines/claude.mjs';
import { Client, startSidecar, tmpDataDir } from './helpers.mjs';

const result = (is_error = false) => ({ type: 'result', subtype: is_error ? 'error_during_execution' : 'success', is_error });
const assistant = (model, content = []) => ({ type: 'assistant', message: { model, content } });
const unavailable = { ...assistant(undefined), error: 'model_not_found' };

function fixture(t, initialModel, respond) {
  const events = [];
  const requests = [];
  const changes = [];
  let notify;
  let configured;
  const engine = createClaudeEngine({
    cwd: '/tmp',
    mode: 'ask',
    model: initialModel,
    inheritedModel: !!initialModel,
    onEngineSession: (id, model) => events.push({ type: 'engine_session', model }),
    onInitialModelSettled: () => {},
    onModelFallback: (model) => events.push({ type: 'model_fallback', model }),
    onTurnState: () => {},
    emit: (type, data) => {
      events.push({ ...data, type });
      notify?.();
    },
  }, ({ prompt, options }) => {
    configured = options.model;
    let model = configured;
    return {
      async setModel(next) {
        changes.push(next);
        model = next;
      },
      async *[Symbol.asyncIterator]() {
        yield { type: 'system', subtype: 'init', session_id: 'engine-id', model: model ?? 'claude-default' };
        for await (const request of prompt) {
          requests.push(request.message.content.at(-1).text);
          yield* respond(model, requests.length);
        }
      },
    };
  });
  t.after(() => engine.shutdown());
  return {
    engine,
    events,
    requests,
    changes,
    get configured() { return configured; },
    waitForTurns(count) {
      return new Promise((resolve) => {
        notify = () => {
          if (events.filter((event) => event.type === 'turn_end').length >= count) resolve();
        };
        notify();
      });
    },
  };
}

test('Claude uses the inherited model before submitting the first prompt', { timeout: 3000 }, async (t) => {
  const s = fixture(t, 'sonnet', () => [assistant('claude-sonnet'), result()]);
  s.engine.prompt('first');
  await s.waitForTurns(1);
  assert.equal(s.configured, 'sonnet');
  assert.deepEqual(s.changes, []);
  assert.equal(s.events.find((event) => event.type === 'turn_end').model, 'claude-sonnet');
});

test('Claude retries a rejected inherited model once, before forwarding the next prompt', { timeout: 3000 }, async (t) => {
  const s = fixture(t, 'gone', (model) => model === 'gone'
    ? [unavailable, result(true)]
    : [assistant('claude-default', [{ type: 'text', text: 'reply' }]), result()]);
  s.engine.prompt('first');
  s.engine.prompt('second');
  await s.waitForTurns(2);
  assert.deepEqual(s.requests, ['first', 'first', 'second']);
  assert.deepEqual(s.changes, [undefined]);
  assert.deepEqual(s.events.filter((e) => e.type === 'model_fallback'), [{ type: 'model_fallback', model: 'gone' }]);
  assert.deepEqual(s.events.filter((e) => e.type === 'turn_end').map((e) => e.model), ['claude-default', 'claude-default']);
});

test('Claude never retries after a tool call or a non-model failure', { timeout: 3000 }, async (t) => {
  const tool = assistant('claude-inherited', [{ type: 'tool_use', id: 'tool-id', name: 'Read', input: {} }]);
  for (const output of [[tool, unavailable], [{ ...unavailable, error: 'authentication_failed' }]]) {
    const s = fixture(t, 'inherited', () => [...output, result(true)]);
    s.engine.prompt('first');
    await s.waitForTurns(1);
    assert.deepEqual(s.requests, ['first']);
    assert.deepEqual(s.changes, []);
    assert.equal(s.events.find((event) => event.type === 'turn_end').is_error, true);
  }
});

test('Claude sidecar retains its inherited model through a restart before the first prompt', { timeout: 6000 }, async (t) => {
  const dataDir = tmpDataDir();
  t.after(() => fs.rm(dataDir, { recursive: true, force: true }));
  for (const inheritedModel of ['sonnet', undefined]) {
    const sidecar = await startSidecar({ dataDir, engine: 'claude', inheritedModel });
    const client = await Client.connect(sidecar.sock);
    try {
      await client.hello();
      await client.subscribe();
      const started = client.events.filter((event) => event.type === 'session_started').at(-1);
      assert.equal(started.model, 'sonnet');
    } finally {
      client.close();
      await sidecar.stop();
    }
  }
});
