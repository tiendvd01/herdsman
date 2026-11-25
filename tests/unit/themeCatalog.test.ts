// Spec 016: custom themes — valid ones join the catalog, bad ones are reported and skipped, nothing breaks.
import { describe, expect, it } from 'vitest';
import { buildCatalog, builtinThemes, pickTheme, type ThemeFile } from '@/theme/catalog';

const f = (file: string, body: unknown): ThemeFile => ({ file, text: typeof body === 'string' ? body : JSON.stringify(body) });
const good = { background: '#fbf7ef', foreground: '#2a2622' };

describe('buildCatalog', () => {
  it('starts with the built-in themes', () => {
    const c = buildCatalog();
    expect(c.themes).toEqual(builtinThemes());
    expect(c.errors).toEqual([]);
  });

  it('adds a valid minimal custom theme', () => {
    const c = buildCatalog([f('sepia.json', good)]);
    const t = c.themes.find((x) => x.id === 'sepia')!;
    expect(t.source).toBe('custom');
    expect(t.appearance).toBe('light');
    expect(Object.keys(t.colors).length).toBeGreaterThan(30);
  });

  it('reports invalid files with file and field, and keeps the others', () => {
    const c = buildCatalog([f('bad.json', { ...good, background: 'beige' }), f('broken.json', '{'), f('ok.json', good), { file: 'big.json', error: 'file is larger than 256 KB' }]);
    expect(c.errors.map((e) => [e.file, e.field])).toEqual([['bad.json', 'background'], ['big.json', undefined], ['broken.json', undefined]]);
    expect(c.themes.map((t) => t.id)).toContain('ok');
    expect(c.themes.map((t) => t.id)).not.toContain('bad');
  });

  it('never replaces a built-in and rejects duplicate names', () => {
    const c = buildCatalog([f('paper.json', good), f('a.json', { ...good, name: 'Same' }), f('b.json', { ...good, name: 'same' })]);
    expect(c.themes.find((t) => t.id === 'paper')!.source).toBe('builtin');
    expect(c.errors.map((e) => e.file).sort()).toEqual(['b.json', 'paper.json']);
    expect(c.themes.filter((t) => t.source === 'custom').map((t) => t.id)).toEqual(['a']);
  });

  it('warns (without skipping) on unknown roles and low contrast', () => {
    const c = buildCatalog([f('dim.json', { background: '#808080', foreground: '#888888', colors: { glow: '#ff00ff' } })]);
    expect(c.themes.map((t) => t.id)).toContain('dim');
    expect(c.errors).toEqual([]);
    expect(c.warnings.some((w) => w.field === 'colors.glow')).toBe(true);
    expect(c.warnings.some((w) => /low contrast/.test(w.message))).toBe(true);
  });
});

describe('pickTheme', () => {
  const c = buildCatalog([f('sepia.json', good), f('night.json', { background: '#101014', foreground: '#ececf0' })]);

  it('finds a custom theme of the right brightness', () => {
    expect(pickTheme(c, 'sepia', false).id).toBe('sepia');
    expect(pickTheme(c, 'night', true).id).toBe('night');
  });

  it('falls back to the built-in default when the theme is missing or the wrong brightness', () => {
    expect(pickTheme(c, 'gone', false).id).toBe('light');
    expect(pickTheme(c, 'gone', true).id).toBe('dark');
    expect(pickTheme(c, 'night', false).id).toBe('light');
    expect(pickTheme(c, 'sepia', true).id).toBe('dark');
  });
});
