// Spec 012: expand button in the composer — toggle, keeps text, Esc collapses before interrupt, send collapses.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import type { Session, SessionStatus } from '@/lib/types';

vi.mock('@/lib/api', () => ({
  api: {
    sessionCreate: vi.fn(),
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
import { useUiStore } from '@/stores/useUiStore';
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

function renderComposer(status: SessionStatus = 'idle', disabled = false, engine: Session['engine'] = 'claude') {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <Composer session={{ ...session, engine }} status={status} mode="ask" disabled={disabled} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

const box = () => screen.getByLabelText('Message the agent') as HTMLTextAreaElement;
const expandBtn = () => screen.getByRole('button', { name: 'Expand editor' });
const collapseBtn = () => screen.getByRole('button', { name: 'Collapse editor' });

beforeEach(() => {
  vi.mocked(api.sessionCreate).mockReset();
  useUiStore.getState().selectSession(session.workspace_id, session.id);
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

  it('finds Codex skills from either prefix and sends the native skill name with the request', async () => {
    vi.mocked(api.sessionListCommands).mockResolvedValue({
      commands: [{ name: 'speckit-plan', description: 'Plan the feature', argument_hint: '', builtin: false }],
    });
    renderComposer('idle', false, 'codex');
    fireEvent.change(box(), { target: { value: '/spec' } });
    expect(await screen.findByRole('option', { name: /\$speckit-plan.*Plan the feature/ })).toBeTruthy();
    fireEvent.keyDown(box(), { key: 'Enter' });
    expect(box().value).toBe('$speckit-plan ');
    fireEvent.change(box(), { target: { value: '$speckit-plan include milestones' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    await waitFor(() => expect(api.sessionPrompt).toHaveBeenNthCalledWith(1, 's1', '$speckit-plan include milestones', []));
    await waitFor(() => expect(box().value).toBe(''));

    fireEvent.change(box(), { target: { value: '$speckit-plan' } });
    expect(screen.getByRole('option', { name: /\$speckit-plan/ })).toBeTruthy();
    fireEvent.keyDown(box(), { key: 'Enter' });
    await waitFor(() => expect(api.sessionPrompt).toHaveBeenNthCalledWith(2, 's1', '$speckit-plan', []));
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

describe('/clear', () => {
  it('offers the app command and opens a named session without resuming or prompting the old agent', async () => {
    vi.mocked(api.sessionListCommands).mockResolvedValue({
      commands: [{ name: 'clear', description: 'Engine command', argument_hint: '', builtin: true }],
    });
    vi.mocked(api.sessionCreate).mockResolvedValue({ ...session, id: 'named', title: 'Sửa bộ lọc' });
    const qc = new QueryClient();
    const resume = vi.fn();
    render(
      <QueryClientProvider client={qc}>
        <TooltipProvider>
          <Composer session={session} status="blocked" mode="ask" onNeedResume={resume} />
        </TooltipProvider>
      </QueryClientProvider>,
    );
    fireEvent.change(box(), { target: { value: '/cl' } });
    fireEvent.click(screen.getByRole('option', { name: /\/clear.*\[name\]/ }));
    expect(box().value).toBe('/clear ');
    fireEvent.change(box(), { target: { value: '/clear   Sửa bộ lọc   ' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    await waitFor(() => expect(useUiStore.getState().sessionByWorkspace.w1).toBe('named'));
    expect(api.sessionCreate).toHaveBeenCalledWith('w1', 'claude', undefined, 'Sửa bộ lọc');
    expect(api.sessionPrompt).not.toHaveBeenCalled();
    expect(api.sessionInterrupt).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
  });

  it.each(['/clear', '/clear   '])('uses default naming for %j', async (command) => {
    vi.mocked(api.sessionCreate).mockResolvedValue({ ...session, id: 'unnamed' });
    renderComposer();
    fireEvent.change(box(), { target: { value: command } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    await waitFor(() => expect(box().value).toBe(''));
    expect(api.sessionCreate).toHaveBeenCalledWith('w1', 'claude', undefined, undefined);
  });

  it('retains the command on failure and still sends similar prefixes as prompts', async () => {
    vi.mocked(api.sessionCreate).mockRejectedValue(new Error('startup failed'));
    renderComposer();
    fireEvent.change(box(), { target: { value: '/clear Test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(api.sessionCreate).toHaveBeenCalledTimes(1));
    await waitFor(() => expect((screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(false));
    expect(box().value).toBe('/clear Test');
    expect(useUiStore.getState().sessionByWorkspace.w1).toBe('s1');

    fireEvent.change(box(), { target: { value: '/clearance' } });
    fireEvent.keyDown(box(), { key: 'Enter' });
    await waitFor(() => expect(api.sessionPrompt).toHaveBeenCalledWith('s1', '/clearance', []));
  });
});

it('opens a draft image and closes it without changing the draft', async () => {
  const { container } = renderComposer();
  const original = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:draft-image' });
  try {
    fireEvent.change(box(), { target: { value: 'Look at this' } });
    const file = new File(['image'], 'example.png', { type: 'image/png' });
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    fireEvent.click(await screen.findByText('example.png'));
    expect(screen.getByRole('img', { name: 'example.png' }).getAttribute('src')).toBe('blob:draft-image');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(box().value).toBe('Look at this');
    fireEvent.click(screen.getByRole('button', { name: 'Remove example.png' }));
    expect(screen.queryByRole('button', { name: 'View example.png' })).toBeNull();
  } finally {
    if (original) Object.defineProperty(URL, 'createObjectURL', original);
    else Reflect.deleteProperty(URL, 'createObjectURL');
  }
});
