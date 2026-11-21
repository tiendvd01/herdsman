// DEV ONLY: open http://localhost:1420/?mock in a browser to preview the UI without Tauri.
// Fakes the backend with @tauri-apps/api/mocks and sample data; never loaded in a build.
import { mockIPC, mockWindows } from '@tauri-apps/api/mocks';
import { emit } from '@tauri-apps/api/event';

const now = Date.now();
const P = { id: 'p1', name: 'herdsman', path: '/Users/dev/herdsman', sort: 1, created_at: now, missing: false };
const P2 = { id: 'p2', name: 'api-server', path: '/Users/dev/api-server', sort: 2, created_at: now, missing: false };
const WS = [
  { id: 'w1', project_id: 'p1', name: 'Fix login OAuth', dir_kind: 'worktree', work_dir: '/Users/dev/.herdsman-worktrees/herdsman/fix-login', branch: 'herdsman/fix-login', base_branch: 'main', archived_at: null, worktree_removed: false, created_at: now },
  { id: 'w2', project_id: 'p1', name: 'Refactor store', dir_kind: 'project', work_dir: P.path, branch: null, base_branch: null, archived_at: null, worktree_removed: false, created_at: now - 5e6 },
  { id: 'w3', project_id: 'p2', name: 'Add rate limiting', dir_kind: 'project', work_dir: P2.path, branch: null, base_branch: null, archived_at: null, worktree_removed: false, created_at: now - 9e6 },
];
// s1 has no model set, like a fresh session on the engine default.
const S = (id: string, ws: string, title: string, status: string, mode = 'ask') => ({
  id, workspace_id: ws, engine: 'claude', hc_terminal: `t${id}`, title, status, permission_mode: mode, model: id === 's1' ? null : 'claude-opus-5-5',
  engine_session_id: null, last_seen_seq: 0, pinned_tab: true, created_at: now - 1e5, updated_at: now - 6e4, ended_at: null,
});
const SESSIONS = [S('s1', 'w1', 'Draw the login flow', 'blocked'), S('s2', 'w1', 'Write e2e tests', 'working', 'accept_edits'), S('s3', 'w2', 'Split the store', 'idle', 'bypass'), S('s4', 'w3', 'Rate limit', 'error')];

const t = (seq: number, e: Record<string, unknown>) => ({ seq, ts: now, ...e });
const EVENTS = [
  t(1, { type: 'session_started', engine: 'claude', model: 'claude-opus-5-5', cwd: WS[0].work_dir, permission_mode: 'ask', resumed: false }),
  t(2, { type: 'user_message', text: 'Draw the OAuth login flow, with a comparison table and a chart of failed logins per day, then update the README.', source: 'app' }),
  t(3, { type: 'assistant_message', message_id: 'm1', blocks: [{ kind: 'text', text: 'Here is the current **OAuth login flow**:\n\n```mermaid\nsequenceDiagram\n  participant U as User\n  participant A as App\n  participant G as Google\n  U->>A: Click "Sign in"\n  A->>G: Redirect /authorize\n  G-->>A: code\n  A->>G: Exchange code for token\n  G-->>A: access_token\n  A-->>U: Home page\n```\n\n| Step | Current | After fix |\n|---|---|---|\n| Token storage | localStorage | httpOnly cookie |\n| Refresh | None | Automatic |\n| PKCE | No | Yes |\n\nExpiry time: $t_{exp} = t_0 + 3600$\n\n```chart\n{"data":{"values":[{"day":"Mon","fails":12},{"day":"Tue","fails":7},{"day":"Wed","fails":15},{"day":"Thu","fails":4},{"day":"Fri","fails":2}]},"mark":{"type":"bar","cornerRadiusEnd":3},"encoding":{"x":{"field":"day","type":"nominal","title":"Day","sort":null},"y":{"field":"fails","type":"quantitative","title":"Failed logins"}},"height":160}\n```' }] }),
  t(4, { type: 'tool_use', tool_use_id: 'u1', tool: 'Bash', input: { command: 'pnpm test auth', description: 'Run auth tests' } }),
  t(5, { type: 'tool_result', tool_use_id: 'u1', is_error: false, content: '✓ auth/login.test.ts (6 tests)\n✓ auth/token.test.ts (4 tests)\n\nTest Files  2 passed' }),
  t(6, { type: 'tool_use', tool_use_id: 'u2', tool: 'Edit', input: { file_path: 'README.md', old_string: '## Sign-in\nTokens are stored in localStorage.', new_string: '## Sign-in\nTokens are stored in an httpOnly cookie.\nAutomatic refresh and PKCE.' } }),
  t(7, { type: 'permission_request', id: 'perm_7', tool: 'Edit', input: { file_path: 'README.md', old_string: '## Sign-in\nTokens are stored in localStorage.', new_string: '## Sign-in\nTokens are stored in an httpOnly cookie.\nAutomatic refresh and PKCE.' }, cwd: WS[0].work_dir }),
  t(8, { type: 'status', state: 'blocked', kind: 'permission' }),
  t(9, { type: 'usage_snapshot', context_pct: 42.3, limits: { five_hour: { pct: 83, resets_at: new Date(now + 2 * 3600e3 + 600e3).toISOString() }, seven_day: { pct: 12, resets_at: new Date(now + 3 * 86400e3).toISOString() } } }),
];

