// Spec 009: every padding / margin / gap / space-* class in src/ uses the shared spacing scale.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isAllowedSpacing, SPACING_EXCEPTIONS, SPACING_STEPS } from '@/lib/spacing';

const ROOT = resolve(__dirname, '../..');
const SRC = join(ROOT, 'src');

const PREFIXES = ['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl', 'ps', 'pe', 'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'ms', 'me', 'gap', 'gap-x', 'gap-y', 'space-x', 'space-y'];
// Longest prefixes first so `gap-x-2` is not read as `gap` + `x-2`. Optional variant prefixes
// (`group-hover:`) and a leading `-` are allowed; the token must not be part of a longer word.
const TOKEN = new RegExp(`(?<![\\w-])(-?)(${[...PREFIXES].sort((a, b) => b.length - a.length).join('|')})-(\\[[^\\]\\s]+\\]|\\d+(?:\\.\\d+)?|px|auto)(?![\\w.\\[-])`, 'g');
const MARGIN = /^-?m[xytrblse]?$/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

// spacing.ts lists the exception tokens itself, so it is not scanned.
const files = sourceFiles(SRC)
  .filter((path) => !path.endsWith(join('lib', 'spacing.ts')))
  .map((path) => ({ rel: relative(ROOT, path), text: readFileSync(path, 'utf8') }));

describe('spacing scale', () => {
  it('has at most 8 steps', () => {
    expect(SPACING_STEPS.length).toBeLessThanOrEqual(8);
    for (const s of SPACING_STEPS) expect(s.px).toBe(Number(s.step) * 4);
  });

  it('accepts 0 and scale steps, rejects everything else', () => {
    expect(isAllowedSpacing('0')).toBe(true);
    expect(isAllowedSpacing('2')).toBe(true);
    expect(isAllowedSpacing('0.5')).toBe(true);
    expect(isAllowedSpacing('2.5')).toBe(false);
    expect(isAllowedSpacing('px')).toBe(false);
    expect(isAllowedSpacing('[3px]')).toBe(false);
  });

  it('every spacing class in src/ is on the scale or a listed exception', () => {
    const bad: string[] = [];
    for (const { rel, text } of files) {
      text.split('\n').forEach((line, i) => {
        for (const m of line.matchAll(TOKEN)) {
          const [token, , prefix, value] = m;
          if (isAllowedSpacing(value)) continue;
          if (value === 'auto' && MARGIN.test(prefix)) continue;
          if (SPACING_EXCEPTIONS.some((e) => e.file === rel && e.token === token)) continue;
          bad.push(`${rel}:${i + 1} ${token}`);
        }
      });
    }
    expect(bad, `Spacing outside the scale (see src/lib/spacing.ts):\n${bad.join('\n')}`).toEqual([]);
  });

  it('every exception has a reason and is still used', () => {
    for (const e of SPACING_EXCEPTIONS) {
      expect(e.reason.trim(), e.token).not.toBe('');
      const file = files.find((f) => f.rel === e.file);
      expect(file?.text.includes(e.token), `${e.file} no longer uses ${e.token}`).toBe(true);
    }
  });
});
