// Spec 012: expand button in the composer — toggle, keeps text, Esc collapses before interrupt, send collapses.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import type { Session, SessionStatus } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: {
    sessionPrompt: vi.fn(async () => undefined),
    sessionInterrupt: vi.fn(async () => undefined),
    sessionListCommands: vi.fn(async () => ({ commands: [] })),
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

function renderComposer(status: SessionStatus = 'idle', disabled = false) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <Composer session={session} status={status} mode="ask" disabled={disabled} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

const box = () => screen.getByLabelText('Message the agent') as HTMLTextAreaElement;
const expandBtn = () => screen.getByRole('button', { name: 'Expand editor' });
const collapseBtn = () => screen.getByRole('button', { name: 'Collapse editor' });

beforeEach(() => {
  vi.mocked(api.sessionPrompt).mockReset().mockResolvedValue(undefined as never);
  vi.mocked(api.sessionInterrupt).mockClear();
  vi.mocked(api.sessionListCommands).mockReset().mockResolvedValue({ commands: [] });
});

describe('Composer expand', () => {
  it('toggles between normal and expanded, keeping the text and focus', () => {
    renderComposer();
    fireEvent.change(box(), { target: { value: 'line 1\nline 2' } });
    expect(expandBtn().getAttribute('aria-pressed')).toBe('false');
    expect(box().className).toContain('max-h-60');

    fireEvent.click(expandBtn());
    expect(collapseBtn().getAttribute('aria-pressed')).toBe('true');
    expect(box().style.height).toBe('300px');
    expect(box().value).toBe('line 1\nline 2');
    expect(document.activeElement).toBe(box());

    fireEvent.click(collapseBtn());
    expect(box().className).toContain('max-h-60');
    expect(box().value).toBe('line 1\nline 2');
  });

  it('Esc collapses without interrupting a working agent', () => {
    renderComposer('working');
    fireEvent.click(expandBtn());
    fireEvent.keyDown(box(), { key: 'Escape' });
    expect(expandBtn()).toBeTruthy();
    expect(api.sessionInterrupt).not.toHaveBeenCalled();

    fireEvent.keyDown(box(), { key: 'Escape' });
    expect(api.sessionInterrupt).toHaveBeenCalledWith('s1');
  });

  it('Esc closes the slash list before collapsing', () => {
    renderComposer();
    fireEvent.click(expandBtn());
    fireEvent.change(box(), { target: { value: '/' } });
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(box(), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(collapseBtn()).toBeTruthy();
  });

  it('slash list shows the engine-reported skills, project ones first', async () => {
    vi.mocked(api.sessionListCommands).mockResolvedValue({
      commands: [
        { name: 'compact', description: 'Compact context', argument_hint: '', builtin: true },
        { name: 'speckit-plan', description: 'Plan the feature', argument_hint: '', builtin: false },
      ],
    });
    renderComposer();
    fireEvent.change(box(), { target: { value: '/' } });
    await waitFor(() => expect(screen.getByRole('option', { name: /speckit-plan/ })).toBeTruthy());
    const opts = screen.getAllByRole('option').map((o) => o.textContent);
    expect(opts[0]).toContain('/speckit-plan');
    expect(opts[1]).toContain('/compact');

    fireEvent.change(box(), { target: { value: '/spec' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(box().value).toBe('/speckit-plan ');
  });

  it('falls back to the built-in list when the engine cannot report commands', async () => {
    vi.mocked(api.sessionListCommands).mockRejectedValue({ code: 'unsupported', message: 'old agent' });
    renderComposer();
    fireEvent.change(box(), { target: { value: '/' } });
    expect(screen.getByRole('option', { name: /\/compact/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: /\/init/ })).toBeTruthy();
  });

  it('sending collapses the editor; a failed send keeps it expanded', async () => {
    renderComposer();
    fireEvent.click(expandBtn());
    fireEvent.change(box(), { target: { value: 'hello' } });
    vi.mocked(api.sessionPrompt).mockRejectedValueOnce('boom');
    fireEvent.keyDown(box(), { key: 'Enter' });
    await waitFor(() => expect(api.sessionPrompt).toHaveBeenCalledTimes(1));
    expect(collapseBtn()).toBeTruthy();
    expect(box().value).toBe('hello');

    fireEvent.keyDown(box(), { key: 'Enter' });
    await waitFor(() => expect(expandBtn()).toBeTruthy());
    expect(box().value).toBe('');
  });

  it('is disabled when the composer is disabled', () => {
    renderComposer('idle', true);
    expect((expandBtn() as HTMLButtonElement).disabled).toBe(true);
  });
});