const MODELS = [
  { value: 'claude-opus-5-5', display_name: 'Opus 5.5', description: 'Most capable for complex work' },
  { value: 'claude-sonnet-5-5', display_name: 'Sonnet 5.5', description: 'Best for everyday tasks' },
  { value: 'claude-haiku-5-5', display_name: 'Haiku 5.5', description: 'Fastest for quick answers' },
  { value: 'claude-fable-5-2', display_name: 'Fable 5.2', description: 'Most capable for your hardest and longest-running tasks' },
  { value: 'claude-fable-5-1', display_name: 'Fable 5.1', description: 'Most capable for your hardest and longest-running tasks' },
  { value: 'claude-sonnet-5', display_name: 'Sonnet 5', description: 'Efficient for routine tasks' },
  { value: 'claude-opus-5', display_name: 'Opus 5', description: 'Best for everyday, complex tasks' },
  { value: 'claude-opus-4-8', display_name: 'Opus 4.8', description: 'Best for everyday, complex tasks' },
  { value: 'claude-opus-4-7', display_name: 'Opus 4.7', description: 'Best for everyday, complex tasks' },
  { value: 'claude-sonnet-4-6', display_name: 'Sonnet 4.6', description: 'Efficient for routine tasks' },
];
const sessionModel: Record<string, string> = {};
// Events appended after the fixed sample (e.g. model_changed), replayed on reopen like a real event log.
const extraEvents: Record<string, Record<string, unknown>[]> = {};
let mockSeq = 1000;

