// shortcut: The SDK exposes a bounded tail after task registration. Switch to full live output if the SDK exposes it.
export function trackClaudeShells(stream, emit) {
  const tasks = new Map();
  let timer;

  function update(task, fields) {
    if (Object.entries(fields).every(([key, value]) => task.state[key] === value)) return;
    Object.assign(task.state, fields);
    emit('shell_update', { tool_use_id: task.toolUseId, ...fields });
  }

  async function read(id, task, final = false) {
    if (task.reading && !final) return;
    task.reading = true;
    try {
      const result = await stream.getTaskOutput(id);
      if (tasks.get(id) !== task || task.finishing !== final) return;
      if (result.output || !task.state.output) {
        update(task, { output: result.output, truncated: result.truncated, unavailable: false });
      }
    } catch {
      if (tasks.get(id) === task && task.finishing === final) update(task, { unavailable: true });
    } finally {
      task.reading = false;
    }
  }

  function stopTimerIfIdle() {
    if (tasks.size) return;
    clearInterval(timer);
    timer = undefined;
  }

  return {
    start(msg) {
      if (msg.task_type !== 'local_bash' || !msg.task_id || !msg.tool_use_id || tasks.has(msg.task_id)) return;
      const task = { toolUseId: msg.tool_use_id, finishing: false, reading: false, state: {} };
      tasks.set(msg.task_id, task);
      update(task, { status: 'running', background: !!msg.is_backgrounded });
      if (typeof stream.getTaskOutput !== 'function') {
        update(task, { unavailable: true });
        return;
      }
      void read(msg.task_id, task);
      timer ??= setInterval(() => {
        for (const [id, active] of tasks) {
          if (!active.finishing) void read(id, active);
        }
      }, 500);
      timer.unref();
    },
    background(msg) {
      const task = tasks.get(msg.task_id);
      if (task && msg.patch?.is_backgrounded === true) update(task, { background: true });
    },
    async finish(msg) {
      const task = tasks.get(msg.task_id);
      if (!task || task.finishing) return;
      task.finishing = true;
      if (typeof stream.getTaskOutput === 'function') await read(msg.task_id, task, true);
      const status = msg.status === 'completed' ? 'success' : msg.status === 'failed' ? 'failed' : 'interrupted';
      update(task, { status });
      tasks.delete(msg.task_id);
      stopTimerIfIdle();
    },
    close() {
      for (const task of tasks.values()) update(task, { status: 'unknown', unavailable: true });
      tasks.clear();
      stopTimerIfIdle();
    },
  };
}
