import { describe, expect, it } from 'vitest';
import { applyEvent, type SessionView } from '@/stores/useSessionStore';
import type { AgentEvent } from '@/lib/types';

const view = (): SessionView => ({ items: [], toolIndex: {}, streaming: null, pending: [], mode: null, status: null, lastSeq: 0, ctxPct: null, model: null, loaded: false, closed: false, error: null });
const ev = (e: Record<string, unknown>) => ({ ts: 1, ...e }) as AgentEvent;

describe('applyEvent', () => {
  it('stream delta rồi thay bằng message hoàn chỉnh', () => {
    const v = view();
    applyEvent(v, ev({ seq: 1, type: 'user_message', text: 'hi', source: 'app' }));
    applyEvent(v, ev({ seq: null, type: 'delta', message_id: 'm1', text: 'Xin ' }));
    applyEvent(v, ev({ seq: null, type: 'delta', message_id: 'm1', text: 'chào' }));
    expect(v.streaming?.text).toBe('Xin chào');
    applyEvent(v, ev({ seq: 2, type: 'assistant_message', message_id: 'm1', blocks: [{ kind: 'text', text: 'Xin chào' }] }));
    expect(v.streaming).toBeNull();
    expect(v.items.map((i) => i.kind)).toEqual(['user', 'assistant']);
  });

  it('bỏ qua event trùng khi phát lại', () => {
    const v = view();
    const e = ev({ seq: 5, type: 'user_message', text: 'a', source: 'app' });
    applyEvent(v, e);
    applyEvent(v, e);
    expect(v.items).toHaveLength(1);
  });

  it('tool_result gắn vào đúng tool card; permission chờ rồi được giải quyết', () => {
    const v = view();
    applyEvent(v, ev({ seq: 1, type: 'tool_use', tool_use_id: 't1', tool: 'Edit', input: { file_path: 'a', old_string: 'x', new_string: 'y' } }));
    applyEvent(v, ev({ seq: 2, type: 'permission_request', id: 'p1', tool: 'Edit', input: {}, cwd: '/' }));
    expect(v.pending).toHaveLength(1);
    applyEvent(v, ev({ seq: 3, type: 'permission_resolved', id: 'p1', decision: 'allow', by: 'user' }));
    expect(v.pending).toHaveLength(0);
    applyEvent(v, ev({ seq: 4, type: 'tool_result', tool_use_id: 't1', is_error: false, content: 'ok' }));
    const tool = v.items[0];
    expect(tool.kind === 'tool' && tool.result?.content).toBe('ok');
  });

  it('event của sub-agent không chen vào hội thoại chính mà đếm bước', () => {
    const v = view();
    applyEvent(v, ev({ seq: 1, type: 'tool_use', tool_use_id: 'task1', tool: 'Task', input: { description: 'x' } }));
    applyEvent(v, ev({ seq: 2, type: 'tool_use', tool_use_id: 'sub', tool: 'Read', input: {}, parent_tool_use_id: 'task1' }));
    expect(v.items).toHaveLength(1);
    expect(v.items[0].kind === 'tool' && v.items[0].steps).toBe(1);
  });

  it('chế độ quyền và trạng thái', () => {
    const v = view();
    applyEvent(v, ev({ seq: 1, type: 'session_started', engine: 'echo', model: null, cwd: '/', permission_mode: 'ask', resumed: false }));
    applyEvent(v, ev({ seq: 2, type: 'permission_mode_changed', mode: 'bypass' }));
    applyEvent(v, ev({ seq: 3, type: 'status', state: 'blocked', kind: 'permission' }));
    expect(v.mode).toBe('bypass');
    expect(v.status).toBe('blocked');
  });

  it('shows the fallback notice and uses Claude’s reported default model', () => {
    const v = view();
    applyEvent(v, ev({ seq: 1, type: 'session_started', engine: 'claude', model: 'unavailable', cwd: '/x', permission_mode: 'ask' }));
    applyEvent(v, ev({ seq: 2, type: 'model_fallback', unavailable_model: 'unavailable', message: 'Using the default model.' }));
    expect(v.model).toBeNull();
    expect(v.items).toMatchObject([{ kind: 'notice', tone: 'info', text: 'Using the default model.' }]);
    applyEvent(v, ev({ seq: 3, type: 'engine_session', engine_session_id: 'claude-id', model: 'claude-sonnet' }));
    expect(v.model).toBe('claude-sonnet');
  });

  it('model_changed đổi model và chèn notice một lần', () => {
    const v = view();
    applyEvent(v, ev({ seq: 1, type: 'session_started', engine: 'claude', model: 'claude-opus-5-5', cwd: '/x', permission_mode: 'ask', resumed: false }));
    applyEvent(v, ev({ seq: 2, type: 'model_changed', model: 'claude-sonnet-5-5', previous: 'claude-opus-5-5' }));
    applyEvent(v, ev({ seq: 2, type: 'model_changed', model: 'claude-sonnet-5-5', previous: 'claude-opus-5-5' }));
    expect(v.model).toBe('claude-sonnet-5-5');
    const notices = v.items.filter((i) => i.kind === 'notice');
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatchObject({ tone: 'info', text: 'Switched model to Sonnet 5.5' });
  });
});

it('replays shell output by tool use ID without associating it with identical commands', () => {
  const v = view();
  const input = { command: 'test backend' };
  const events = [
    { seq: 1, type: 'tool_use', tool_use_id: 'a', tool: 'Bash', input, live_shell: true },
    { seq: 2, type: 'tool_use', tool_use_id: 'b', tool: 'Bash', input, live_shell: true },
    { seq: 3, type: 'permission_request', tool_use_id: 'b', id: 'p', tool: 'Bash', input, cwd: '/' },
    { seq: 4, type: 'permission_resolved', id: 'p', decision: 'deny', by: 'user' },
    { seq: 5, type: 'shell_update', tool_use_id: 'a', status: 'running' },
    { seq: 6, type: 'shell_update', tool_use_id: 'a', output: 'first line\n', truncated: false },
    { seq: 7, type: 'shell_update', tool_use_id: 'a', output: 'later tail\n', truncated: true },
    { seq: 8, type: 'shell_update', tool_use_id: 'a', status: 'interrupted' },
    { seq: 9, type: 'tool_use', tool_use_id: 'legacy', tool: 'Bash', input },
    { seq: 10, type: 'tool_result', tool_use_id: 'legacy', is_error: false, content: 'legacy result' },
  ];
  for (const event of [...events, events[6]]) applyEvent(v, ev(event));
  expect(v.items.map((item) => item.kind === 'tool' && item.shell)).toEqual([
    { output: 'later tail\n', truncated: true, status: 'interrupted' },
    { permission: 'denied' },
    undefined,
  ]);
  expect(v.items[2]).toMatchObject({ result: { content: 'legacy result' } });
});