export function installDevMock() {
  mockWindows('main');
  mockIPC(
    (cmd, args) => {
      const a = (args ?? {}) as Record<string, string>;
      switch (cmd) {
        case 'font_families':
          return ['Andale Mono', 'Arial', 'Avenir Next', 'Courier New', 'DejaVu Sans Mono', 'Georgia', 'Helvetica Neue', 'Inter', 'JetBrains Mono', 'Menlo', 'Monaco', 'SF Mono', 'SF Pro', 'Times New Roman', 'Verdana'];
        case 'theme_files':
          return [];
        case 'app_info':
          return { hc_connected: true, hc_version: 'hc 0.1.21', hc_path: '/usr/local/bin/hc', node_path: '/usr/local/bin/node', data_dir: '~' };
        case 'project_list':
          return [{ ...P }, { ...P2 }];
        case 'project_rename': {
          const pr = [P, P2].find((x) => x.id === a.id);
          if (pr) pr.name = a.name;
          return pr ? { ...pr } : null;
        }
        case 'workspace_list':
          return WS.filter((w) => (!a.projectId || w.project_id === a.projectId) && !w.archived_at).map((w) => ({ ...w }));
        case 'workspace_rename': {
          const w = WS.find((x) => x.id === a.id);
          if (w) w.name = a.name;
          setTimeout(() => emit('workspace:changed', {}), 0);
          return w;
        }
        case 'workspace_archive': {
          const w = WS.find((x) => x.id === a.id);
          if (w) (w as { archived_at: number | null }).archived_at = Date.now();
          setTimeout(() => emit('workspace:changed', {}), 0);
          return w;
        }
        case 'workspace_delete': {
          const i = WS.findIndex((x) => x.id === a.id);
          if (i >= 0) WS.splice(i, 1);
          setTimeout(() => emit('workspace:changed', {}), 0);
          return null;
        }
        case 'workspace_dirty_check': {
          const w = WS.find((x) => x.id === a.id);
          return w?.dir_kind === 'worktree' ? { dirty: true, files: ['README.md'] } : { dirty: false, files: [] };
        }
        case 'session_history':
          return SESSIONS.filter((s) => s.workspace_id === a.workspaceId);
        case 'session_open':
          setTimeout(() => emit('session:events', { session_id: a.id, events: [...(a.id === 's1' ? EVENTS : EVENTS.slice(0, 2)), ...(extraEvents[a.id] ?? [])] }), 50);
          return null;
        case 'session_list_models':
          return { models: MODELS, current: sessionModel[a.id] ?? null, default_model: 'claude-opus-5-5' };
        case 'session_list_commands':
          return { commands: [
            { name: 'compact', description: 'Compact context', argument_hint: '', builtin: true },
            { name: 'init', description: 'Create CLAUDE.md for the project', argument_hint: '', builtin: true },
            { name: 'review', description: 'Review current changes', argument_hint: '', builtin: true },
            { name: 'speckit-plan', description: 'Execute the implementation planning workflow', argument_hint: '', builtin: false },
            { name: 'speckit-specify', description: 'Create or update the feature specification', argument_hint: '<description>', builtin: false },
          ] };
        case 'session_set_model': {
          const previous = sessionModel[a.id] ?? 'claude-opus-5-5';
          sessionModel[a.id] = a.model;
          const ev = { seq: ++mockSeq, ts: Date.now(), type: 'model_changed', model: a.model, previous };
          (extraEvents[a.id] ??= []).push(ev);
          const s = SESSIONS.find((x) => x.id === a.id);
          if (s) s.model = a.model;
          setTimeout(() => emit('session:events', { session_id: a.id, events: [ev] }), 50);
          return null;
        }
        case 'agent_tree':
          return { terminal: 't1', title: 'herdsman-agent', state: 'live', status: 'blocked', kind: 'permission', progress: null, children: [
            { terminal: 't7', title: 'reviewer', state: 'live', status: 'working', kind: null, progress: 60, children: [] },
            { terminal: 't9', title: 'tester', state: 'finished', status: null, kind: null, progress: null, children: [] },
          ] };
        case 'task_list':
          return [{ terminal: 't3', command: 'pnpm dev', state: 'live', exit_code: null, created_ms: now - 3e5 }, { terminal: 't4', command: 'cargo test', state: 'finished', exit_code: 0, created_ms: now - 9e5 }];
        case 'terminal_read':
          return '── herdsman-agent · claude · ~/herdsman\n› Draw the login flow…\n⏺ Bash pnpm test auth\n⏺ Edit README.md\n? Awaiting approval: Edit';
        case 'files_changed':
          return [{ status: 'M', path: 'README.md' }, { status: '??', path: 'src/auth/pkce.ts' }];
        case 'git_branches':
          return { is_repo: true, branches: ['main', 'develop'], current: 'main' };
        case 'plugin:webview|set_webview_zoom': {
          // Spec 006: no native webview here — preview the zoom with CSS zoom (see currentZoomFactor).
          const z = Number((args as Record<string, unknown>)?.value) || 1;
          document.documentElement.style.zoom = z === 1 ? '' : String(z);
          return null;
        }
        case 'search':
          return [{ session_id: 's1', seq: 2, snippet: 'Draw the OAuth [[login]] flow', workspace_id: 'w1', workspace_name: 'Fix login OAuth', workspace_archived: false, project_id: 'p1', project_name: 'herdsman', session_title: 'Draw the login flow' }];
        case 'claude_search':
          return [{ claude_session_id: 'c1', cwd: '/tmp/herdsman', title: 'Fix login OAuth', snippet: '…draw the OAuth login flow…', updated_at: Date.now() - 3600_000, workspace_id: 'w1', workspace_name: 'Fix login OAuth', project_id: 'p1', project_name: 'herdsman' }];
        default:
          return null;
      }
    },
    { shouldMockEvents: true },
  );
  // initial statuses for the sidebar (amber dot)
  setTimeout(() => {
    for (const s of SESSIONS) emit('status:changed', { session_id: s.id, workspace_id: s.workspace_id, state: s.status });
  }, 100);
}
