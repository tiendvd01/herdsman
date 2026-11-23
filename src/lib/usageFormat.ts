// Formatting for context usage and rate limits (spec 014).
import type { LimitWindow } from './types';

export type UsageLevel = 'normal' | 'warn' | 'danger';

export const WARN_AT = 80;
export const DANGER_AT = 95;
/** Limit snapshots older than this threshold display a `~`. */
export const STALE_MS = 15 * 60 * 1000;

export function levelOf(pct: number | null | undefined): UsageLevel {
  if (pct == null) return 'normal';
  const p = Math.round(pct);
  return p >= DANGER_AT ? 'danger' : p >= WARN_AT ? 'warn' : 'normal';
}

/** Round and clamp to 0–100. Return null when usage is unavailable. */
export function clampPct(pct: number | null | undefined): number | null {
  if (pct == null || !Number.isFinite(pct)) return null;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

export function formatPct(pct: number | null | undefined): string {
  const p = clampPct(pct);
  return p == null ? '—' : `${p}%`;
}

/** "2h 10m" / "35m" / "3d 4h". Return null when the reset time has passed. */
export function formatReset(iso: string | null | undefined, now: number): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t) || t <= now) return null;
  const min = Math.max(1, Math.round((t - now) / 60000));
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (d > 0) return h ? `${d}d ${h}h` : `${d}d`;
  if (h > 0) return m ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

export interface LimitView {
  text: string;
  level: UsageLevel;
  stale: boolean;
  resetText: string | null;
}

/** Format a rate limit window. Return null when the window is unavailable. */
export function limitView(w: LimitWindow | null | undefined, ts: number, now: number): LimitView | null {
  if (!w) return null;
  const expired = !!w.resets_at && Date.parse(w.resets_at) <= now;
  const pct = expired ? null : clampPct(w.pct);
  const stale = pct != null && now - ts > STALE_MS;
  return {
    text: pct == null ? '—' : `${stale ? '~' : ''}${pct}%`,
    level: levelOf(pct),
    stale,
    resetText: formatReset(w.resets_at, now),
  };
}
