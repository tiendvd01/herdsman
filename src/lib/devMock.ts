// DEV ONLY: open http://localhost:1420/?mock in a browser to preview the UI without Tauri.
// Fakes the backend with @tauri-apps/api/mocks and sample data; never loaded in a build.
import { mockIPC, mockWindows } from '@tauri-apps/api/mocks';
import { emit } from '@tauri-apps/api/event';
import type { Workspace } from './types';

const now = Date.now();
// spec 072: names of servers Claude loads by itself that the mock project turned off.
const mockMcpDisabled = new Set(['docs-index']);
const P = { id: 'p1', name: 'herdsman', path: '/Users/dev/herdsman', sort: 1, created_at: now, missing: false };
const P2 = { id: 'p2', name: 'api-server', path: '/Users/dev/api-server', sort: 2, created_at: now, missing: false };
const SAMPLE_FILES = [
  { name: 'src', path: 'src', directory: true },
  { name: 'README.md', path: 'README.md', directory: false },
  { name: 'workspace.ts', path: 'src/workspace.ts', directory: false },
];
const WS: Workspace[] = [
  { id: 'w1', project_id: 'p1', name: 'Fix login OAuth', dir_kind: 'worktree', work_dir: '/Users/dev/.herdsman-worktrees/herdsman/fix-login', branch: 'herdsman/fix-login', base_branch: 'main', archived_at: null, worktree_removed: false, created_at: now },
  { id: 'w2', project_id: 'p1', name: 'Refactor store', dir_kind: 'project', work_dir: P.path, branch: null, base_branch: null, archived_at: null, worktree_removed: false, created_at: now - 5e6 },
  { id: 'w3', project_id: 'p2', name: 'Add rate limiting', dir_kind: 'project', work_dir: P2.path, branch: null, base_branch: null, archived_at: null, worktree_removed: false, created_at: now - 9e6 },
];
// s1 has no model set, like a fresh session on the engine default.
const S = (id: string, ws: string, title: string, status: string, mode = 'ask', engineSessionId: string | null = null) => ({
  id, workspace_id: ws, engine: 'claude', hc_terminal: `t${id}`, title, status, permission_mode: mode, model: id === 's1' ? null : 'claude-opus-5-5',
  engine_session_id: engineSessionId, last_seen_seq: 0, pinned_tab: true, created_at: now - 1e5, updated_at: now - 6e4, ended_at: null,
});
const SESSIONS = [S('s1', 'w1', 'Draw the login flow', 'blocked'), S('s2', 'w1', 'Write e2e tests', 'working', 'accept_edits'), S('s3', 'w2', 'Split the store', 'idle', 'bypass'), S('s4', 'w3', 'Rate limit', 'error')];

