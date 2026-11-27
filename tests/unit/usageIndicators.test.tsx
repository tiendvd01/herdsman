import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isTauri } from '@tauri-apps/api/core';
import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AccountUsage } from '@/components/layout/AccountUsage';
import { UsageIndicators } from '@/components/composer/UsageIndicators';
import { useSessionStore } from '@/stores/useSessionStore';
import type { AgentEvent } from '@/lib/types';
import { api } from '@/lib/api';

vi.mock('@tauri-apps/api/core', () => ({ isTauri: vi.fn(() => false), invoke: vi.fn() }));

const snap = (ts: number, context_pct: number | null, limits: unknown) => ({ seq: ts, ts, type: 'usage_snapshot', context_pct, limits }) as Extract<AgentEvent, { type: 'usage_snapshot' }>;
const show = (sid = 's1') => render(<TooltipProvider><UsageIndicators sessionId={sid} /></TooltipProvider>);
const future = (h: number) => new Date(Date.now() + h * 3600e3).toISOString();
const showAccount = (children?: ReactNode) => {
  const client = new QueryClient();
  render(<QueryClientProvider client={client}>
    <TooltipProvider delayDuration={0}>{children}<AccountUsage /></TooltipProvider>
  </QueryClientProvider>);
  return client;
};

beforeEach(() => useSessionStore.setState({ sessions: {}, limits: {} }));

