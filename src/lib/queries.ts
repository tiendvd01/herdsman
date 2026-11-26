import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export const qk = {
  appInfo: ['appInfo'] as const,
  projects: ['projects'] as const,
  workspaces: (projectId: string, archived = false) => ['workspaces', projectId, archived] as const,
  allWorkspaces: ['workspaces'] as const,
  sessions: (workspaceId: string) => ['sessions', workspaceId] as const,
  allSessions: ['sessions'] as const,
  historySessions: ['sessions', 'history'] as const,
  allWorkspaceTerminals: ['workspace-terminals'] as const,
  workspaceTerminals: (workspaceId: string) => ['workspace-terminals', workspaceId] as const,
  agentTree: (sessionId: string) => ['agentTree', sessionId] as const,
  gitHistory: (workspaceId: string) => ['git-history', workspaceId] as const,
  files: (workspaceId: string) => ['files', workspaceId] as const,
  projectFilesChanged: (projectId: string) => ['files', 'project', projectId] as const,
};

/** Installed font families (spec 010); fetched once per app run. */
export const useFontFamilies = () => useQuery({ queryKey: ['fontFamilies'], queryFn: api.fontFamilies, staleTime: Infinity, retry: false });
export const useAppInfo = () => useQuery({ queryKey: qk.appInfo, queryFn: api.appInfo, refetchInterval: 15000 });
export const useProjects = () => useQuery({ queryKey: qk.projects, queryFn: api.projectList });
export const useWorkspaces = (projectId: string | null, archived = false) =>
  useQuery({ queryKey: qk.workspaces(projectId ?? '', archived), queryFn: () => api.workspaceList(projectId!, archived), enabled: !!projectId });
export const usePaletteWorkspaces = () =>
  useQuery({ queryKey: [...qk.allWorkspaces, 'palette'], queryFn: () => api.workspaceList(undefined, true) });
export const useSessions = (workspaceId: string | null) =>
  useQuery({ queryKey: qk.sessions(workspaceId ?? ''), queryFn: () => api.sessionHistory(workspaceId!), enabled: !!workspaceId });
