// Engine Claude: Claude Agent SDK → AgentEvent chuẩn hoá (contracts/sidecar-socket.md).
import { query } from '@anthropic-ai/claude-agent-sdk';

// Chế độ quyền của Herdsman → permissionMode của SDK (research R2).
export const MODE_MAP = { ask: 'default', accept_edits: 'acceptEdits', auto: 'auto', bypass: 'bypassPermissions' };

/** Hàng đợi async iterable cho input nhiều lượt. */
class InputQueue {
  constructor() {
    this.items = [];
    this.waiters = [];
    this.closed = false;
  }
  push(item) {
    const w = this.waiters.shift();
    if (w) w({ value: item, done: false });
    else this.items.push(item);
  }
  close() {
    this.closed = true;
    for (const w of this.waiters.splice(0)) w({ value: undefined, done: true });
  }
  [Symbol.asyncIterator]() {
    return {
      next: () => {
        if (this.items.length) return Promise.resolve({ value: this.items.shift(), done: false });
        if (this.closed) return Promise.resolve({ value: undefined, done: true });
        return new Promise((r) => this.waiters.push(r));
      },
    };
  }
}

function toolResultText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((c) => (c.type === 'text' ? c.text : c.type === 'image' ? '[image]' : JSON.stringify(c))).join('\n');
  }
  return JSON.stringify(content);
}

/**
 * @param {{cwd: string, mode: string, model?: string, resumeId?: string,
 *   emit: (type: string, fields?: object, opts?: {live?: boolean}) => void,
 *   requestPermission: (tool: string, input: object, extra: object) => Promise<{decision: string, updated_input?: object}>,
 *   onEngineSession: (id: string, model?: string) => void,
 *   onTurnState: (state: 'working'|'idle'|'error') => void}} ctx
 */
