import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import type { Project } from '@/lib/types';
import { isDirty, useFileStore } from '@/stores/useFileStore';

vi.mock('@/lib/api', () => ({
  api: { projectFileRead: vi.fn(), projectFileSave: vi.fn() },
  errMsg: (error: Error) => error.message,
}));

const projectAt = (id: string, path: string): Project => ({
  id, path, name: id, sort: 0, created_at: 0, missing: false,
});

beforeEach(() => {
  useFileStore.setState({ tabs: [], active: {} });
  vi.clearAllMocks();
});

describe('project file tabs', () => {
  it('reuses a tab while loading and keeps its draft when reopened', async () => {
    const ws = projectAt('one', '/project');
    vi.mocked(api.projectFileRead).mockResolvedValue({ text: 'before', writable: true });
    const store = useFileStore.getState();
    await Promise.all([store.open(ws, 'test.txt', 'test.txt'), store.open(ws, 'test.txt', 'test.txt')]);
    expect(api.projectFileRead).toHaveBeenCalledTimes(1);
    const file = useFileStore.getState().tabs[0];
    store.edit(file.id, 'draft');
    store.activate(ws.id);
    await store.open(ws, 'test.txt', 'test.txt');
    expect(useFileStore.getState().active[ws.id]).toBe(file.id);
    expect(useFileStore.getState().tabs).toMatchObject([{ draft: 'draft' }]);
  });

  it('isolates projects and retains the draft when saving fails', async () => {
    const project = projectAt('one', '/project');
    const otherProject = projectAt('two', '/otherProject');
    vi.mocked(api.projectFileRead)
      .mockResolvedValueOnce({ text: 'project', writable: true })
      .mockResolvedValueOnce({ text: 'otherProject', writable: true });
    const store = useFileStore.getState();
    await store.open(project, 'test.txt', 'test.txt');
    await store.open(otherProject, 'test.txt', 'test.txt');
    const [, file] = useFileStore.getState().tabs;
    store.edit(file.id, 'changes');
    vi.mocked(api.projectFileSave).mockRejectedValueOnce(new Error('Conflict')).mockResolvedValueOnce(undefined);
    await expect(store.save(file.id)).rejects.toThrow('Conflict');
    expect(isDirty(useFileStore.getState().tabs[1])).toBe(true);
    await store.save(file.id);
    expect(api.projectFileSave).toHaveBeenLastCalledWith('two', 'test.txt', 'otherProject', 'changes');
    expect(useFileStore.getState().tabs.map((tab) => tab.document?.text)).toEqual(['project', 'changes']);
    expect(isDirty(useFileStore.getState().tabs[1])).toBe(false);
  });
});
