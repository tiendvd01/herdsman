// Spec 071: Herdsman project skills appear in the slash menu under their short name.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import type { Session } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: {
    sessionCreate: vi.fn(),
    sessionPrompt: vi.fn(async () => undefined),
    sessionInterrupt: vi.fn(async () => undefined),
    sessionListCommands: vi.fn(async () => ({
      commands: [
        { name: 'herdsman-project:delivery', description: 'Open a delivery session', argument_hint: '', builtin: false, plugin: 'herdsman-project' },
        { name: 'review', description: 'Review changes', argument_hint: '', builtin: true },
        // Agents started before spec 071 send no `plugin` field.
        { name: 'herdsman-project:devflow', description: '(herdsman-project) Run devflow', argument_hint: '', builtin: false },
      ],
    })),
  },
  errMsg: (e: unknown) => String(e),
  errCode: () => undefined,
}));
vi.mock('@/components/conversation/MessageList', () => ({ COLUMN: '' }));
vi.mock('@/components/composer/ModeSwitcher', () => ({ ModeSwitcher: () => null }));
vi.mock('@/components/composer/ModelSwitcher', () => ({ ModelSwitcher: () => null }));

import { api } from '@/lib/api';
import { Composer } from '@/components/composer/Composer';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const session: Session = {
  id: 's1',
  workspace_id: 'w1',
  engine: 'claude',
  hc_terminal: 't1',
  title: null,
  status: 'idle',
  permission_mode: 'ask',
  model: null,
  engine_session_id: null,
  last_seen_seq: 0,
  pinned_tab: true,
  created_at: 0,
  updated_at: 0,
  ended_at: null,
};

function renderComposer() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <Composer session={session} status="idle" mode="ask" disabled={false} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('slash menu with project skills', () => {
  it('matches a Herdsman skill by its short name and inserts the full command', async () => {
    renderComposer();
    const box = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: '/deliv' } });
    const option = await screen.findByRole('option', { name: /\/delivery/ });
    expect(option.textContent).toContain('Herdsman');
    expect(option.textContent).not.toContain('herdsman-project:');
    fireEvent.keyDown(box, { key: 'Enter' });
    await waitFor(() => expect(box.value).toBe('/herdsman-project:delivery '));
    expect(api.sessionPrompt).not.toHaveBeenCalled();
  });

  it('still matches the full namespaced name', async () => {
    renderComposer();
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: '/herdsman-project:d' } });
    expect(await screen.findByRole('option', { name: /\/delivery/ })).toBeTruthy();
    expect(screen.queryByRole('option', { name: /review/ })).toBeNull();
  });

  it('matches skills from an older agent that sends no plugin field', async () => {
    renderComposer();
    const box = screen.getByRole('textbox');
    fireEvent.change(box, { target: { value: '/devf' } });
    const option = await screen.findByRole('option', { name: /\/devflow/ });
    expect(option.textContent).toContain('Herdsman');
    expect(option.textContent).toContain('Run devflow');
    expect(option.textContent).not.toContain('(herdsman-project)');
  });
});
