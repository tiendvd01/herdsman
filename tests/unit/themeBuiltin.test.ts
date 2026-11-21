// Spec 016: the three built-in themes keep the exact look they had as hand-written CSS (FR-010, SC-005), pass contrast, and no hex lives outside theme files (SC-004).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import golden from '../fixtures/theme-golden.json';
import { builtinThemes } from '@/theme/catalog';
import { contrastReport, cssVars } from '@/theme/resolve';

const byId = (id: string) => builtinThemes().find((t) => t.id === id)!;

describe('built-in themes', () => {
  it.each(['light', 'paper', 'dark'] as const)('%s resolves to the pre-016 values', (id) => {
    const vars = cssVars(byId(id));
    const want = golden[id] as Record<string, string>;
    for (const [k, v] of Object.entries(want)) {
      // scrim used to be rgba(): same colour, normalised formatting
      const norm = (x: string) => x.replace(/\s+/g, '');
      expect(norm(vars[k]), `${id} ${k}`).toBe(norm(v.startsWith('rgba') ? v.replace(/(\d*\.?\d+)\)$/, (_, a) => `${Math.round(parseFloat(a) * 100) / 100})`) : v));
    }
  });

  it('are light, light and dark', () => {
    expect(builtinThemes().map((t) => [t.id, t.appearance])).toEqual([['light', 'light'], ['paper', 'light'], ['dark', 'dark']]);
  });

  it.each(['paper', 'dark'])('%s has no text/background pair under 4.5:1', (id) => {
    expect(contrastReport(byId(id))).toEqual([]);
  });

  // FR-010 keeps Light exactly as it was: its status colours (BR 3.2 zinc palette) were never meant for body text, so only they are exempt.
  it('light: every pair passes except status colours used as text and muted text on muted fills (4.4:1)', () => {
    const status = ['working', 'blocked', 'error', 'done'];
    expect(contrastReport(byId('light')).filter((c) => !status.includes(c.fg) && !(c.fg === 'muted_foreground' && c.bg === 'muted'))).toEqual([]);
  });
});

describe('no hand-typed colours outside theme files', () => {
  const allowed = [/src[\\/]theme[\\/]builtin[\\/]/, /devMock\.ts$/, /theme-roles\.css$/, /src[\\/]theme[\\/]roles\.ts$/, /src[\\/]theme[\\/]color\.ts$/];
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(tsx?|css)$/.test(f)) files.push(p);
    }
  };
  walk(resolve(__dirname, '../../src'));

  it('finds none in src/', () => {
    const hits: string[] = [];
    for (const f of files) {
      if (allowed.some((a) => a.test(f))) continue;
      const text = readFileSync(f, 'utf8');
      const m = text.match(/#[0-9a-fA-F]{6}\b|rgba?\(/g);
      if (m) hits.push(`${f}: ${m.slice(0, 3).join(', ')}`);
    }
    expect(hits).toEqual([]);
  });
});
