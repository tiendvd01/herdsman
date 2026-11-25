import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function connectCodex(binary, cwd, onEvent = () => {}, onExit = () => {}) {
  const child = spawn(binary, ['app-server', '--listen', 'stdio://'], {
    cwd,
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  const requests = new Map();
  let nextId = 0;
  let ended = false;
  function disconnected() {
    if (ended) return;
    ended = true;
    for (const { reject, timer } of requests.values()) {
      clearTimeout(timer);
      reject(new Error('Codex App Server disconnected. Check your Codex installation.'));
    }
    requests.clear();
    onExit();
  }
  child.once('error', disconnected);
  child.once('exit', disconnected);
  child.stdin.on('error', disconnected);

  function write(message) {
    if (!ended) child.stdin.write(JSON.stringify(message) + '\n');
  }
  createInterface({ input: child.stdout }).on('line', (line) => {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    if (!message.method && requests.has(message.id)) {
      const { resolve, reject, method, timer } = requests.get(message.id);
      requests.delete(message.id);
      clearTimeout(timer);
      if (message.error) reject(new Error(`Codex rejected ${method}. Check sign-in, workspace and thread availability.`));
      else resolve(message.result);
    } else if (message.method) {
      const respond = (result) => write({ id: message.id, result });
      const unsupported = () => write({ id: message.id, error: { code: -32601, message: 'Unsupported request' } });
      void Promise.resolve().then(() => onEvent(message, respond, unsupported)).catch(() => {
        if (message.id != null) unsupported();
      });
    }
  });

  const rpc = {
    request(method, params) {
      if (ended) return Promise.reject(new Error('Codex App Server is unavailable.'));
      return new Promise((resolve, reject) => {
        const id = ++nextId;
        const timer = setTimeout(() => {
          requests.delete(id);
          reject(new Error(`Codex timed out during ${method}.`));
        }, 15000);
        requests.set(id, { method, resolve, reject, timer });
        write({ id, method, params });
      });
    },
    close() { child.kill(); },
  };
  rpc.ready = rpc.request('initialize', { clientInfo: { name: 'herdsman', title: 'Herdsman', version: '0.1.0' } })
    .then(() => write({ method: 'initialized' }));
  return rpc;
}

async function verifyAccount(rpc, binary) {
  await rpc.ready;
  const account = await rpc.request('account/read', { refreshToken: false });
  if (account.requiresOpenaiAuth && !account.account) {
    const command = "'" + binary.replaceAll("'", "'\\''") + "' login";
    throw new Error(`Run ${command} in a terminal to sign in, then try again.`);
  }
}

function sameDirectory(left, right) {
  try { return realpathSync(left) === realpathSync(right); } catch { return false; }
}

async function readThread(rpc, cwd, threadId, includeTurns) {
  const { thread } = await rpc.request('thread/read', { threadId, includeTurns });
  if (!sameDirectory(thread.cwd, cwd)) throw new Error('This Codex thread belongs to a different workspace folder.');
  if (thread.status?.type === 'active') throw new Error('Finish the current Codex turn before opening this thread.');
  return thread;
}

export async function probeCodex(binary, cwd, action, threadId) {
  const rpc = connectCodex(binary, cwd);
  try {
    await verifyAccount(rpc, binary);
    if (action === 'check') return null;
    if (action === 'read') {
      const thread = await readThread(rpc, cwd, threadId, false);
      return { id: thread.id, name: thread.name || thread.preview || thread.id };
    }
    const threads = [];
    let cursor;
    do {
      const page = await rpc.request('thread/list', {
        cwd, cursor, archived: false, currentAccountOnly: true, sourceKinds: ['cli', 'exec'], limit: 100,
      });
      threads.push(...page.data.filter((thread) => sameDirectory(thread.cwd, cwd)).map((thread) => ({
        id: thread.id, name: thread.name || thread.preview || thread.id,
      })));
      cursor = page.nextCursor;
    } while (cursor);
    return threads;
  } finally {
    rpc.close();
  }
}

export function createCodexEngine(ctx) {
  let model = ctx.model;
  let threadId = ctx.resumeId;
  let turnId;
  let mode = ctx.mode;
  let active;
  let queue = Promise.resolve();
  let stopped = false;
  const changes = new Map();
  const tools = new Set();
  const approvals = new Map();
  const recordedItems = new Set(ctx.recordedCodexItems);
  const recordedTurns = new Set(ctx.recordedCodexTurns);
  let rpc;
  let hasPermissionOverride = false;
  function connect() {
    const connection = connectCodex(ctx.codexBinary, ctx.cwd, (...args) => {
      if (rpc === connection) return onEvent(...args);
    }, () => {
      if (rpc !== connection) return;
      for (const controller of approvals.values()) controller.abort();
      if (!stopped) fail(new Error('Codex disconnected. Resume the session to reconnect.'));
      active?.();
    });
    return connection;
  }
  rpc = connect();

  function fail(error) {
    ctx.emit('assistant_message', {
      message_id: `codex-error-${Date.now()}`,
      blocks: [{ kind: 'text', text: error.message }],
    });
    ctx.emit('turn_end', { interrupted: false, is_error: true, usage: null, model });
    ctx.onTurnState('error');
  }

  function recordMessage(item) {
    if (recordedItems.has(item.id)) return;
    if (item.type === 'agentMessage') {
      ctx.emit('assistant_message', { message_id: item.id, blocks: [{ kind: 'text', text: item.text }] });
    } else if (item.type === 'userMessage') {
      const text = item.content.filter((part) => part.type === 'text').map((part) => part.text).join('\n');
      ctx.emit('user_message', { text, images: [], source: 'terminal', codex_item_id: item.id });
    } else return;
    recordedItems.add(item.id);
  }

  async function onEvent({ id, method, params }, respond, unsupported) {
    if (id != null) {
      const command = method === 'item/commandExecution/requestApproval';
      const file = method === 'item/fileChange/requestApproval';
      if (!command && !file) { unsupported(); return; }
      const diff = changes.get(params.itemId);
      const input = command && typeof params.command === 'string' && params.command.trim() &&
        !params.networkApprovalContext && (!params.kind || params.kind === 'command')
        ? { command: params.command, cwd: params.cwd }
        : file && diff?.length && diff.every((change) => change.path && change.diff)
          ? { file_path: diff.map((change) => change.path).join(', '), unified_diff: diff.map((change) => `--- ${change.path}\n${change.diff}`).join('\n') }
          : null;
      if (!input || params.threadId !== threadId) { respond({ decision: 'decline' }); return; }
      const tool = command ? 'Bash' : 'Edit';
      if (!tools.has(params.itemId)) {
        ctx.emit('tool_use', { tool_use_id: params.itemId, tool, input });
        tools.add(params.itemId);
      }
      const controller = new AbortController();
      approvals.set(id, controller);
      try {
        const result = await ctx.requestPermission(tool, input, {
          tool_use_id: params.itemId, cwd: input.cwd || ctx.cwd,
        }, controller.signal);
        if (!controller.signal.aborted) respond({ decision: result.decision === 'allow' ? 'accept' : 'decline' });
      } finally {
        approvals.delete(id);
      }
      return;
    }
    if (params?.threadId !== threadId) return;
    if (method === 'serverRequest/resolved') approvals.get(params.requestId)?.abort();
    if (!active) return;
    const { item, turn } = params;
    if (method === 'turn/started') turnId = turn.id;
    if (method === 'item/agentMessage/delta') {
      ctx.emit('delta', { message_id: params.itemId, text: params.delta }, { live: true });
    }
    if (method === 'item/started' && item.type === 'fileChange') changes.set(item.id, item.changes);
    if (method === 'item/completed') {
      if (item.type === 'userMessage') recordedItems.add(item.id);
      else recordMessage(item);
      if (tools.delete(item.id)) {
        ctx.emit('tool_result', { tool_use_id: item.id, is_error: item.status !== 'completed', content: item.aggregatedOutput || item.status });
      }
      changes.delete(item.id);
    }
    if (method === 'turn/completed') {
      for (const controller of approvals.values()) controller.abort();
      const interrupted = turn.status === 'interrupted';
      const errored = turn.status === 'failed';
      if (errored) fail(new Error('The Codex turn failed. Check Codex sign-in and configuration, then try again.'));
      else {
        ctx.emit('turn_end', { interrupted, is_error: false, usage: null, model, codex_turn_id: turn.id });
        ctx.onTurnState('idle', interrupted ? undefined : 'turn_complete');
      }
      recordedTurns.add(turn.id);
      active();
    }
  }

  const permissions = (selectedMode) => {
    if (selectedMode === 'custom') return {};
    const sandbox = selectedMode === 'bypass' ? 'danger-full-access'
      : selectedMode === 'ask' ? 'read-only' : 'workspace-write';
    return {
      approvalPolicy: selectedMode === 'bypass' ? 'never' : 'on-request',
      approvalsReviewer: selectedMode === 'accept_edits' ? 'auto_review' : 'user',
      sandbox,
    };
  };
  const initialized = verifyAccount(rpc, ctx.codexBinary).then(async () => {
    const settings = { cwd: ctx.cwd, model };
    const importing = !!threadId && !ctx.codexHistoryImported;
    if (importing) {
      const thread = await readThread(rpc, ctx.cwd, threadId, true);
      for (const turn of thread.turns) {
        if (recordedTurns.has(turn.id)) continue;
        for (const item of turn.items) recordMessage(item);
        ctx.emit('codex_history_turn', { codex_turn_id: turn.id });
      }
    }
    let result;
    if (threadId) {
      try {
        result = await rpc.request('thread/resume', { ...settings, threadId, excludeTurns: true });
      } catch (error) {
        // Codex may have allocated an ID without saving a rollout before the first prompt.
        if (!ctx.unusedCodexThread) throw error;
      }
    }
    result ??= await rpc.request('thread/start', settings);
    threadId = result.thread.id;
    model = result.model;
    if (!ctx.codexHistoryImported) ctx.emit('codex_history_imported');
    ctx.onEngineSession(threadId, model);
  });
  initialized.catch((error) => { if (!stopped) fail(error); });

  return {
    prompt(text, images) {
      queue = queue.then(async () => {
        try { await initialized; } catch { ctx.onTurnState('error'); return; }
        if (stopped) return;
        ctx.onTurnState('working');
        const completed = new Promise((resolve) => {
          active = () => { active = undefined; turnId = undefined; resolve(); };
        });
        try {
          const input = [{ type: 'text', text, text_elements: [] }, ...images.map((image) => ({
            type: 'image', url: `data:${image.media_type};base64,${image.data_b64}`,
          }))];
          const { sandbox, ...approval } = permissions(mode);
          if (!sandbox && hasPermissionOverride) {
            // Turn overrides persist on the live thread. Reopen it with a fresh
            // App Server so Codex resolves permissions from its configuration.
            const replacement = connect();
            try {
              await verifyAccount(replacement, ctx.codexBinary);
              await replacement.request('thread/resume', { cwd: ctx.cwd, threadId, model, excludeTurns: true });
              if (stopped) {
                replacement.close();
                return;
              }
              const previous = rpc;
              rpc = replacement;
              previous.close();
              hasPermissionOverride = false;
            } catch (error) {
              replacement.close();
              throw error;
            }
          }
          const sandboxPolicy = sandbox === 'danger-full-access' ? { type: 'dangerFullAccess' }
            : sandbox === 'read-only' ? { type: 'readOnly', networkAccess: false }
            : sandbox === 'workspace-write' ? {
              type: 'workspaceWrite', writableRoots: [], networkAccess: false,
              excludeTmpdirEnvVar: false, excludeSlashTmp: false,
            } : undefined;
          hasPermissionOverride ||= Boolean(sandbox);
          await rpc.request('turn/start', { threadId, input, model, ...approval, sandboxPolicy });
          await completed;
        } catch (error) {
          active?.();
          if (!stopped) fail(error);
        }
      });
    },
    async interrupt() {
      if (turnId) await rpc.request('turn/interrupt', { threadId, turnId });
    },
    async setPermissionMode(next) {
      mode = next;
    },
    async setModel(next) { model = next; },
    async listModels() {
      await rpc.ready;
      const { data } = await rpc.request('model/list', {});
      return data.map((row) => ({ value: row.model, display_name: row.displayName, description: row.description }));
    },
    shutdown() { stopped = true; rpc.close(); },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await probeCodex(...process.argv.slice(2))));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
