import { describe, expect, it } from 'vitest';
import { clampPct, formatPct, formatReset, levelOf, limitView, STALE_MS } from '@/lib/usageFormat';

describe('usageFormat', () => {
  it('ngưỡng màu: <80 normal, ≥80 warn, ≥95 danger', () => {
    expect(levelOf(79.4)).toBe('normal');
    expect(levelOf(80)).toBe('warn');
    expect(levelOf(94)).toBe('warn');
    expect(levelOf(95)).toBe('danger');
    expect(levelOf(null)).toBe('normal');
  });

  it('làm tròn và kẹp 0–100; thiếu dữ liệu → —', () => {
    expect(formatPct(42.6)).toBe('43%');
    expect(formatPct(130)).toBe('100%');
    expect(formatPct(-3)).toBe('0%');
    expect(formatPct(null)).toBe('—');
    expect(clampPct(NaN)).toBeNull();
  });

  it('formatReset: còn lại bao lâu, đã qua → null', () => {
    const now = Date.parse('2026-11-22T00:00:00Z');
    expect(formatReset('2026-11-22T02:10:00Z', now)).toBe('2h 10m');
    expect(formatReset('2026-11-22T00:35:00Z', now)).toBe('35m');
    expect(formatReset('2026-11-25T04:00:00Z', now)).toBe('3d 4h');
    expect(formatReset('2026-11-21T00:00:00Z', now)).toBeNull();
    expect(formatReset(null, now)).toBeNull();
  });

  it('limitView: ẩn khi không có cửa sổ, — khi đã reset, ~ khi cũ', () => {
    const now = Date.parse('2026-11-22T00:00:00Z');
    const future = '2026-11-22T03:00:00Z';
    expect(limitView(null, now, now)).toBeNull();
    expect(limitView({ pct: 30, resets_at: future }, now, now)).toMatchObject({ text: '30%', level: 'normal', stale: false });
    expect(limitView({ pct: 30, resets_at: '2026-11-21T00:00:00Z' }, now, now)?.text).toBe('—');
    expect(limitView({ pct: 82, resets_at: future }, now - STALE_MS - 1, now)).toMatchObject({ text: '~82%', level: 'warn', stale: true });
  });
});
