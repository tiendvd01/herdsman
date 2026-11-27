// Engine Claude: Claude Agent SDK → AgentEvent chuẩn hoá (contracts/sidecar-socket.md).
import { query } from '@anthropic-ai/claude-agent-sdk';
import { trackClaudeShells } from './claude-shell.mjs';

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
 * @param {{cwd: string, mode: string, model?: string, inheritedModel?: boolean, resumeId?: string,
 *   projectSkillsPlugin?: string,
 *   mcpServers?: Record<string, object>,
 *   mcpDenied?: string[],
 *   emit: (type: string, fields?: object, opts?: {live?: boolean}) => void,
 *   requestPermission: (tool: string, input: object, extra: object) => Promise<{decision: string, updated_input?: object}>,
 *   onEngineSession: (id: string, model?: string) => void,
 *   onModelFallback: (unavailable: string) => void,
 *   onInitialModelSettled: () => void,
 *   onTurnState: (state: 'working'|'idle'|'error', kind?: 'turn_complete') => void}} ctx
 */
export function createClaudeEngine(ctx, runQuery = query) {
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
  let fallbackChange;
  let initial = ctx.inheritedModel && model
    ? { requested: model, prompt: null, queued: [], rejected: false, hasOutput: false, retrying: false, overridden: false }
    : null;

  function finishInitialTurn() {
    const first = initial;
    initial = null;
    ctx.onInitialModelSettled();
    for (const prompt of first.queued) input.push(prompt);
  }

  async function retryInitialTurn(stream) {
    const first = initial;
    if (!first?.rejected || first.hasOutput || first.retrying || first.overridden || interrupted) return false;
    try {
      fallbackChange = stream.setModel();
      await fallbackChange;
    } catch (err) {
      ctx.emit('error', { code: 'engine', message: String(err?.message || err), recoverable: true });
      return false;
    } finally {
      fallbackChange = undefined;
    }
    model = undefined;
    lastTurnModel = null;
    ctx.onModelFallback(first.requested);
    if (interrupted) return false;
    first.retrying = true;
    input.push(first.prompt);
    return true;
  }

  function start() {
    input = new InputQueue();
    const options = {
      cwd: ctx.cwd,
      includePartialMessages: true,
      permissionMode: MODE_MAP[mode] || 'default',
      allowDangerouslySkipPermissions: true,
      settingSources: ['user', 'project', 'local'],
      canUseTool: async (toolName, toolInput, opts) => {
        if (initial?.prompt) initial.hasOutput = true;
        const res = await ctx.requestPermission(toolName, toolInput, { tool_use_id: opts?.toolUseID, blocked_path: opts?.blockedPath }, opts?.signal);
        if (res.decision === 'allow') return { behavior: 'allow', updatedInput: res.updated_input ?? toolInput };
        return { behavior: 'deny', message: 'The user denied this request.' };
      },
    };
    if (ctx.projectSkillsPlugin) {
      options.plugins = [{ type: 'local', path: ctx.projectSkillsPlugin, skipMcpDiscovery: true }];
    }
    if (ctx.mcpServers && Object.keys(ctx.mcpServers).length) options.mcpServers = ctx.mcpServers;
    // spec 072: flag settings, so Claude skips these servers without any config file being edited.
    if (ctx.mcpDenied?.length) options.settings = { deniedMcpServers: ctx.mcpDenied.map((serverName) => ({ serverName })) };
    if (resumeId) options.resume = resumeId;
    if (model) options.model = model;
    if (process.env.HERDSMAN_CLAUDE_PATH) options.pathToClaudeCodeExecutable = process.env.HERDSMAN_CLAUDE_PATH;
    q = runQuery({ prompt: input, options });
    running = true;
    const shells = trackClaudeShells(q, ctx.emit);
    pump(q, shells).catch((err) => {
      ctx.emit('error', { code: 'engine', message: String(err?.message || err), recoverable: true });
      ctx.onTurnState('error');
    }).finally(() => {
      shells.close();
      if (initial?.prompt) {
        // A dead stream cannot receive prompts waiting for the first result.
        if (initial.queued.length) {
          ctx.emit('error', { code: 'engine', message: 'Claude stopped before processing the queued messages. Send them again to continue.', recoverable: true });
        }
        initial = null;
        ctx.onInitialModelSettled();
      }
      running = false;
      q = null;
    });
  }

  async function readUsage(stream) {
    const ts = Date.now();
    try {
      const u = await stream.usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET({ skipBehaviors: true });
      if (stream !== q || !u?.rate_limits_available) return null;
      const limits = {};
      for (const key of ['five_hour', 'seven_day']) {
        const window = u.rate_limits?.[key];
        if (Number.isFinite(window?.utilization)) {
          limits[key] = { pct: window.utilization, resets_at: window.resets_at ?? null };
        }
      }
      return Object.keys(limits).length ? { ts, limits } : null;
    } catch {
      return null;
    }
  }

  async function emitContextUsage(stream) {
    try {
      const c = await stream.getContextUsage({ detail: 'summary' });
      if (stream === q && Number.isFinite(c?.percentage)) {
        ctx.emit('usage_snapshot', { context_pct: c.percentage, limits: null });
      }
    } catch {}
  }

  async function pump(stream, shells) {
    let currentMessageId = null;
    for await (const msg of stream) {
      switch (msg.type) {
        case 'system':
          if (msg.subtype === 'init') {
            resumeId = msg.session_id;
            model = msg.model || model;
            ctx.onEngineSession(msg.session_id, msg.model);
            // spec 071: say which Herdsman MCP servers could not start; the session keeps going.
            for (const server of Array.isArray(msg.mcp_servers) ? msg.mcp_servers : []) {
              if (server?.status === 'failed' && ctx.mcpServers && Object.hasOwn(ctx.mcpServers, server.name)) {
                ctx.emit('project_skills_warning', { message: `${server.name}: MCP server failed to connect` });
              }
            }
          } else if (msg.subtype === 'commands_changed' && Array.isArray(msg.commands)) {
            commands = mapCommands(msg.commands);
          } else if (msg.subtype === 'task_started') {
            shells.start(msg);
          } else if (msg.subtype === 'task_updated') {
            shells.background(msg);
          } else if (msg.subtype === 'task_notification') {
            await shells.finish(msg);
          }
          break;
        case 'stream_event': {
          const ev = msg.event;
          if (ev?.type === 'message_start') currentMessageId = ev.message?.id ?? null;
          if (ev?.type === 'content_block_start' && ev.content_block?.type === 'tool_use' && initial?.prompt) initial.hasOutput = true;
          if (ev?.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            if (initial?.prompt && ev.delta.text) initial.hasOutput = true;
            ctx.emit('delta', { message_id: currentMessageId, text: ev.delta.text, parent_tool_use_id: msg.parent_tool_use_id ?? null }, { live: true });
          }
          break;
        }
        case 'assistant': {
          if (initial?.prompt && !initial.hasOutput && !initial.retrying && !initial.overridden
              && !msg.parent_tool_use_id && msg.error === 'model_not_found') {
            initial.rejected = true;
            break;
          }
          if (!msg.parent_tool_use_id && msg.message?.model && !msg.error) {
            lastTurnModel = msg.message.model;
            if (initial?.prompt && !initial.overridden && msg.message.model !== model) {
              model = msg.message.model;
              ctx.onEngineSession(resumeId, model);
            }
          }
          if (initial?.prompt && msg.message?.content?.length) initial.hasOutput = true;
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
              ctx.emit('tool_use', { tool_use_id: b.id, tool: b.name, input: b.input, ...(b.name === 'Bash' ? { live_shell: true } : {}), parent_tool_use_id: msg.parent_tool_use_id ?? null });
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
          if ((i?.rateLimitType === 'five_hour' || i?.rateLimitType === 'seven_day') && Number.isFinite(i.utilization)) {
            const reset = new Date(i.resetsAt * 1000);
            const window = {
              pct: i.utilization <= 1 ? i.utilization * 100 : i.utilization,
              resets_at: i.resetsAt && Number.isFinite(reset.getTime()) ? reset.toISOString() : null,
            };
            ctx.emit('usage_snapshot', { limits: { [i.rateLimitType]: window } });
          }
          break;
        }
        case 'result': {
          if (initial?.prompt && msg.is_error && await retryInitialTurn(stream)) break;
          if (initial?.prompt) finishInitialTurn();
          const isError = !interrupted && !!msg.is_error;
          const u = msg.usage || {};
          ctx.emit('turn_end', {
            interrupted,
            is_error: isError,
            usage: {
              input_tokens: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0),
              cache_read_input_tokens: u.cache_read_input_tokens || 0,
              cache_creation_input_tokens: u.cache_creation_input_tokens || 0,
              output_tokens: u.output_tokens || 0,
            },
            cost_usd: msg.total_cost_usd ?? null,
            duration_ms: msg.duration_ms ?? null,
            model: lastTurnModel ?? model ?? undefined,
          });
          const completed = !interrupted && !isError;
          interrupted = false;
          void emitContextUsage(stream);
          void readUsage(stream).then((usage) => {
            if (usage) ctx.emit('usage_snapshot', usage);
          });
          ctx.onTurnState(isError && msg.subtype !== 'success' ? 'error' : 'idle', completed ? 'turn_complete' : undefined);
          break;
        }
        default:
      }
    }
  }

  return {
    readUsage() {
      if (!running) start();
      return readUsage(q);
    },
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
      const message = { type: 'user', message: { role: 'user', content }, parent_tool_use_id: null, session_id: resumeId || '' };
      if (initial?.prompt) {
        initial.queued.push(message);
        return;
      }
      if (initial) initial.prompt = message;
      input.push(message);
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
      if (fallbackChange) {
        try { await fallbackChange; } catch { /* The previous turn reports the fallback error. */ }
      }
      if (initial) initial.overridden = true;
      try {
        if (!running) start();
        await q.setModel(m);
      } catch (err) {
        if (initial) initial.overridden = false;
        throw err;
      }
      model = m;
      if (initial && !initial.prompt) finishInitialTurn();
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
    const cut = c.name.lastIndexOf(':');
    byName.set(c.name, {
      name: c.name, description: c.description ?? '', argument_hint: c.argumentHint ?? '', builtin: !!c.builtin,
      // Plugin skills come back namespaced ("herdsman-project:delivery"); the UI matches on the part after it.
      ...(cut > 0 ? { plugin: c.name.slice(0, cut) } : {}),
    });
  }
  return [...byName.values()];
}
