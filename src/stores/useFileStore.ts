import { create } from 'zustand';
import { api, errMsg, type ProjectFileDocument } from '@/lib/api';
import type { Project } from '@/lib/types';

export interface FileTab {
  id: string;
  projectId: string;
  path: string;
  name: string;
  document?: ProjectFileDocument;
  draft?: string;
  loadError?: string;
  saving?: boolean;
}

export interface DiffTab {
  id: string;
  projectId: string;
  workspaceId: string;
  path: string;
  name: string;
}

export const isDirty = (file: FileTab) => file.document !== undefined && file.draft !== file.document.text;

interface FileState {
  tabs: FileTab[];
  diffs: DiffTab[];
  openDiff: (projectId: string, workspaceId: string, path: string) => void;
  closeDiff: (id: string) => void;
  active: Record<string, string | undefined>;
  open: (project: Project, path: string, name: string) => Promise<void>;
  activate: (projectId: string, id?: string) => void;
  edit: (id: string, draft: string) => void;
  save: (id: string) => Promise<void>;
  close: (id: string) => void;
}

export const useFileStore = create<FileState>((set, get) => {
  function update(id: string, apply: (file: FileTab) => FileTab) {
    set((state) => ({ tabs: state.tabs.map((file) => file.id === id ? apply(file) : file) }));
  }

  return {
    tabs: [],
    diffs: [],
    openDiff: (projectId, workspaceId, path) => set((state) => {
      const id = JSON.stringify(['diff', workspaceId, path]);
      const tab = { id, projectId, workspaceId, path, name: path.slice(path.lastIndexOf('/') + 1) };
      return {
        diffs: state.diffs.some((diff) => diff.id === id) ? state.diffs : [...state.diffs, tab],
        active: { ...state.active, [projectId]: id },
      };
    }),
    closeDiff: (id) => set((state) => {
      const tab = state.diffs.find((diff) => diff.id === id);
      if (!tab) return state;
      return {
        diffs: state.diffs.filter((diff) => diff.id !== id),
        active: state.active[tab.projectId] === id
          ? { ...state.active, [tab.projectId]: undefined }
          : state.active,
      };
    }),
    active: {},
    activate: (projectId, id) => set((state) => ({ active: { ...state.active, [projectId]: id } })),
    open: async (project, path, name) => {
      const projectId = project.id;
      const id = JSON.stringify([projectId, path]);
      const existing = get().tabs.find((file) => file.id === id);
      get().activate(projectId, id);
      if (existing) return;
      const tab = { id, projectId, path, name };
      set((state) => ({ tabs: [...state.tabs, tab] }));
      const settle = (patch: Partial<FileTab>) => update(id, (file) => file === tab ? { ...file, ...patch } : file);
      try {
        const document = await api.projectFileRead(projectId, path);
        settle({ document, draft: document.text });
      } catch (error) {
        settle({ loadError: errMsg(error) });
      }
    },
    edit: (id, draft) => update(id, (file) => ({ ...file, draft })),
    save: async (id) => {
      const file = get().tabs.find((item) => item.id === id);
      if (!file?.document || !isDirty(file) || file.saving || file.draft === undefined) return;
      const { draft, document } = file;
      update(id, (item) => ({ ...item, saving: true }));
      try {
        await api.projectFileSave(file.projectId, file.path, document.text, draft);
        update(id, (item) => ({ ...item, document: { ...document, text: draft } }));
      } finally {
        update(id, (item) => ({ ...item, saving: false }));
      }
    },
    close: (id) => set((state) => {
      const file = state.tabs.find((item) => item.id === id);
      if (!file || file.saving) return state;
      const tabs = state.tabs.filter((item) => item.id !== id);
      const active = state.active[file.projectId] === id
        ? { ...state.active, [file.projectId]: [...tabs].reverse().find((item) => item.projectId === file.projectId)?.id }
        : state.active;
      return { tabs, active };
    }),
  };
});
