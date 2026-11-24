#!/usr/bin/env node
// herdsman-agent: một session agent, chạy trong terminal của hc (không phải tiến trình con của app).
// Usage: node src/index.mjs --session <sid> --cwd <dir> --engine claude|codex|echo
//          [--permission-mode ask|accept_edits|auto|bypass|custom] [--model <m>] [--data-dir <dir>]
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import { parseArgs } from 'node:util';
import { EventLog, readMeta, writeMeta } from './eventlog.mjs';
import { SocketServer } from './socket.mjs';
import { reportStatus } from './osc.mjs';
import { printEvent } from './screen.mjs';
import { listenStdin } from './stdin.mjs';
import { createClaudeEngine } from './engines/claude.mjs';
import { createCodexEngine } from './engines/codex.mjs';
import { createEchoEngine } from './engines/echo.mjs';

const { values: args } = parseArgs({
  options: {
    session: { type: 'string' },
    cwd: { type: 'string' },
    engine: { type: 'string', default: 'claude' },
    'codex-binary': { type: 'string' },
    'permission-mode': { type: 'string', default: 'ask' },
    model: { type: 'string' },
    'inherited-model': { type: 'boolean', default: false },
    'data-dir': { type: 'string' },
    resume: { type: 'boolean', default: false },
  },
});

if (!args.session || !args.cwd) {
  console.error('missing --session or --cwd');
  process.exit(2);
}

const MODES = new Set(['ask', 'accept_edits', 'auto', 'bypass']);
if (args.engine === 'codex') MODES.add('custom');
const dataDir = args['data-dir'] || process.env.HERDSMAN_DATA_DIR || path.join(os.homedir(), 'Library/Application Support/app.herdsman');
const sid = args.session;
const sessionDir = path.join(dataDir, 'sessions', sid);
const sockPath = path.join(dataDir, 'sock', `${sid}.sock`);

const log = new EventLog(sessionDir);
const meta = readMeta(sessionDir);
let mode = MODES.has(meta.permission_mode) ? meta.permission_mode : MODES.has(args['permission-mode']) ? args['permission-mode'] : 'auto';
let status = 'idle';
const pending = new Map(); // id → resolve

let server;

function emit(type, fields = {}, { live = false } = {}) {
  const event = live ? { seq: null, ts: Date.now(), type, ...fields } : log.append(type, fields);
  server?.broadcast(event);
  if (!live) printEvent(event);
  return event;
}

function setStatus(state, kind) {
  if (status === state && !kind) return;
  status = state;
  emit('status', { state, kind: kind ?? null });
  reportStatus(state, { kind });
}

function saveMeta(patch) {
  Object.assign(meta, patch);
  writeMeta(sessionDir, meta);
}

// Request quyền còn treo từ lần chạy trước không còn promise nào chờ: đóng lại cho UI khỏi hiện hộp cũ.
{
  const open = new Map();
  for (const ev of log.readFrom(0)) {
    if (ev.type === 'permission_request') open.set(ev.id, ev);
    if (ev.type === 'permission_resolved') open.delete(ev.id);
  }
  for (const id of open.keys()) log.append('permission_resolved', { id, decision: 'cancelled', by: 'restart' });
}

function requestPermission(tool, input, extra = {}, signal) {
  const id = `perm_${log.seq + 1}`;
  return new Promise((resolve) => {
    const cancel = () => {
      if (!pending.delete(id)) return;
      emit('permission_resolved', { id, decision: 'cancelled', by: 'engine' });
      if (pending.size === 0) setStatus('working');
      resolve({ decision: 'deny' });
    };
    if (signal?.aborted) {
      resolve({ decision: 'deny' });
      return;
    }
    signal?.addEventListener('abort', cancel, { once: true });
    pending.set(id, (result) => {
      signal?.removeEventListener('abort', cancel);
      resolve(result);
    });
    emit('permission_request', { id, tool, input, cwd: args.cwd, ...extra });
    setStatus('blocked', 'permission');
  });
}

const resumeId = meta.engine_session_id;
// A stored null means the session has already fallen back to Claude's default.
let currentModel = Object.hasOwn(meta, 'model') ? meta.model : (args.model ?? null);
const inheritedModel = !!currentModel && (meta.inherited_model ?? (!meta.engine && args['inherited-model']));
const ctx = {
  cwd: args.cwd,
  mode,
  model: currentModel ?? undefined,
  inheritedModel,
  resumeId,
  emit,
  requestPermission,
  onEngineSession(id, model) {
    if (id && id !== meta.engine_session_id) saveMeta({ engine_session_id: id });
    if (model && model !== meta.model) saveMeta({ model });
    if (model) currentModel = model;
    emit('engine_session', { engine_session_id: id, model: model ?? null });
  },
  onModelFallback(unavailable) {
    currentModel = null;
    saveMeta({ model: null, inherited_model: false });
    emit('model_fallback', {
      unavailable_model: unavailable,
      message: `Claude model "${unavailable}" is unavailable. Retrying with Claude’s default model.`,
    });
  },
  onInitialModelSettled() {
    if (meta.inherited_model) saveMeta({ inherited_model: false });
  },
  onTurnState(state, kind) {
    if (pending.size === 0) setStatus(state, kind);
  },
};
const codexEvents = args.engine === 'codex' ? log.readFrom(0) : [];
const engine = args.engine === 'codex'
  ? createCodexEngine({
      ...ctx,
      codexBinary: args['codex-binary'] || 'codex',
      recordedCodexItems: codexEvents.flatMap((event) => [event.codex_item_id, event.message_id].filter(Boolean)),
      recordedCodexTurns: codexEvents.map((event) => event.codex_turn_id).filter(Boolean),
      codexHistoryImported: codexEvents.some((event) => event.type === 'codex_history_imported'),
      unusedCodexThread: codexEvents.some((event) => event.type === 'session_started' && !event.resumed)
        && !codexEvents.some((event) => event.type === 'user_message'),
    })
  : args.engine === 'echo' ? createEchoEngine(ctx) : createClaudeEngine(ctx);

