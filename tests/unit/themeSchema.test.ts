// Spec 016: theme file validation (built-in and custom share it).
import { describe, expect, it } from 'vitest';
import { parseThemeFile } from '@/theme/schema';

const ok = (o: unknown) => JSON.stringify(o);
const min = { background: '#fbf7ef', foreground: '#2a2622' };

describe('parseThemeFile', () => {
  it('accepts a minimal theme and infers brightness from the background', () => {
    const r = parseThemeFile('sepia.json', ok(min));
    expect(r.ok && r.theme.id).toBe('sepia');
    expect(r.ok && r.theme.appearance).toBe('light');
    const d = parseThemeFile('night.json', ok({ background: '#101014', foreground: '#eee' + 'eee' }));
    expect(d.ok && d.theme.appearance).toBe('dark');
  });

  it('lets `appearance` override the inferred brightness', () => {
    const r = parseThemeFile('x.json', ok({ ...min, appearance: 'dark' }));
    expect(r.ok && r.theme.appearance).toBe('dark');
  });

  it.each([
    ['missing background', { foreground: '#000000' }, 'background'],
    ['3-digit hex', { ...min, background: '#fff' }, 'background'],
    ['rgb()', { ...min, foreground: 'rgb(0,0,0)' }, 'foreground'],
    ['alpha on a normal colour', { ...min, colors: { border: '#00000080' } }, 'colors.border'],
    ['15 ansi colours', { ...min, ansi: Array(15).fill('#000000') }, 'ansi'],
    ['bad ansi entry', { ...min, ansi: [...Array(15).fill('#000000'), 'red'] }, 'ansi[15]'],
    ['bad appearance', { ...min, appearance: 'sepia' }, 'appearance'],
    ['name too long', { ...min, name: 'x'.repeat(41) }, 'name'],
  ])('rejects %s and names the field', (_, body, field) => {
    const r = parseThemeFile('t.json', ok(body));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.file).toBe('t.json');
      expect(r.error.field).toBe(field);
    }
  });

  it('rejects broken JSON, non-objects and oversized files with the file name', () => {
    for (const text of ['{', '[]', '"x"', ' '.repeat(257 * 1024)]) {
      const r = parseThemeFile('bad.json', text);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.file).toBe('bad.json');
    }
  });

  it('rejects names that clash with a built-in theme (custom only)', () => {
    expect(parseThemeFile('paper.json', ok(min)).ok).toBe(false);
    expect(parseThemeFile('x.json', ok({ ...min, name: 'Dark' })).ok).toBe(false);
    expect(parseThemeFile('paper.json', ok(min), 'builtin').ok).toBe(true);
  });

  it('only `scrim` takes #rrggbbaa; unknown role keys are warnings, not errors', () => {
    const r = parseThemeFile('t.json', ok({ ...min, colors: { scrim: '#00000099', glow: '#ff00ff' } }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.theme.colors).toEqual({ scrim: '#00000099' });
      expect(r.warnings.map((w) => w.field)).toEqual(['colors.glow']);
    }
  });
});
