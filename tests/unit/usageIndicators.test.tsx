import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AccountUsage } from '@/components/layout/AccountUsage';
import { UsageIndicators } from '@/components/composer/UsageIndicators';
import { useSessionStore } from '@/stores/useSessionStore';
import type { AgentEvent } from '@/lib/types';

const snap = (ts: number, context_pct: number | null, limits: unknown) => ({ seq: ts, ts, type: 'usage_snapshot', context_pct, limits }) as AgentEvent;
const show = (sid = 's1') => render(<TooltipProvider><UsageIndicators sessionId={sid} /></TooltipProvider>);
const future = (h: number) => new Date(Date.now() + h * 3600e3).toISOString();

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
    render(<TooltipProvider><UsageIndicators sessionId="s1" /><AccountUsage /></TooltipProvider>);
    expect(screen.getByRole('status', { name: 'Context used 42%' }).getAttribute('data-level')).toBe('normal');
    expect(screen.queryByText('83%')).toBeNull();
    fireEvent.focus(screen.getByRole('button', { name: 'Usage' }));
    expect((await screen.findAllByText('Claude')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('83%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('96%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Codex').length).toBeGreaterThan(0);
    expect(screen.getAllByText('41%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Resets in 2h').length).toBeGreaterThan(0);
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
});
