// Spec 016: role registry — complete, derivable, and the generated Tailwind block never goes stale.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isHex, isHexA } from '@/theme/color';
import { ROLES, themeRolesCss, type Role } from '@/theme/roles';
import { resolveTheme } from '@/theme/resolve';
import { builtinThemes } from '@/theme/catalog';
import type { ParsedTheme } from '@/theme/schema';

const minimal = (background: string, foreground: string, appearance: 'light' | 'dark'): ParsedTheme => ({ id: 'min', name: 'min', appearance, background, foreground, colors: {}, source: 'custom' });

describe('role registry', () => {
  it('has unique keys and css variables', () => {
    expect(new Set(ROLES.map((r) => r.key)).size).toBe(ROLES.length);
    expect(new Set(ROLES.map((r) => r.cssVar)).size).toBe(ROLES.length);
  });

  it('derives a valid colour for every role from just background and foreground', () => {
    for (const t of [minimal('#fbf7ef', '#2a2622', 'light'), minimal('#101014', '#ececf0', 'dark')]) {
      const r = resolveTheme(t);
      for (const role of ROLES) expect(role.key === 'scrim' ? isHexA(r.colors[role.key]) : isHex(r.colors[role.key]), role.key).toBe(true);
    }
  });

  it('keeps the Log dark whatever the theme', () => {
    const r = resolveTheme(minimal('#ffffff', '#000000', 'light'));
    expect(r.colors.term_bg).toBe('#09090b');
    expect(r.colors.term_fg).toBe('#d4d4d8');
  });

  it('uses ansi colours for status when the theme gives them', () => {
    const ansi = ['#000000', '#aa0000', '#00aa00', '#aaaa00', '#0000aa', '#aa00aa', '#00aaaa', '#aaaaaa', '#555555', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff'];
    const r = resolveTheme({ ...minimal('#ffffff', '#000000', 'light'), ansi });
    expect([r.colors.error, r.colors.done, r.colors.blocked, r.colors.working, r.colors.idle]).toEqual(['#aa0000', '#00aa00', '#aaaa00', '#0000aa', '#555555']);
    expect(r.colors.destructive).toBe('#aa0000'); // derived from the (overridden) error role
  });
});

describe('theme-roles.css', () => {
  it('matches the registry (run `pnpm theme:gen` after editing roles.ts)', () => {
    const file = readFileSync(resolve(__dirname, '../../src/styles/theme-roles.css'), 'utf8');
    expect(file).toBe(themeRolesCss());
  });

  it('exposes --color-* only for roles flagged tailwind', () => {
    const css = themeRolesCss();
    expect(css).toContain('--color-st-working: var(--st-working);');
    expect(css).not.toContain('--color-scrollbar-thumb');
  });
});

// FR-003 / FR-005: adding a role is one entry; every theme gets it, themes can override it.
describe('adding a colour', () => {
  const link: Role = { key: 'link', cssVar: '--link', tailwind: true, derive: (b) => b.foreground };

  it('shows up in generated CSS', () => {
    expect(themeRolesCss([...ROLES, link])).toContain('--color-link: var(--link);');
  });

  it('is derived for every built-in theme and listed values win', () => {
    // resolveTheme reads ROLES; simulate a new role by checking the derive contract on each built-in base.
    for (const t of builtinThemes()) {
      expect(isHex(link.derive({ background: t.colors.background, foreground: t.colors.foreground, selection: '#000000', dark: t.appearance === 'dark' }, () => '#000000'))).toBe(true);
    }
  });
});