describe('UsageIndicators', () => {
  it('session mới: Context — và không có hạn mức', () => {
    show();
    expect(screen.getByRole('status', { name: /Context usage unavailable/ }).contains(screen.getByText('—'))).toBe(true);
    expect(screen.queryByText(/5h/)).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('keeps only context in chat, and shows the shared limits in the status bar on focus', async () => {
    useSessionStore.getState().applyEvents('s1', [snap(Date.now(), 42.3, null)]);
    useSessionStore.getState().applyEvents('s2', [snap(Date.now(), 55, {
      five_hour: { pct: 83, resets_at: future(2) },
      seven_day: { pct: 96, resets_at: future(72) },
    })]);
    useSessionStore.getState().applyEvents('codex-session', [{
      ...snap(Date.now(), null, { five_hour: { pct: 41, resets_at: future(3) } }),
      type: 'usage_snapshot',
      provider: 'codex',
      context_pct: null,
      limits: { five_hour: { pct: 41, resets_at: future(3) } },
    }]);
    showAccount(<UsageIndicators sessionId="s1" />);
    expect(screen.getByRole('status', { name: 'Context used 42%' }).getAttribute('data-level')).toBe('normal');
    expect(screen.queryByText('83%')).toBeNull();
    const claude = screen.getByRole('button', { name: 'Claude usage 96% 7d' });
    const codex = screen.getByRole('button', { name: 'Codex usage — 7d' });
    expect(claude.textContent).toContain('96% 7d');
    fireEvent.focus(claude);
    expect((await screen.findAllByText('Claude')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('83%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('96%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Resets in 2h').length).toBeGreaterThan(0);
    expect(screen.queryByText('41%')).toBeNull();
    fireEvent.blur(claude);
    fireEvent.focus(codex);
    expect((await screen.findByRole('tooltip')).textContent).toContain('41%');
    expect(screen.queryByText('83%')).toBeNull();
    fireEvent.blur(codex);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows account details when hovering the provider icon', async () => {
    useSessionStore.getState().applyEvents('s1', [snap(Date.now(), null, {
      seven_day: { pct: 18, resets_at: null },
    })]);
    showAccount();
    fireEvent.pointerMove(screen.getByRole('img', { name: 'Claude' }), { pointerType: 'mouse' });
    expect((await screen.findByRole('tooltip')).textContent).toContain('Week18%');
  });

  it('updates the weekly summary from empty to zero and full usage', () => {
    showAccount();
    expect(screen.getByRole('button', { name: 'Claude usage — 7d' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Codex usage — 7d' })).toBeTruthy();
    for (const pct of [0, 100]) {
      act(() => useSessionStore.getState().applyEvents('s1', [snap(Date.now() + pct, null, {
        seven_day: { pct, resets_at: null },
      })]));
      expect(screen.getByText(`${pct}% 7d`)).toBeTruthy();
      expect(screen.getAllByRole('button')).toHaveLength(2);
    }
    act(() => useSessionStore.getState().applyEvents('codex-session', [{
      ...snap(Date.now(), null, { seven_day: { pct: 27, resets_at: null } }),
      type: 'usage_snapshot',
      provider: 'codex',
    }]));
    expect(screen.getByRole('button', { name: 'Codex usage 27% 7d' })).toBeTruthy();
  });

  it('offers Compact at the context warning threshold', () => {
    const onCompact = vi.fn();
    useSessionStore.getState().applyEvents('s1', [snap(1, 79, null)]);
    render(<UsageIndicators sessionId="s1" onCompact={onCompact} />);
    expect(screen.queryByRole('button', { name: 'Compact' })).toBeNull();
    fireEvent.click(screen.getByRole('status'));
    expect(onCompact).not.toHaveBeenCalled();
  });

  it('fires Compact from the context indicator when usage is high', () => {
    const onCompact = vi.fn();
    useSessionStore.getState().applyEvents('s1', [snap(1, 80, null)]);
    const { rerender } = render(<UsageIndicators sessionId="s1" onCompact={onCompact} />);
    fireEvent.click(screen.getByRole('button', { name: 'Compact' }));
    expect(onCompact).toHaveBeenCalledOnce();
    rerender(<UsageIndicators sessionId="s1" onCompact={onCompact} compactDisabled />);
    expect((screen.getByRole('button', { name: 'Compact' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('limits lấy snapshot mới nhất, không bị event cũ ghi đè', () => {
    const st = useSessionStore.getState();
    st.applyEvents('s1', [snap(2000, 1, { five_hour: { pct: 50, resets_at: null } })]);
    st.applyEvents('s2', [snap(1000, 1, { five_hour: { pct: 10, resets_at: null } })]);
    expect(useSessionStore.getState().limits.claude?.five_hour?.pct).toBe(50);
  });

  it('refreshes account limits on open and window focus and preserves newer partial pushes', async () => {
    vi.mocked(isTauri).mockReturnValue(true);
    const now = Date.now();
    const request = vi.spyOn(api, 'accountUsage')
      .mockResolvedValueOnce(null).mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ts: now - 10, limits: {
        five_hour: { pct: 15, resets_at: null }, seven_day: { pct: 22, resets_at: null },
      } })
      .mockResolvedValue(null);
    try {
      const client = showAccount(<UsageIndicators sessionId="s1" />);
      await act(async () => {});
      expect(request.mock.calls).toEqual([['claude'], ['codex']]);
      const state = useSessionStore.getState();
      act(() => state.applyEvents('s1', [
        snap(1, 40, null),
        { type: 'usage_snapshot', seq: 2, ts: now, limits: { five_hour: { pct: 38, resets_at: null } } },
      ]));
      client.setQueryData(['account-usage', 'claude'], null, { updatedAt: Date.now() - 6000 });
      fireEvent.focus(screen.getByRole('button', { name: 'Claude usage — 7d' }));
      expect(await screen.findByRole('button', { name: 'Claude usage 22% 7d' })).toBeTruthy();
      expect(screen.getByRole('tooltip').textContent).toContain('38%');
      expect(screen.getByRole('status', { name: 'Context used 40%' })).toBeTruthy();
      client.setQueryData(['account-usage', 'codex'], null, { updatedAt: Date.now() - 6000 });
      fireEvent.focus(window);
      expect(request.mock.calls).toEqual([['claude'], ['codex'], ['claude'], ['codex']]);
    } finally {
      request.mockRestore();
      vi.mocked(isTauri).mockReturnValue(false);
    }
  });
});