const t = (seq: number, e: Record<string, unknown>) => ({ seq, ts: now, ...e });
const LOGIN_PROMPT = 'Draw the OAuth login flow, with a comparison table and a chart of failed logins per day, then update the README.';
const EVENTS = [
  t(1, { type: 'session_started', engine: 'claude', model: 'claude-opus-5-5', cwd: WS[0].work_dir, permission_mode: 'ask', resumed: false }),
  t(2, { type: 'user_message', text: LOGIN_PROMPT, source: 'app' }),
  t(3, { type: 'assistant_message', message_id: 'm1', blocks: [{ kind: 'text', text: 'See [the README](README.md), src/workspace.ts, or [a missing file](docs/moved.md).\n\nHere is the current **OAuth login flow**:\n\n```mermaid\nsequenceDiagram\n  participant U as User\n  participant A as App\n  participant G as Google\n  U->>A: Click "Sign in"\n  A->>G: Redirect /authorize\n  G-->>A: code\n  A->>G: Exchange code for token\n  G-->>A: access_token\n  A-->>U: Home page\n```\n\n| Step | Current | After fix |\n|---|---|---|\n| Token storage | localStorage | httpOnly cookie |\n| Refresh | None | Automatic |\n| PKCE | No | Yes |\n\nExpiry time: $t_{exp} = t_0 + 3600$\n\n```chart\n{"data":{"values":[{"day":"Mon","fails":12},{"day":"Tue","fails":7},{"day":"Wed","fails":15},{"day":"Thu","fails":4},{"day":"Fri","fails":2}]},"mark":{"type":"bar","cornerRadiusEnd":3},"encoding":{"x":{"field":"day","type":"nominal","title":"Day","sort":null},"y":{"field":"fails","type":"quantitative","title":"Failed logins"}},"height":160}\n```' }] }),
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
  const fileContents = new Map<string, string>();
  const sampleFile = (path: string) => path === 'README.md' ? '# Herdsman\n\nA workspace for coding agents.\n' : 'export const workspace = "Herdsman";\n';
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
        case 'github_accounts':
          return ['personal-account', 'work-account'];
        case 'project_skill_catalog':
          return { sources: [{ id: 'shared', path: '~/herdsman/skills', available: true }], skills: [], enabled: [] };
        case 'project_skill_change':
          throw new Error('Managing skill sources requires the desktop app.');
        case 'mcp_catalog':
          return {
            servers: [
              { id: 'mcp1', name: 'github-tools', transport: 'stdio', command: 'npx', args: ['-y', '@acme/github-mcp'], url: null, env: [{ key: 'GITHUB_TOKEN', set: true }], headers: [], enabled: true, conflict: null },
              { id: 'mcp2', name: 'docs-search', transport: 'http', command: null, args: [], url: 'https://docs.example.com/mcp', env: [], headers: [{ key: 'Authorization', set: true }], enabled: false, conflict: null },
              { id: 'mcp3', name: 'sora-pms', transport: 'stdio', command: 'node', args: ['server.js'], url: null, env: [], headers: [], enabled: false, conflict: 'Claude already loads a server with this name' },
            ],
            native: [
              { name: 'sora-pms', transport: 'stdio', scope: 'user', source: '~/.claude.json' },
              { name: 'codegraph', transport: 'stdio', scope: 'project', source: '/Users/dev/herdsman/.mcp.json' },
              { name: 'codegraph', transport: 'stdio', scope: 'user', source: '~/.claude.json' },
              { name: 'docs-index', transport: 'http', scope: 'local', source: '~/.claude.json' },
            ].map((server) => ({ ...server, enabled: !mockMcpDisabled.has(server.name) })),
          };
        case 'mcp_native_toggle':
          if (a.enabled) mockMcpDisabled.delete(String(a.name));
          else mockMcpDisabled.add(String(a.name));
          return null;
        case 'mcp_server_remove':
          return { affected_projects: ['herdsman'] };
        case 'mcp_server_save':
        case 'mcp_project_toggle':
          throw new Error('Managing MCP servers requires the desktop app.');
        case 'project_rename': {
          const pr = [P, P2].find((x) => x.id === a.id);
          if (pr) pr.name = a.name;
          return pr ? { ...pr } : null;
        }
        case 'workspace_terminal_list':
          return [];
        case 'workspace_terminal_create':
          throw new Error('Terminal requires the desktop app.');
        case 'workspace_list':
          return WS.filter((w) => (!a.projectId || w.project_id === a.projectId) && (a.includeArchived || !w.archived_at)).map((w) => ({ ...w }));
        case 'workspace_rename': {
          const w = WS.find((x) => x.id === a.id);
          if (w) w.name = a.name;
          setTimeout(() => emit('workspace:changed', {}), 0);
          return w;
        }
        case 'workspace_delete':
        case 'workspace_archive': {
          const w = WS.find((x) => x.id === a.id);
          if (w) {
            w.archived_at = Date.now();
            if (cmd === 'workspace_delete') w.deleted_at = w.archived_at;
          }
          setTimeout(() => emit('workspace:changed', {}), 0);
          return cmd === 'workspace_delete' ? null : w;
        }
        case 'workspace_dirty_check': {
          const w = WS.find((x) => x.id === a.id);
          return w?.dir_kind === 'worktree' ? { dirty: true, files: ['README.md'] } : { dirty: false, files: [] };
        }
        case 'session_history':
          return SESSIONS.filter((s) => s.workspace_id === a.workspaceId);
        case 'session_set_pinned': {
          const session = SESSIONS.find((entry) => entry.id === a.id);
          if (session) session.pinned_tab = (args as { pinned: boolean }).pinned;
          return null;
        }
        case 'session_get':
          return SESSIONS.find((s) => s.id === a.id);
        case 'session_open':
          setTimeout(() => emit('session:events', { session_id: a.id, events: [...(a.id === 's1' ? EVENTS : a.id === 'cli-review' ? [] : EVENTS.slice(0, 2)), ...(extraEvents[a.id] ?? [])] }), 50);
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
            { name: 'herdsman-project:delivery', description: 'Open a delivery session for the pending work', argument_hint: '[link]', builtin: false, plugin: 'herdsman-project' },
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
        case 'terminal_read':
          return '── herdsman-agent · claude · ~/herdsman\n› Draw the login flow…\n⏺ Bash pnpm test auth\n⏺ Edit README.md\n? Awaiting approval: Edit';
        case 'project_files_list':
          return SAMPLE_FILES.filter(({ path }) => path.slice(0, Math.max(0, path.lastIndexOf('/'))) === a.path);
        case 'project_files_search': {
          const query = a.query.trim().toLowerCase();
          return query ? SAMPLE_FILES.filter(({ directory, path }) => !directory && path.toLowerCase().includes(query)) : [];
        }
        case 'project_file_read':
          return { text: fileContents.get(JSON.stringify([a.projectId, a.path])) ?? sampleFile(a.path), writable: true };
        case 'session_file_exists':
        case 'session_file_read': {
          const session = SESSIONS.find(({ id }) => id === a.sessionId);
          const workspace = WS.find(({ id }) => id === session?.workspace_id);
          if (!workspace) throw new Error('Workspace unavailable.');
          const target = new URL(a.path, `file://${workspace.work_dir}/`).pathname;
          if (!target.startsWith(`${workspace.work_dir}/`)) {
            if (cmd === 'session_file_exists') return false;
            throw new Error('The file is outside this workspace.');
          }
          const relative = decodeURIComponent(target.slice(workspace.work_dir.length + 1));
          const exists = SAMPLE_FILES.some(({ path, directory }) => path === relative && !directory);
          if (cmd === 'session_file_exists') return exists;
          if (!exists) {
            throw new Error('The file could not be found.');
          }
          const writable = workspace.dir_kind === 'project';
          const projectId = workspace.project_id;
          return {
            projectId,
            path: writable ? relative : `${workspace.work_dir}/${relative}`,
            document: { text: fileContents.get(JSON.stringify([projectId, relative])) ?? sampleFile(relative), writable },
          };
        }
        case 'absolute_file_read':
          return { text: sampleFile(a.path), writable: false };
        case 'absolute_files_search': {
          const folder = '/tmp/example';
          const path = `${folder}/notes.txt`;
          if (a.path === folder || a.path === `${folder}/` ||
              (a.path.startsWith(`${folder}/`) && 'notes.txt'.includes(a.path.slice(folder.length + 1).toLowerCase()))) {
            return [{ name: 'notes.txt', path, directory: false }];
          }
          return [];
        }
        case 'codex_threads':
          return [];
        case 'project_file_save': {
          const key = JSON.stringify([a.projectId, a.path]);
          if ((fileContents.get(key) ?? sampleFile(a.path)) !== a.baseline) {
            throw new Error('This file changed on disk.');
          }
          fileContents.set(key, a.text);
          return null;
        }
        case 'project_files_changed':
          return a.projectId === P.id
            ? [{ status: 'M', path: 'README.md' }, { status: '??', path: 'src/workspace.ts' }]
            : [];
        case 'git_history':
          return { commits: [
            { id: '1', short_id: '23abcde', subject: 'Merge workspace changes', parents: ['2', '3'], branches: [{ name: 'origin/develop', remote: true }] },
            { id: '2', short_id: '45abcde', subject: 'Refine file tree', parents: ['4'], branches: [{ name: 'develop', remote: false }] },
            { id: '3', short_id: '67abcde', subject: 'Update README', parents: ['4'] },
            { id: '4', short_id: '89abcde', subject: 'Initial commit', parents: [] },
          ], truncated: false };
        case 'files_changed':
          return [{ status: 'M', path: 'README.md' }, { status: '??', path: 'src/auth/pkce.ts' }];
        case 'git_commit_changes':
          return a.commit === '4' ? [] : [
            { path: 'README.md', status: 'M', original: null },
            { path: 'src/workspace.ts', status: 'A', original: null },
          ];
        case 'git_commit_file_diff':
          return `@@ -1 +1 @@\n-# Agent workspace\n+# Herdsman at commit ${a.commit}`;
        case 'file_diff':
          return '@@ -1 +1 @@\n-# Agent workspace\n+# Herdsman';
        case 'git_branches':
          return { is_repo: true, branches: ['main', 'develop'], checked_out: ['main'], default_branch: 'main', current: 'main' };
        case 'plugin:webview|set_webview_zoom':
          throw new Error('Native webview zoom is unavailable in the browser preview');
        case 'history_stored': {
          const query = a.query.trim().toLowerCase();
          return SESSIONS.flatMap((session) => {
            const workspace = WS.find((item) => item.id === session.workspace_id)!;
            if (a.workspaceId && a.workspaceId !== workspace.id) return [];
            const project = [P, P2].find((item) => item.id === workspace.project_id)!;
            const snippet = query && session.id === 's1' && LOGIN_PROMPT.toLowerCase().includes(query) ? LOGIN_PROMPT : null;
            if (!session.title.toLowerCase().includes(query) && !snippet) return [];
            return [{ session, workspace, project_name: project.name, snippet }];
          });
        }
        case 'history_claude': {
          const title = 'Review CLI changes';
          const message = 'Check the release notes before shipping.';
          const workspace = WS[2];
          const query = a.query.trim().toLowerCase();
          const snippet = query && message.toLowerCase().includes(query) ? message : '';
          const show = (!a.workspaceId || a.workspaceId === workspace.id) && (title.toLowerCase().includes(query) || !!snippet);
          return { partial: false, hits: show ? [{
            claude_session_id: 'cli-review', session_id: SESSIONS.find((item) => item.id === 'cli-review')?.id ?? null, cwd: workspace.work_dir, title, snippet,
            updated_at: now - 2e5, workspace_id: workspace.id, workspace_name: workspace.name,
            project_id: P2.id, project_name: P2.name,
          }] : [] };
        }
        case 'search': {
          const query = a.query.toLowerCase().trim();
          return SESSIONS.flatMap((session) => {
            const workspace = WS.find((w) => w.id === session.workspace_id)!;
            const project = [P, P2].find((p) => p.id === workspace.project_id)!;
            const excerpt = session.id === 's1' ? LOGIN_PROMPT : '';
            const snippet = excerpt.toLowerCase().includes(query) ? excerpt : '';
            if ((!query && !workspace.deleted_at) || (a.workspaceId && a.workspaceId !== workspace.id) || (a.projectId && a.projectId !== project.id)
              || (!session.title.toLowerCase().includes(query) && !snippet)) return [];
            return [{
              session_id: session.id, seq: snippet ? 2 : 0, snippet, workspace_id: workspace.id,
              workspace_name: workspace.name, workspace_archived: !!workspace.archived_at, project_id: project.id,
              project_name: project.name, session_title: session.title, engine_session_id: null,
            }];
          });
        }
        case 'claude_search': {
          const text = 'Draw the OAuth login flow';
          const workspace = WS[0];
          if (!text.toLowerCase().includes(a.query.trim().toLowerCase())
            || (a.workspaceId && a.workspaceId !== workspace.id) || (a.projectId && a.projectId !== P.id)) return [];
          return [{
            claude_session_id: 'c1', session_id: 's1', cwd: workspace.work_dir, title: 'Fix login OAuth',
            snippet: text, updated_at: now, workspace_id: workspace.id, workspace_name: workspace.name,
            project_id: P.id, project_name: P.name,
          }];
        }
        case 'claude_open': {
          if (a.claudeSessionId !== 'cli-review') return { session: SESSIONS[0], workspace: WS[0] };
          const workspace = WS[2];
          const session = SESSIONS.find((item) => item.id === 'cli-review')
            ?? S('cli-review', workspace.id, 'Review CLI changes', 'done', 'cli-review');
          if (!SESSIONS.includes(session)) {
            SESSIONS.push(session);
            extraEvents[session.id] = [t(3, { type: 'assistant_message', message_id: 'cli', blocks: [{ kind: 'text', text: 'Check the release notes before shipping.' }] })];
          }
          return { session, workspace };
        }
        case 'session_rehome': {
          const session = SESSIONS.find((s) => s.id === a.id)!;
          const previous = WS.find((w) => w.id === session.workspace_id)!;
          if (previous.deleted_at == null) return { session, workspace: previous };
          const workspace = { ...previous, id: `ws-${session.id}`, name: session.title, archived_at: null, deleted_at: null };
          Object.assign(session, { workspace_id: workspace.id, status: 'done' });
          WS.push(workspace);
          return { session, workspace };
        }
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
