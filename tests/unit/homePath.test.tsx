import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { HomeDirectory, formatHomePath } from '@/lib/homePath';
import { ToolCard } from '@/components/conversation/ToolCard';
import { Markdown } from '@/components/conversation/Markdown';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/lib/api';

it.each([
  ['/Users/me', '/Users/me/', '~'],
  ['/Users/me/', '/Users/me', '~'],
  ['/Users/me/.herdr/a b', '/Users/me/', '~/.herdr/a b'],
  ['/Users/me2/a', '/Users/me', '/Users/me2/a'],
  ['/Volumes/data', '/Users/me', '/Volumes/data'],
  ['src/a', '/Users/me', 'src/a'],
  ['~/a', '/Users/me', '~/a'],
  ['/Users/me/a', undefined, '/Users/me/a'],
  ['', '/', ''],
  ['/', '/', '~'],
  ['/a', '/', '~/a'],
])('formats %s with home %s', (path, home, label) => {
  expect(formatHomePath(path!, home)).toBe(label);
});

it('updates a rendered Write label when home becomes available and preserves the diff', () => {
  const path = '/Users/me/.herdr/worktrees/demo/App.tsx';
  const card = (home?: string) => <HomeDirectory.Provider value={home}>
    <ToolCard item={{ kind: 'tool', key: 'one', tool_use_id: 'one', tool: 'Write',
      input: { file_path: path, content: path }, steps: 0, ts: 1 }} />
  </HomeDirectory.Provider>;
  const view = render(card(), { wrapper: TooltipProvider });
  expect(screen.getByRole('button').textContent).toContain(path);
  view.rerender(card('/Users/me'));
  expect(screen.getByRole('button').textContent).toContain('~/.herdr/worktrees/demo/App.tsx');
  expect(view.container.querySelector('pre')?.textContent).toContain(path);
});

it('opens both original paths from shortened plain and inline-code links', async () => {
  const open = vi.fn();
  const exists = vi.spyOn(api, 'sessionFileExists').mockResolvedValue(true);
  try {
    render(<QueryClientProvider client={new QueryClient()}>
      <HomeDirectory.Provider value="/Users/me">
        <Markdown sessionId="s" openFile={open} text={'/Users/me/one/a.ts and `/Users/me/two/a.ts`'} />
      </HomeDirectory.Provider>
    </QueryClientProvider>);
    for (const folder of ['one', 'two']) {
      fireEvent.click(await screen.findByRole('link', { name: '~/' + folder + '/a.ts' }));
    }
    expect(open.mock.calls).toEqual([['/Users/me/one/a.ts'], ['/Users/me/two/a.ts']]);
  } finally {
    exists.mockRestore();
  }
});
