// Hội thoại theo session, dựng từ AgentEvent (UI chỉ là cache; nguồn sự thật là event log).
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AgentEvent, ChatAttachment, LimitWindow, PermissionMode, SessionStatus, ShellUpdate } from '@/lib/types';
import { modelLabel } from '@/lib/model';

export type Item =
  | { kind: 'user'; key: string; text: string; images: ChatAttachment[]; source: string; ts: number }
  | { kind: 'assistant'; key: string; blocks: { kind: 'text' | 'thinking'; text: string }[]; ts: number }
  | {
      kind: 'tool';
      key: string;
      tool_use_id: string;
      tool: string;
      input: Record<string, unknown>;
      result?: { is_error: boolean; content: string };
      shell?: ShellUpdate & { permission?: 'waiting' | 'denied' | 'cancelled' };
      steps: number;
      ts: number;
    }
  | { kind: 'turn_end'; key: string; interrupted: boolean; tokens?: number; cost?: number | null; ts: number }
  | { kind: 'notice'; key: string; tone: 'info' | 'error'; text: string; ts: number };

export interface PermissionReq {
  tool_use_id?: string;
  id: string;
  tool: string;
  input: Record<string, unknown>;
  cwd: string;
  ts: number;
}

export interface SessionView {
  items: Item[];
  toolIndex: Record<string, number>;
  streaming: { message_id: string | null; text: string } | null;
  pending: PermissionReq[];
  mode: PermissionMode | null;
  status: SessionStatus | null;
  lastSeq: number;
  ctxPct: number | null;
  model: string | null | undefined;
  loaded: boolean;
  closed: boolean;
  error: string | null;
}

const empty = (): SessionView => ({
  items: [],
  toolIndex: {},
  streaming: null,
  pending: [],
  mode: null,
  status: null,
  lastSeq: 0,
  ctxPct: null,
  model: undefined,
  loaded: false,
  closed: false,
  error: null,
});

interface State {
  sessions: Record<string, SessionView>;
  /** Hạn mức 5h/tuần thuộc tài khoản: lấy snapshot mới nhất của mọi session. */
  limits: { five_hour?: LimitWindow | null; seven_day?: LimitWindow | null; ts: number } | null;
  applyEvents: (sid: string, events: AgentEvent[], meta?: { closed?: boolean; error?: string }) => void;
  reset: (sid: string) => void;
  release: (sid: string) => void;
}

