import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UsageIndicators } from '@/components/composer/UsageIndicators';
import { useSessionStore } from '@/stores/useSessionStore';
import type { AgentEvent } from '@/lib/types';

const snap = (ts: number, context_pct: number | null, limits: unknown) => ({ seq: ts, ts, type: 'usage_snapshot', context_pct, limits }) as AgentEvent;
const show = (sid = 's1') => render(<TooltipProvider><UsageIndicators sessionId={sid} /></TooltipProvider>);
const future = (h: number) => new Date(Date.now() + h * 3600e3).toISOString();

beforeEach(() => useSessionStore.setState({ sessions: {}, limits: null }));

describe('UsageIndicators', () => {
  it('session mới: Context — và không có hạn mức', () => {
    show();
    expect(screen.getByRole('status', { name: /Context usage unavailable/ }).contains(screen.getByText('—'))).toBe(true);
    expect(screen.queryByText(/5h/)).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('hiện context, 5h, tuần và màu theo ngưỡng', () => {
    useSessionStore.getState().applyEvents('s1', [snap(Date.now(), 42.3, { five_hour: { pct: 83, resets_at: future(2) }, seven_day: { pct: 96, resets_at: future(72) } })]);
    show();
    expect(screen.getByRole('status', { name: 'Context used 42%' }).getAttribute('data-level')).toBe('normal');
    expect(screen.getByRole('status', { name: '5-hour limit used 83%' }).getAttribute('data-level')).toBe('warn');
    expect(screen.getByRole('status', { name: '7-day limit used 96%' }).getAttribute('data-level')).toBe('danger');
  });

  it('limits=null: chỉ còn Context; hạn mức dùng chung giữa các session', () => {
    useSessionStore.getState().applyEvents('s1', [snap(Date.now(), 10, null)]);
    show();
    expect(screen.queryByText(/7d/)).toBeNull();
    useSessionStore.getState().applyEvents('s2', [snap(Date.now(), 55, { five_hour: { pct: 30, resets_at: future(1) } })]);
    show('s1');
    expect(screen.getAllByRole('status', { name: '5-hour limit used 30%' }).length).toBeGreaterThan(0);
  });

  it('limits lấy snapshot mới nhất, không bị event cũ ghi đè', () => {
    const st = useSessionStore.getState();
    st.applyEvents('s1', [snap(2000, 1, { five_hour: { pct: 50, resets_at: null } })]);
    st.applyEvents('s2', [snap(1000, 1, { five_hour: { pct: 10, resets_at: null } })]);
    expect(useSessionStore.getState().limits?.five_hour?.pct).toBe(50);
  });
});
