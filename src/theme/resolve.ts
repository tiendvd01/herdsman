// Spec 016: theme file → full colour table (listed value wins, otherwise the role's derive rule).
import { contrast, mix, toCss } from './color.ts';
import { ROLES, type Base } from './roles.ts';
import type { ParsedTheme } from './schema.ts';

export interface ResolvedTheme {
  id: string;
  name: string;
  appearance: 'light' | 'dark';
  source: 'builtin' | 'custom';
  /** Every role key → stored value (`#rrggbb`, or `#rrggbbaa` for scrim). */
  colors: Record<string, string>;
}

export function resolveTheme(t: ParsedTheme): ResolvedTheme {
  const base: Base = {
    background: t.background,
    foreground: t.foreground,
    selection: t.selection ?? mix(t.background, t.foreground, 15),
    ansi: t.ansi,
    dark: t.appearance === 'dark',
  };
  const byKey = new Map(ROLES.map((r) => [r.key, r]));
  const out: Record<string, string> = {};
  const c = (key: string): string => {
    if (out[key] !== undefined) return out[key];
    const listed = t.colors[key];
    if (listed !== undefined) return (out[key] = listed);
    const role = byKey.get(key);
    if (!role) throw new Error(`unknown color role: ${key}`);
    return (out[key] = role.derive(base, c));
  };
  for (const r of ROLES) c(r.key);
  return { id: t.id, name: t.name, appearance: t.appearance, source: t.source, colors: out };
}

/** CSS custom properties for a resolved theme: `--var → css value`. */
export function cssVars(r: ResolvedTheme): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const role of ROLES) vars[role.cssVar] = toCss(r.colors[role.key]);
  return vars;
}

const PAIRS: [string, string[]][] = [
  ['foreground', ['background', 'surface', 'muted']],
  ['muted_foreground', ['background', 'surface', 'muted']],
  ['working', ['background', 'surface', 'muted']],
  ['blocked', ['background', 'surface', 'muted']],
  ['error', ['background', 'surface', 'muted']],
  ['done', ['background', 'surface', 'muted']],
  ['primary_foreground', ['primary']],
  ['warn_fg', ['warn_bg']],
  ['diff_add_fg', ['diff_add']],
  ['diff_del_fg', ['diff_del']],
];

/** Text/background pairs below 4.5:1 (spec 016 FR-012). */
export function contrastReport(r: ResolvedTheme): { fg: string; bg: string; ratio: number }[] {
  const out: { fg: string; bg: string; ratio: number }[] = [];
  for (const [fg, bgs] of PAIRS)
    for (const bg of bgs) {
      const ratio = contrast(r.colors[fg], r.colors[bg]);
      if (ratio < 4.5) out.push({ fg, bg, ratio: Math.round(ratio * 100) / 100 });
    }
  return out;
}
