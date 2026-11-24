// Engine giả lập (không gọi model), dùng cho contract test và demo UI không tốn API.
// - Trả lời lại prompt dưới dạng markdown, stream từng chữ.
// - Prompt chứa "edit" → xin quyền Edit; "bash" → xin quyền Bash.
// - Prompt chứa "slow" → stream chậm (để thử interrupt / tắt app giữa chừng).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function createEchoEngine(ctx) {
  let interrupted = false;
  let turn = 0;
  const sessionId = ctx.resumeId || `echo-${Date.now().toString(36)}`;
  let mode = ctx.mode;
  let model = ctx.model || 'echo';
  setTimeout(() => ctx.onEngineSession(sessionId, model), 0);

  async function run(text) {
    const id = `msg_${++turn}`;
    interrupted = false;
    const delay = /slow/i.test(text) ? 200 : 5;
    const reply = `You sent:\n\n> ${text}\n\n| Field | Value |\n|---|---|\n| Turn | ${turn} |\n| Mode | ${mode} |\n| Model | ${model} |\n`;
    let acc = '';
    for (const word of reply.split(/(?<=\s)/)) {
      if (interrupted) break;
      acc += word;
      ctx.emit('delta', { message_id: id, text: word }, { live: true });
      await sleep(delay);
    }
    ctx.emit('assistant_message', { message_id: id, blocks: [{ kind: 'text', text: acc }] });
    for (const [kw, tool, input] of [
      ['edit', 'Edit', { file_path: `${ctx.cwd}/README.md`, old_string: 'old', new_string: 'new' }],
      ['bash', 'Bash', { command: 'ls -la', description: 'List files' }],
    ]) {
      if (!interrupted && new RegExp(kw, 'i').test(text)) {
        const useId = `tu_${turn}_${tool}`;
        ctx.emit('tool_use', { tool_use_id: useId, tool, input });
        const auto = (mode === 'bypass') || ((mode === 'accept_edits' || mode === 'auto') && tool === 'Edit');
        const res = auto ? { decision: 'allow' } : await ctx.requestPermission(tool, input, { tool_use_id: useId });
        ctx.emit('tool_result', {
          tool_use_id: useId,
          is_error: res.decision !== 'allow',
          content: res.decision === 'allow' ? 'OK (simulated)' : 'The user denied this request.',
        });
      }
    }
    ctx.emit('turn_end', { interrupted, is_error: false, usage: { input_tokens: text.length, output_tokens: acc.length }, model });
    ctx.onTurnState('idle', interrupted ? undefined : 'turn_complete');
  }

  let chain = Promise.resolve();
  return {
    get engineSessionId() {
      return sessionId;
    },
    prompt(text) {
      chain = chain.then(() => run(text));
    },
    async interrupt() {
      interrupted = true;
    },
    async setPermissionMode(m) {
      mode = m;
    },
    async setModel(m) {
      model = m;
    },
    // Model giả lập để demo/test luồng đổi model không tốn API (specs/005 research R7).
    async listModels() {
      return [
        { value: 'echo', display_name: 'Echo', description: 'Simulated replies' },
        { value: 'echo-fast', display_name: 'Echo Fast', description: 'Simulated replies, faster' },
      ];
    },
    async listCommands() {
      return [
        { name: 'compact', description: 'Compact context', argument_hint: '', builtin: true },
        { name: 'echo-skill', description: 'Simulated project skill', argument_hint: '<text>', builtin: false },
      ];
    },
    shutdown() {},
  };
}