function submitPrompt(text, images = [], source = 'app') {
  const stored = [];
  try {
    const dir = path.join(sessionDir, 'images');
    if (images.length) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const attachments = images.map(({ media_type, data_b64 }) => {
      const attachment_id = randomUUID().replaceAll('-', '');
      const file = path.join(dir, attachment_id);
      const fd = fs.openSync(file, 'wx', 0o600);
      stored.push(file);
      try {
        fs.writeFileSync(fd, data_b64);
      } finally {
        fs.closeSync(fd);
      }
      return { media_type, attachment_id };
    });
    emit('user_message', { text, images: attachments, source });
  } catch {
    for (const file of stored) {
      try { fs.unlinkSync(file); } catch { /* The session directory may already be gone. */ }
    }
    throw Object.assign(new Error('Could not save the message and its images'), { code: 'message_storage' });
  }
  setStatus('working');
  engine.prompt(text, images);
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  engine.shutdown();
  setStatus('done');
  setTimeout(() => {
    server?.close();
    process.exit(code);
  }, 200);
}

async function onCommand(cmd) {
  switch (cmd.cmd) {
    case 'prompt':
      if (!cmd.text?.trim()) throw Object.assign(new Error('empty prompt'), { code: 'empty_prompt' });
      submitPrompt(cmd.text, cmd.images || []);
      return;
    case 'interrupt':
      await engine.interrupt();
      return;
    case 'permission_response': {
      const resolve = pending.get(cmd.id);
      if (!resolve) throw Object.assign(new Error('no such request'), { code: 'unknown_request' });
      pending.delete(cmd.id);
      const decision = cmd.decision === 'allow' ? 'allow' : 'deny';
      emit('permission_resolved', { id: cmd.id, decision, by: 'user' });
      if (pending.size === 0) setStatus('working');
      resolve({ decision, updated_input: cmd.updated_input });
      return;
    }
    case 'set_permission_mode':
      if (!MODES.has(cmd.mode)) throw Object.assign(new Error('invalid mode'), { code: 'bad_mode' });
      await engine.setPermissionMode(cmd.mode);
      mode = cmd.mode;
      saveMeta({ permission_mode: mode });
      emit('permission_mode_changed', { mode });
      return;
    case 'list_models': {
      if (typeof engine.listModels !== 'function') throw Object.assign(new Error('This engine cannot switch models'), { code: 'unsupported' });
      // The engine's "default" row is only an alias: report the model it resolves to and leave it out of the list.
      const all = await engine.listModels();
      const def = all.find((m) => m.value === 'default');
      const models = all.filter((m) => m.value !== 'default');
      return { type: 'models', models, current: currentModel, default_model: def?.resolved_model ?? null };
    }
    case 'list_commands': {
      if (typeof engine.listCommands !== 'function') throw Object.assign(new Error('This engine has no slash commands'), { code: 'unsupported' });
      return { type: 'commands', commands: await engine.listCommands() };
    }
    case 'set_model': {
      const model = typeof cmd.model === 'string' ? cmd.model.trim() : '';
      if (!model) throw Object.assign(new Error('model must be a non-empty string'), { code: 'bad_model' });
      if (model === currentModel) return;
      try {
        await engine.setModel(model);
      } catch (err) {
        throw Object.assign(new Error(String(err?.message || err)), { code: 'engine' });
      }
      const previous = currentModel;
      currentModel = model;
      saveMeta({ model, inherited_model: false });
      emit('model_changed', { model, previous });
      return;
    }
    case 'shutdown':
      shutdown(0);
      return;
    default:
      throw Object.assign(new Error(`unknown command: ${cmd.cmd}`), { code: 'unknown_command' });
  }
}

server = new SocketServer(sockPath, {
  log,
  info: () => ({ session_id: sid, engine: args.engine, status, permission_mode: mode, engine_session_id: meta.engine_session_id ?? null }),
  onCommand,
});
saveMeta({ engine: args.engine, cwd: args.cwd, permission_mode: mode, model: currentModel, inherited_model: inheritedModel });
await server.listen();

emit('session_started', { engine: args.engine, model: ctx.model ?? null, cwd: args.cwd, permission_mode: mode, resumed: !!resumeId });
reportStatus('idle');

listenStdin({
  onSubmit: (text) => submitPrompt(text, [], 'hc_send'),
  onInterrupt: () => engine.interrupt(),
});

for (const sig of ['SIGTERM', 'SIGHUP', 'SIGINT']) process.on(sig, () => shutdown(0));
process.on('uncaughtException', (err) => {
  emit('error', { code: 'sidecar', message: String(err?.stack || err), recoverable: false });
  setStatus('error');
});
