// Spec 011: thin scrollbar with theme-contrasting thumb colors.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { builtinThemes } from '@/theme/catalog';
import { cssVars } from '@/theme/resolve';

const css = readFileSync(resolve(__dirname, '../../src/styles/globals.css'), 'utf8');

function luminance(hex: string): number {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Spec 016: colours come from the built-in theme files, not from CSS blocks.
const vars = (id: string) => cssVars(builtinThemes().find((t) => t.id === id)!);
const light = vars('light');
const dark = vars('dark');
const term = { '--scrollbar-thumb': light['--term-scrollbar-thumb'], '--scrollbar-thumb-hover': light['--term-scrollbar-thumb-hover'], '--background': light['--term-bg'] };

describe('scrollbar', () => {
  it('defines thumb tokens for light, dark and the always-dark Log', () => {
    for (const t of [light, dark, term]) {
      expect(t['--scrollbar-thumb']).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t['--scrollbar-thumb-hover']).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it.each([
    ['light', light],
    ['dark', dark],
  ])('%s thumb contrasts ≥ 3:1 with background and surface', (_, t) => {
    for (const bg of [t['--background'], t['--surface']]) {
      expect(contrast(t['--scrollbar-thumb'], bg)).toBeGreaterThanOrEqual(3);
      expect(contrast(t['--scrollbar-thumb-hover'], bg)).toBeGreaterThanOrEqual(3);
    }
  });

  it('hover is stronger than the resting thumb', () => {
    for (const t of [light, dark, term]) {
      expect(contrast(t['--scrollbar-thumb-hover'], t['--background'])).toBeGreaterThan(contrast(t['--scrollbar-thumb'], t['--background']));
    }
  });

  it('Log thumb contrasts ≥ 3:1 with the terminal background', () => {
    expect(contrast(term['--scrollbar-thumb'], term['--background'])).toBeGreaterThanOrEqual(3);
    expect(contrast(term['--scrollbar-thumb-hover'], term['--background'])).toBeGreaterThanOrEqual(3);
  });

  it('is thin (≤ 8px) and themed through the tokens', () => {
    const rule = /::-webkit-scrollbar\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    const width = Number(/width:\s*(\d+)px/.exec(rule)?.[1]);
    const height = Number(/height:\s*(\d+)px/.exec(rule)?.[1]);
    expect(width).toBeLessThanOrEqual(8);
    expect(height).toBeLessThanOrEqual(8);
    expect(css).toMatch(/::-webkit-scrollbar-thumb\s*\{[^}]*var\(--scrollbar-thumb\)/);
    expect(css).toMatch(/\.bg-term-bg\s*\{[^}]*--scrollbar-thumb:\s*var\(--term-scrollbar-thumb\)/);
    expect(css).toMatch(/::-webkit-scrollbar-button\s*\{[^}]*display:\s*none/);
  });
});
