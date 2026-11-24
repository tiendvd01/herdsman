import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FileEditor } from '@/components/files/FileEditor';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import type { FileTab } from '@/stores/useFileStore';

const file: FileTab = {
  id: 'readme',
  projectId: 'project',
  path: 'docs/Readme.MD',
  name: 'Readme.MD',
  document: { text: '# On disk', writable: true },
  draft: '# Draft heading\n\n| Name |\n| --- |\n| Example |\n\n<img src=x onerror="alert(1)">',
};

function openTab(tab = file) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider><FileEditor file={tab} /></TooltipProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('Markdown file preview', () => {
  it('renders the draft and keeps the original editor mounted when switching modes', () => {
    openTab();
    const editor = screen.getByLabelText('File contents');
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.getByRole('heading', { name: 'Draft heading' })).toBeTruthy();
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Source' }));
    expect(screen.getByLabelText('File contents')).toBe(editor);
    expect(screen.queryByRole('heading', { name: 'Draft heading' })).toBeNull();
  });

  it('keeps controls unavailable for non-Markdown files and failed loads', () => {
    const other = openTab({ ...file, path: 'notes.txt', name: 'notes.txt' });
    expect(screen.queryByRole('button', { name: 'Preview' })).toBeNull();
    other.unmount();

    openTab({ ...file, document: undefined, draft: undefined, loadError: 'Unable to read file' });
    expect(screen.getByText('Unable to read file')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Preview' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Download' })).toBeNull();
  });

  it('downloads the exact draft and allows retry without leaving preview', async () => {
    const download = vi.spyOn(api, 'projectMarkdownDownload')
      .mockRejectedValueOnce(new Error('Permission denied'))
      .mockResolvedValueOnce(undefined);
    openTab();
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Download' });
    fireEvent.click(button);

    await waitFor(() => expect(button.disabled).toBe(false));
    expect(screen.getByRole('heading', { name: 'Draft heading' })).toBeTruthy();
    fireEvent.click(button);
    await waitFor(() => expect(download).toHaveBeenCalledTimes(2));
    expect(download).toHaveBeenLastCalledWith(file.projectId, file.path, file.draft);
    await waitFor(() => expect(button.disabled).toBe(false));
  });

  it('can download an empty read-only document', async () => {
    const download = vi.spyOn(api, 'projectMarkdownDownload').mockResolvedValue(undefined);
    openTab({ ...file, path: '/tmp/empty.markdown', document: { text: '', writable: false }, draft: '' });
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByText('This file is empty.')).toBeTruthy();
    const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Download' });
    fireEvent.click(button);
    expect(download).toHaveBeenCalledWith(file.projectId, '/tmp/empty.markdown', '');
    await waitFor(() => expect(button.disabled).toBe(false));
  });
});