/** Áp một event vào view (thuần, dễ test). */
export function applyEvent(v: SessionView, ev: AgentEvent) {
  if (ev.seq != null) {
    if (ev.seq <= v.lastSeq) return; // trùng do phát lại
    v.lastSeq = ev.seq;
  }
  const key = `${ev.seq ?? 'live'}-${ev.type}`;
  switch (ev.type) {
    case 'session_started':
      v.mode = ev.permission_mode;
      if (ev.model) v.model = ev.model;
      if (ev.resumed) {
        for (const item of v.items) {
          if (item.kind === 'tool' && item.shell?.status === 'running') {
            item.shell.status = 'unknown';
            item.shell.unavailable = true;
          }
        }
      }
      if (ev.resumed && v.items.length) v.items.push({ kind: 'notice', key, tone: 'info', text: 'Agent resumed — the conversation continues.', ts: ev.ts });
      break;
    case 'engine_session':
      if (ev.model) v.model = ev.model;
      break;
    case 'model_fallback':
      v.model = null;
      v.items.push({ kind: 'notice', key, tone: 'info', text: ev.message, ts: ev.ts });
      break;
    case 'model_changed':
      v.model = ev.model;
      v.items.push({ kind: 'notice', key, tone: 'info', text: `Switched model to ${modelLabel(ev.model)}`, ts: ev.ts });
      break;
    case 'user_message':
      v.items.push({ kind: 'user', key, text: ev.text, images: ev.images ?? [], source: ev.source, ts: ev.ts });
      break;
    case 'delta':
      if (ev.parent_tool_use_id) break;
      if (!v.streaming || v.streaming.message_id !== ev.message_id) v.streaming = { message_id: ev.message_id, text: '' };
      v.streaming.text += ev.text;
      break;
    case 'assistant_message': {
      if (ev.parent_tool_use_id) {
        const i = v.toolIndex[ev.parent_tool_use_id];
        const it = i != null ? v.items[i] : undefined;
        if (it?.kind === 'tool') it.steps += 1;
        break;
      }
      if (v.streaming && (v.streaming.message_id === ev.message_id || ev.message_id == null)) v.streaming = null;
      // Nhiều assistant_message cùng message_id (SDK tách theo block): gộp vào item trước nếu liền kề.
      const last = v.items[v.items.length - 1];
      if (last?.kind === 'assistant' && ev.message_id && last.key.endsWith(`#${ev.message_id}`)) last.blocks.push(...ev.blocks);
      else v.items.push({ kind: 'assistant', key: `${key}#${ev.message_id ?? ''}`, blocks: ev.blocks, ts: ev.ts });
      break;
    }
    case 'tool_use': {
      if (ev.parent_tool_use_id) {
        const i = v.toolIndex[ev.parent_tool_use_id];
        const it = i != null ? v.items[i] : undefined;
        if (it?.kind === 'tool') it.steps += 1;
        if (!ev.live_shell) break;
      } else {
        v.streaming = null;
      }
      if (v.toolIndex[ev.tool_use_id] != null) break;
      v.toolIndex[ev.tool_use_id] = v.items.length;
      v.items.push({ kind: 'tool', key, tool_use_id: ev.tool_use_id, tool: ev.tool, input: ev.input, ...(ev.live_shell ? { shell: {} } : {}), steps: 0, ts: ev.ts });
      break;
    }
    case 'shell_update': {
      const { tool_use_id, status, output, truncated, unavailable, background } = ev;
      const it = v.items[v.toolIndex[tool_use_id]];
      if (it?.kind !== 'tool' || !it.shell) break;
      if (status !== undefined) it.shell.status = status;
      if (output !== undefined) it.shell.output = output;
      if (truncated !== undefined) it.shell.truncated = truncated;
      if (unavailable !== undefined) it.shell.unavailable = unavailable;
      if (background !== undefined) it.shell.background = background;
      break;
    }
    case 'tool_result': {
      const i = v.toolIndex[ev.tool_use_id];
      const it = i != null ? v.items[i] : undefined;
      if (it?.kind === 'tool') it.result = { is_error: ev.is_error, content: ev.content };
      break;
    }
    case 'permission_request': {
      v.pending.push({ id: ev.id, tool: ev.tool, input: ev.input, cwd: ev.cwd, ts: ev.ts, tool_use_id: ev.tool_use_id });
      const it = ev.tool_use_id ? v.items[v.toolIndex[ev.tool_use_id]] : undefined;
      if (it?.kind === 'tool' && it.shell) it.shell.permission = 'waiting';
      break;
    }
    case 'permission_resolved': {
      const toolId = v.pending.find((p) => p.id === ev.id)?.tool_use_id;
      const it = toolId ? v.items[v.toolIndex[toolId]] : undefined;
      if (it?.kind === 'tool' && it.shell) {
        it.shell.permission = ev.decision === 'deny' ? 'denied' : ev.decision === 'cancelled' ? 'cancelled' : undefined;
      }
      v.pending = v.pending.filter((p) => p.id !== ev.id);
      break;
    }
    case 'permission_mode_changed':
      v.mode = ev.mode;
      break;
    case 'status':
      v.status = ev.state;
      break;
    case 'usage_snapshot':
      v.ctxPct = ev.context_pct;
      break;
    case 'turn_end':
      v.streaming = null;
      v.items.push({
        kind: 'turn_end',
        key,
        interrupted: ev.interrupted,
        tokens: ev.usage ? ev.usage.input_tokens + ev.usage.output_tokens : undefined,
        cost: ev.cost_usd,
        ts: ev.ts,
      });
      break;
    case 'project_skills_warning':
      v.items.push({ kind: 'notice', key, tone: 'info', text: `Project skills skipped: ${ev.message}`, ts: ev.ts });
      break;
    case 'error':
      v.items.push({ kind: 'notice', key, tone: 'error', text: ev.message, ts: ev.ts });
      break;
  }
}

export const useSessionStore = create<State>()(
  subscribeWithSelector(
    immer((set) => ({
      sessions: {},
      limits: null,
      applyEvents: (sid, events, meta) =>
        set((s) => {
          const v = (s.sessions[sid] ??= empty());
          for (const ev of events) {
            applyEvent(v, ev);
            if (ev.type === 'usage_snapshot' && ev.limits && (!s.limits || ev.ts >= s.limits.ts)) s.limits = { ...ev.limits, ts: ev.ts };
          }
          v.loaded = true;
          if (meta?.closed) v.closed = true;
          if (meta?.error) v.error = meta.error;
          else if (events.length) v.error = null;
        }),
      reset: (sid) =>
        set((s) => {
          s.sessions[sid] = empty();
        }),
      release: (sid) =>
        set((s) => {
          delete s.sessions[sid];
        }),
    })),
  ),
);