export function createClaudeEngine(ctx) {
  let input = null;
  let q = null;
  let running = false;
  let resumeId = ctx.resumeId;
  let mode = ctx.mode;
  let model = ctx.model;
  let interrupted = false;
  let models = null; // cache supportedModels()
  let commands = null; // cache supportedCommands(), thay khi engine báo commands_changed
  let lastTurnModel = null;

  function start() {
    input = new InputQueue();
    const options = {
      cwd: ctx.cwd,
      includePartialMessages: true,
      permissionMode: MODE_MAP[mode] || 'default',
      allowDangerouslySkipPermissions: true,
      settingSources: ['user', 'project', 'local'],
      canUseTool: async (toolName, toolInput, opts) => {
        const res = await ctx.requestPermission(toolName, toolInput, { tool_use_id: opts?.toolUseID, blocked_path: opts?.blockedPath });
        if (res.decision === 'allow') return { behavior: 'allow', updatedInput: res.updated_input ?? toolInput };
        return { behavior: 'deny', message: 'The user denied this request.' };
      },
    };
    if (resumeId) options.resume = resumeId;
    if (model) options.model = model;
    if (process.env.HERDSMAN_CLAUDE_PATH) options.pathToClaudeCodeExecutable = process.env.HERDSMAN_CLAUDE_PATH;
    q = query({ prompt: input, options });
    running = true;
    pump(q).catch((err) => {
      ctx.emit('error', { code: 'engine', message: String(err?.message || err), recoverable: true });
      ctx.onTurnState('error');
    }).finally(() => {
      running = false;
      q = null;
    });
  }

  const lastRateEvents = {};

  // Sau mỗi lượt: lấy % context + hạn mức 5h/tuần, phát một usage_snapshot. Mọi lỗi bị bỏ qua (tính năng chỉ để xem).
  async function emitUsageSnapshot(stream) {
    try {
      let context_pct = null;
      let limits = null;
      try {
        const c = await stream.getContextUsage({ detail: 'summary' });
        if (typeof c?.percentage === 'number') context_pct = c.percentage;
      } catch {}
      try {
        const u = await stream.usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET({ skipBehaviors: true });
        const r = u?.rate_limits;
        if (u?.rate_limits_available && r) {
          const win = (w) => (w ? { pct: w.utilization ?? null, resets_at: w.resets_at ?? null } : null);
          limits = { five_hour: win(r.five_hour), seven_day: win(r.seven_day) };
        }
      } catch {}
      if (!limits && (lastRateEvents.five_hour || lastRateEvents.seven_day)) {
        limits = { five_hour: lastRateEvents.five_hour ?? null, seven_day: lastRateEvents.seven_day ?? null };
      }
      if (context_pct != null || limits) ctx.emit('usage_snapshot', { context_pct, limits });
    } catch {}
  }

  async function pump(stream) {
    let currentMessageId = null;
    for await (const msg of stream) {
      switch (msg.type) {
        case 'system':
          if (msg.subtype === 'init') {
            resumeId = msg.session_id;
            model = msg.model || model;
            ctx.onEngineSession(msg.session_id, msg.model);
          } else if (msg.subtype === 'commands_changed' && Array.isArray(msg.commands)) {
            commands = mapCommands(msg.commands);
          }
          break;
        case 'stream_event': {
          const ev = msg.event;
          if (ev?.type === 'message_start') currentMessageId = ev.message?.id ?? null;
          if (ev?.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            ctx.emit('delta', { message_id: currentMessageId, text: ev.delta.text, parent_tool_use_id: msg.parent_tool_use_id ?? null }, { live: true });
          }
          break;
        }
        case 'assistant': {
          if (!msg.parent_tool_use_id && msg.message?.model) lastTurnModel = msg.message.model;
          const blocks = [];
          for (const b of msg.message?.content ?? []) {
            if (b.type === 'text' && b.text) blocks.push({ kind: 'text', text: b.text });
            else if (b.type === 'thinking' && b.thinking) blocks.push({ kind: 'thinking', text: b.thinking });
          }
          if (blocks.length) {
            ctx.emit('assistant_message', { message_id: msg.message?.id ?? null, blocks, parent_tool_use_id: msg.parent_tool_use_id ?? null });
          }
          for (const b of msg.message?.content ?? []) {
            if (b.type === 'tool_use') {
              ctx.emit('tool_use', { tool_use_id: b.id, tool: b.name, input: b.input, parent_tool_use_id: msg.parent_tool_use_id ?? null });
            }
          }
          break;
        }
        case 'user': {
          const content = msg.message?.content;
          if (Array.isArray(content)) {
            for (const b of content) {
              if (b.type === 'tool_result') {
                ctx.emit('tool_result', { tool_use_id: b.tool_use_id, is_error: !!b.is_error, content: toolResultText(b.content) });
              }
            }
          }
          break;
        }
        case 'rate_limit_event': {
          const i = msg.rate_limit_info;
          if ((i?.rateLimitType === 'five_hour' || i?.rateLimitType === 'seven_day') && typeof i.utilization === 'number') {
            // utilization có thể là tỉ lệ 0–1 hoặc phần trăm; chỉ dùng làm dự phòng khi usage() lỗi.
            lastRateEvents[i.rateLimitType] = {
              pct: i.utilization <= 1 ? i.utilization * 100 : i.utilization,
              resets_at: i.resetsAt ? new Date(i.resetsAt * 1000).toISOString() : null,
            };
          }
          break;
        }
        case 'result': {
          const u = msg.usage || {};
          ctx.emit('turn_end', {
            interrupted,
            is_error: !!msg.is_error,
            usage: {
              input_tokens: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0),
              output_tokens: u.output_tokens || 0,
            },
            cost_usd: msg.total_cost_usd ?? null,
            duration_ms: msg.duration_ms ?? null,
            model: lastTurnModel ?? model ?? undefined,
          });
          interrupted = false;
          emitUsageSnapshot(stream);
          ctx.onTurnState(msg.is_error && msg.subtype !== 'success' ? 'error' : 'idle');
          break;
        }
        default:
      }
    }
  }

  return {
    get engineSessionId() {
      return resumeId;
    },
    prompt(text, images = []) {
      if (!running) start();
      const content = [];
      for (const img of images) {
        content.push({ type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data_b64 } });
      }
      content.push({ type: 'text', text });
      input.push({ type: 'user', message: { role: 'user', content }, parent_tool_use_id: null, session_id: resumeId || '' });
    },
    async interrupt() {
      if (q) {
        interrupted = true;
        await q.interrupt();
      }
    },
    async setPermissionMode(m) {
      mode = m;
      if (q) await q.setPermissionMode(MODE_MAP[m] || 'default');
    },
    async setModel(m) {
      if (q) await q.setModel(m);
      model = m;
    },
    /** Danh sách model của Claude Code. Chưa có query thì khởi động query rỗng (chưa gửi tin nào, không tốn token). */
    async listModels() {
      if (models) return models;
      if (!running) start();
      const list = await q.supportedModels();
      models = list.map((m) => ({
        value: m.value,
        display_name: m.displayName,
        description: m.description ?? '',
        ...(m.resolvedModel ? { resolved_model: m.resolvedModel } : {}),
      }));
      return models;
    },
    /** Slash command của Claude Code: built-in + skill + custom command (user/project/plugin). */
    async listCommands() {
      if (commands) return commands;
      if (!running) start();
      commands = mapCommands(await q.supportedCommands());
      return commands;
    },
    shutdown() {
      input?.close();
    },
  };
}

/** Gộp hàng trùng tên: hàng built-in thắng (đúng thứ tự Claude Code chọn khi chạy /name). */
function mapCommands(list) {
  const byName = new Map();
  for (const c of list) {
    if (!c?.name) continue;
    const prev = byName.get(c.name);
    if (prev && !c.builtin) continue;
    byName.set(c.name, { name: c.name, description: c.description ?? '', argument_hint: c.argumentHint ?? '', builtin: !!c.builtin });
  }
  return [...byName.values()];
}
