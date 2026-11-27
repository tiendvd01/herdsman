import { constants } from 'node:fs';
import { access, readdir, realpath, stat } from 'node:fs/promises';
import { isAbsolute, join, relative, sep } from 'node:path';

const extraRoots = new WeakMap();

function within(root, path) {
  const rest = relative(root, path);
  return rest !== '..' && !rest.startsWith(`..${sep}`) && !isAbsolute(rest);
}

async function localPath(workspace, path, directory = false) {
  try {
    const target = await realpath(path);
    if (!within(workspace, target)) return;
    const info = await stat(target);
    if (directory ? !info.isDirectory() : !info.isFile()) return;
    await access(target, constants.R_OK | (directory ? constants.X_OK : 0));
    return target;
  } catch {
    // Unreadable, missing and broken entries are omitted from the catalog.
  }
}

async function skillDirectories(workspace, root) {
  const entries = root ? await readdir(root).catch(() => []) : [];
  const candidates = await Promise.all(entries.map(async (name) => {
    const directory = await localPath(workspace, join(root, name), true);
    const path = directory && await localPath(workspace, join(directory, 'SKILL.md'));
    return path && [path, directory];
  }));
  return new Map(candidates.filter(Boolean));
}

export async function listCodexWorkspaceSkills(rpc, cwd) {
  const workspace = await realpath(cwd);
  const [agents, claude] = await Promise.all([
    localPath(workspace, join(workspace, '.agents/skills'), true),
    localPath(workspace, join(workspace, '.claude/skills'), true),
  ]);
  const [agentsTargets, claudeTargets] = await Promise.all([
    skillDirectories(workspace, agents), skillDirectories(workspace, claude),
  ]);
  const roots = [...new Set(claudeTargets.values())].sort();
  const registered = extraRoots.get(rpc) ?? [];
  if (roots.length !== registered.length || roots.some((root, i) => root !== registered[i])) {
    // Register validated skill directories individually so Codex cannot follow an unrelated link in .claude/skills.
    await rpc.request('skills/extraRoots/set', { extraRoots: roots });
    extraRoots.set(rpc, roots);
  }
  const { data } = await rpc.request('skills/list', { cwds: [workspace], forceReload: true });

  const skills = new Map();
  const unavailable = new Map();
  for (const row of data) {
    if (row.cwd !== workspace) continue;
    for (const skill of row.skills) {
      if (skill.pluginId || typeof skill.path !== 'string' || !isAbsolute(skill.path)) continue;
      const path = await localPath(workspace, skill.path);
      // Codex reports canonical paths, including targets of links under .agents/skills.
      const fromAgents = !!path && ((agents && within(agents, path)) || agentsTargets.has(path));
      const fromClaude = claudeTargets.has(path);
      if (!fromAgents && !fromClaude) {
        if (skill.scope === 'repo') unavailable.set(skill.name, 'it is outside the workspace or unreadable');
        continue;
      }
      if (!skill.enabled) {
        unavailable.set(skill.name, 'it is disabled in Codex');
        continue;
      }
      if (skills.has(skill.name) && (skills.get(skill.name).fromAgents || !fromAgents)) continue;
      skills.set(skill.name, { ...skill, fromAgents });
    }
  }
  return { skills, unavailable };
}
