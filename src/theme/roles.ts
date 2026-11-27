// Spec 016 — THE colour role registry. Every colour the UI uses is declared here once.
//
// To add a colour for ALL themes: add one entry to ROLES (key, cssVar, tailwind, derive), run `pnpm theme:gen`
// (also runs before dev/build/test), then use `bg-<name>` / `text-<name>` / `var(<cssVar>)`. No theme file needs editing:
// themes that don't list the key get `derive(...)`, themes that do keep their value.
//
// Only erasable TypeScript + explicit `.ts` imports: scripts/gen-theme-css.mjs loads this file with plain Node.
import { contrast, mix, withAlpha } from './color.ts';

/** Theme basics every derive rule can build on. */
export interface Base {
  background: string;
  foreground: string;
  selection: string;
  ansi?: string[];
  dark: boolean;
}

export interface Role {
  /** Key in a theme file's `colors` (snake_case). */
  key: string;
  /** CSS custom property set on <html>. */
  cssVar: string;
  /** True → also expose `--color-<tailwind name>` (Tailwind utility); the name is the cssVar without `--`. */
  tailwind: boolean;
  /** Default when the theme doesn't list the key. `c(key)` resolves another role (override or derived). */
  derive: (b: Base, c: (key: string) => string) => string;
}

const status = (idx: number, dark: string, light: string) => (b: Base) => b.ansi?.[idx] ?? (b.dark ? dark : light);

function ignoredFileForeground(_base: Base, color: (key: string) => string): string {
  const background = color('background');
  const foreground = color('foreground');
  const slate = '#737994';
  // Rows sit on the panel, muted groups, or an accent hover fill.
  const backgrounds = [background, color('surface'), color('muted'), color('accent')];
  for (let weight = 12; weight < 100; weight++) {
    const tinted = mix(slate, foreground, weight);
    if (backgrounds.every((bg) => contrast(tinted, bg) >= 4.6)) return tinted;
  }
  return foreground;
}

