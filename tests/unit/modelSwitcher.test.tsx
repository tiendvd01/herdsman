// Spec 005: model picker in the composer — label, list with check mark, switching, Esc, unsupported agent.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import type { Session } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: {
    sessionListModels: vi.fn(),
    sessionSetModel: vi.fn(async () => undefined),
  },
  errMsg: (e: unknown) => (e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : String(e)),
  errCode: (e: unknown) => (e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : undefined),
}));

import { api } from '@/lib/api';
import { ModelSwitcher } from '@/components/composer/ModelSwitcher';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.scrollIntoView ??= () => {};
});

const MODELS = [
  { value: 'claude-opus-5-5', display_name: 'Opus 5.5', description: 'Most capable' },
  { value: 'claude-sonnet-5-5', display_name: 'Sonnet 5.5', description: 'Everyday tasks' },
];

const session = (model: string | null): Session => ({
  id: 's1',
  workspace_id: 'w1',
  engine: 'claude',
  hc_terminal: 't1',
  title: null,
  status: 'idle',
  permission_mode: 'ask',
  model,
  engine_session_id: null,
  last_seen_seq: 0,
  pinned_tab: true,
  created_at: 0,
  updated_at: 0,
  ended_at: null,
});

function renderPicker(model: string | null = 'claude-opus-5-5', disabled = false) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <ModelSwitcher session={session(model)} disabled={disabled} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

async function openMenu(label: string) {
  fireEvent.keyDown(screen.getByRole('button', { name: `Model: ${label}` }), { key: 'Enter' });
  await screen.findByRole('menu');
}

beforeEach(() => {
  vi.mocked(api.sessionListModels).mockReset().mockResolvedValue({ models: MODELS, current: 'claude-opus-5-5' });
  vi.mocked(api.sessionSetModel).mockClear();
});

describe('ModelSwitcher', () => {
  it('shows the current model in readable form', () => {
    renderPicker();
    expect(screen.getByRole('button', { name: 'Model: Opus 5.5' })).toBeTruthy();
  });

  it('lists models with descriptions and checks the current one', async () => {
    renderPicker();
    await openMenu('Opus 5.5');
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((i) => i.textContent)).toEqual(['Opus 5.5Most capable', 'Sonnet 5.5Everyday tasks']);
    expect(items[0].querySelector('svg')?.getAttribute('class') ?? '').not.toContain('invisible');
    expect(items[1].querySelector('svg')?.getAttribute('class') ?? '').toContain('invisible');
  });

  it('switches to the picked model', async () => {
    renderPicker();
    await openMenu('Opus 5.5');
    fireEvent.click(await screen.findByRole('menuitem', { name: /Sonnet 5.5/ }));
    await waitFor(() => expect(api.sessionSetModel).toHaveBeenCalledWith('s1', 'claude-sonnet-5-5'));
  });

  it('picking the current model does nothing', async () => {
    renderPicker();
    await openMenu('Opus 5.5');
    fireEvent.click(await screen.findByRole('menuitem', { name: /Opus 5.5/ }));
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(api.sessionSetModel).not.toHaveBeenCalled();
  });

  it('Esc closes the menu without switching', async () => {
    renderPicker();
    await openMenu('Opus 5.5');
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(api.sessionSetModel).not.toHaveBeenCalled();
  });

  it('lists a current model the engine does not name', async () => {
    renderPicker('claude-opus-4-1');
    await openMenu('Opus 4.1');
    const items = await screen.findAllByRole('menuitem');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toContain('Opus 4.1');
  });

  it('an agent without model switching disables the button', async () => {
    vi.mocked(api.sessionListModels).mockRejectedValue({ code: 'unsupported', message: 'Restart this session to switch models' });
    renderPicker();
    await openMenu('Opus 5.5').catch(() => {});
    await waitFor(() => expect((screen.getByRole('button', { name: 'Model: Opus 5.5' }) as HTMLButtonElement).disabled).toBe(true));
  });

  it('is disabled when the composer is disabled', () => {
    renderPicker('claude-opus-5-5', true);
    expect((screen.getByRole('button', { name: 'Model: Opus 5.5' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
