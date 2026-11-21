#!/usr/bin/env node
// herdsman-agent: một session agent, chạy trong terminal của hc (không phải tiến trình con của app).
// Usage: node src/index.mjs --session <sid> --cwd <dir> --engine claude|echo
//          [--permission-mode ask|accept_edits|auto|bypass] [--model <m>] [--data-dir <dir>]
import path from 'node:path';
import os from 'node:os';
import { parseArgs } from 'node:util';
import { EventLog, readMeta, writeMeta } from './eventlog.mjs';
import { SocketServer } from './socket.mjs';
import { reportStatus } from './osc.mjs';
import { printEvent } from './screen.mjs';
import { listenStdin } from './stdin.mjs';
import { createClaudeEngine } from './engines/claude.mjs';
import { createEchoEngine } from './engines/echo.mjs';

const { values: args } = parseArgs({
  options: {
    session: { type: 'string' },
    cwd: { type: 'string' },
    engine: { type: 'string', default: 'claude' },
    'permission-mode': { type: 'string', default: 'ask' },
    model: { type: 'string' },
    'data-dir': { type: 'string' },
    resume: { type: 'boolean', default: false },
  },
});

if (!args.session || !args.cwd) {
  console.error('missing --session or --cwd');
  process.exit(2);
}

const MODES = new Set(['ask', 'accept_edits', 'auto', 'bypass']);
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

function requestPermission(tool, input, extra = {}) {
  const id = `perm_${log.seq + 1}`;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    emit('permission_request', { id, tool, input, cwd: args.cwd, ...extra });
    setStatus('blocked', 'permission');
  });
}

const resumeId = meta.engine_session_id;
// Model đã chọn (meta.model, lưu khi set_model) thắng --model: app không truyền --model khi resume,
// nên agent chạy lại vẫn dùng model người dùng chọn gần nhất (specs/005 FR-007).
let currentModel = meta.model || args.model || null;
const ctx = {
  cwd: args.cwd,
  mode,
  model: currentModel ?? undefined,
  resumeId,
  emit,
  requestPermission,
  onEngineSession(id, model) {
    if (id && id !== meta.engine_session_id) saveMeta({ engine_session_id: id });
    if (model && model !== meta.model) saveMeta({ model });
    if (model) currentModel = model;
    emit('engine_session', { engine_session_id: id, model: model ?? null });
  },
  onTurnState(state) {
    if (pending.size === 0) setStatus(state);
  },
};
const engine = args.engine === 'echo' ? createEchoEngine(ctx) : createClaudeEngine(ctx);

function submitPrompt(text, images = [], source = 'app') {
  emit('user_message', { text, images: images.map((i) => ({ media_type: i.media_type })), source });
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
      mode = cmd.mode;
      await engine.setPermissionMode(mode);
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
      saveMeta({ model });
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
await server.listen();
saveMeta({ engine: args.engine, cwd: args.cwd, permission_mode: mode });

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