export const ROLES: Role[] = [
  { key: 'background', cssVar: '--background', tailwind: true, derive: (b) => b.background },
  { key: 'foreground', cssVar: '--foreground', tailwind: true, derive: (b) => b.foreground },
  { key: 'surface', cssVar: '--surface', tailwind: true, derive: (b) => mix(b.background, b.foreground, 2) },
  { key: 'muted', cssVar: '--muted', tailwind: true, derive: (b) => mix(b.background, b.foreground, 5) },
  { key: 'muted_foreground', cssVar: '--muted-foreground', tailwind: true, derive: (b) => mix(b.background, b.foreground, 55) },
  { key: 'border', cssVar: '--border', tailwind: true, derive: (b) => mix(b.background, b.foreground, 10) },
  { key: 'input', cssVar: '--input', tailwind: true, derive: (b) => mix(b.background, b.foreground, 14) },
  { key: 'ring', cssVar: '--ring', tailwind: true, derive: (b) => mix(b.background, b.foreground, 35) },
  { key: 'primary', cssVar: '--primary', tailwind: true, derive: (b) => b.foreground },
  { key: 'primary_foreground', cssVar: '--primary-foreground', tailwind: true, derive: (b) => b.background },
  { key: 'accent', cssVar: '--accent', tailwind: true, derive: (b) => mix(b.background, b.foreground, 6) },
  { key: 'accent_foreground', cssVar: '--accent-foreground', tailwind: true, derive: (b) => b.foreground },
  { key: 'destructive', cssVar: '--destructive', tailwind: true, derive: (_b, c) => c('error') },
  { key: 'destructive_foreground', cssVar: '--destructive-foreground', tailwind: true, derive: (_b, c) => {
    const fill = c('destructive');
    return contrast('#ffffff', fill) >= contrast('#000000', fill) ? '#ffffff' : '#000000';
  } },
  { key: 'code', cssVar: '--code', tailwind: true, derive: (b) => mix(b.background, b.foreground, 3) },
  { key: 'working', cssVar: '--st-working', tailwind: true, derive: status(4, '#60a5fa', '#2563eb') },
  { key: 'blocked', cssVar: '--st-blocked', tailwind: true, derive: status(3, '#fbbf24', '#d97706') },
  { key: 'error', cssVar: '--st-error', tailwind: true, derive: status(1, '#f87171', '#dc2626') },
  { key: 'done', cssVar: '--st-done', tailwind: true, derive: status(2, '#4ade80', '#16a34a') },
  { key: 'idle', cssVar: '--st-idle', tailwind: true, derive: (b, c) => b.ansi?.[8] ?? c('muted_foreground') },
  { key: 'warn_bg', cssVar: '--warn-bg', tailwind: true, derive: (b, c) => mix(b.background, c('blocked'), 10) },
  { key: 'warn_fg', cssVar: '--warn-fg', tailwind: true, derive: (b, c) => mix(c('blocked'), b.foreground, 45) },
  { key: 'warn_border', cssVar: '--warn-border', tailwind: true, derive: (b, c) => mix(b.background, c('blocked'), 45) },
  { key: 'warn_icon', cssVar: '--warn-icon', tailwind: true, derive: (_b, c) => c('blocked') },
  { key: 'danger_bg', cssVar: '--danger-bg', tailwind: true, derive: (b, c) => mix(b.background, c('error'), 10) },
  { key: 'diff_add', cssVar: '--diff-add', tailwind: true, derive: (b, c) => mix(b.background, c('done'), 12) },
  { key: 'diff_del', cssVar: '--diff-del', tailwind: true, derive: (b, c) => mix(b.background, c('error'), 12) },
  { key: 'diff_add_fg', cssVar: '--diff-add-fg', tailwind: true, derive: (b, c) => mix(c('done'), b.foreground, 30) },
  { key: 'diff_del_fg', cssVar: '--diff-del-fg', tailwind: true, derive: (b, c) => mix(c('error'), b.foreground, 30) },
  { key: 'git_rename_fg', cssVar: '--git-rename-fg', tailwind: true, derive: (b, c) => mix(c('working'), b.foreground, 30) },
  { key: 'git_ignored_fg', cssVar: '--git-ignored-fg', tailwind: true, derive: ignoredFileForeground },
  { key: 'git_graph_blue', cssVar: '--git-graph-blue', tailwind: false, derive: (b) => b.dark ? '#60a5fa' : '#2563eb' },
  { key: 'git_graph_orange', cssVar: '--git-graph-orange', tailwind: false, derive: (b) => b.dark ? '#fbbf24' : '#a6530a' },
  { key: 'git_graph_green', cssVar: '--git-graph-green', tailwind: false, derive: (b) => b.dark ? '#4ade80' : '#15803d' },
  { key: 'git_graph_purple', cssVar: '--git-graph-purple', tailwind: false, derive: (b) => b.dark ? '#c084fc' : '#7e22ce' },
  { key: 'git_graph_red', cssVar: '--git-graph-red', tailwind: false, derive: (b) => b.dark ? '#fb7185' : '#be123c' },
  // The Log (terminal) stays dark in every theme, so these defaults ignore the theme's own background.
  { key: 'term_bg', cssVar: '--term-bg', tailwind: true, derive: () => '#09090b' },
  { key: 'term_fg', cssVar: '--term-fg', tailwind: true, derive: () => '#d4d4d8' },
  // `#rrggbbaa`: the overlay opacity differs per theme (Light 0.5, Dark 0.7).
  { key: 'scrim', cssVar: '--scrim', tailwind: true, derive: (b) => withAlpha('#000000', b.dark ? 0.7 : 0.5) },
  { key: 'scrollbar_thumb', cssVar: '--scrollbar-thumb', tailwind: false, derive: (b) => mix(b.background, b.foreground, 45) },
  { key: 'scrollbar_thumb_hover', cssVar: '--scrollbar-thumb-hover', tailwind: false, derive: (b) => mix(b.background, b.foreground, 60) },
  { key: 'term_scrollbar_thumb', cssVar: '--term-scrollbar-thumb', tailwind: false, derive: () => '#63636b' },
  { key: 'term_scrollbar_thumb_hover', cssVar: '--term-scrollbar-thumb-hover', tailwind: false, derive: () => '#8b8b93' },
];

export const ROLE_KEYS = new Set(ROLES.map((r) => r.key));

/** Role keys that may carry an alpha channel (`#rrggbbaa`). */
export const ALPHA_ROLES = new Set(['scrim']);

/** The generated Tailwind `@theme inline` block (scripts/gen-theme-css.mjs writes it to src/styles/theme-roles.css). */
export function themeRolesCss(roles: Role[] = ROLES): string {
  const lines = roles.filter((r) => r.tailwind).map((r) => `  --color-${r.cssVar.slice(2)}: var(${r.cssVar});`);
  return `/* GENERATED by scripts/gen-theme-css.mjs from src/theme/roles.ts — do not edit. Run \`pnpm theme:gen\`. */\n@theme inline {\n${lines.join('\n')}\n}\n`;
}
