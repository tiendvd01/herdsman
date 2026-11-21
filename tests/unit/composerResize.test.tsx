// Spec 013: resizable expanded composer — default 300px, drag handle, remembered height.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

import { Composer } from '@/components/composer/Composer';
import { useUiStore } from '@/stores/useUiStore';

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


const handle = () => screen.getByRole('separator', { name: 'Resize editor' });

beforeEach(() => {
  localStorage.clear();
  useUiStore.setState({ composerHeight: 300 });
  Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true, writable: true });
  Element.prototype.setPointerCapture ??= () => {};
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

describe('Composer resize', () => {
  it('shows the handle only when expanded, with 300px by default', () => {
    renderComposer();
    expect(screen.queryByRole('separator', { name: 'Resize editor' })).toBeNull();
    fireEvent.click(expandBtn());
    expect(box().style.height).toBe('300px');
    expect(handle().getAttribute('aria-orientation')).toBe('horizontal');
    fireEvent.click(collapseBtn());
    expect(screen.queryByRole('separator', { name: 'Resize editor' })).toBeNull();
  });

  it('dragging resizes the editor and keeps the text', () => {
    renderComposer();
    fireEvent.change(box(), { target: { value: 'keep me' } });
    fireEvent.click(expandBtn());
    fireEvent.pointerDown(handle(), { button: 0, clientY: 500, pointerId: 1 });
    fireEvent.pointerMove(handle(), { clientY: 400, pointerId: 1 });
    expect(box().style.height).toBe('400px');
    fireEvent.pointerMove(handle(), { clientY: 5000, pointerId: 1 });
    expect(box().style.height).toBe('120px');
    fireEvent.pointerUp(handle(), { pointerId: 1 });
    expect(box().value).toBe('keep me');
  });

  it('double-click resets to 300px', () => {
    renderComposer();
    fireEvent.click(expandBtn());
    fireEvent.keyDown(handle(), { key: 'ArrowUp' });
    expect(box().style.height).toBe('316px');
    fireEvent.doubleClick(handle());
    expect(box().style.height).toBe('300px');
  });

  it('remembers the chosen height after collapsing and expanding again', () => {
    renderComposer();
    fireEvent.click(expandBtn());
    fireEvent.keyDown(handle(), { key: 'End' });
    expect(box().style.height).toBe('800px');
    fireEvent.click(collapseBtn());
    fireEvent.click(expandBtn());
    expect(box().style.height).toBe('800px');
    expect(useUiStore.getState().composerHeight).toBe(800);
  });

  it('caps by the window height without losing the saved value', () => {
    useUiStore.setState({ composerHeight: 700 });
    renderComposer();
    fireEvent.click(expandBtn());
    expect(box().style.height).toBe('700px');
    act(() => {
      window.innerHeight = 500;
      window.dispatchEvent(new Event('resize'));
    });
    expect(box().style.height).toBe('400px');
    expect(useUiStore.getState().composerHeight).toBe(700);
    act(() => {
      window.innerHeight = 1000;
      window.dispatchEvent(new Event('resize'));
    });
    expect(box().style.height).toBe('700px');
  });

  it('clamps corrupt saved values from storage', () => {
    useUiStore.getState().setComposerHeight(99999);
    expect(useUiStore.getState().composerHeight).toBe(1200);
    useUiStore.getState().setComposerHeight(Number.NaN);
    expect(useUiStore.getState().composerHeight).toBe(300);
  });
});
