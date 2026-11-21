// Spec 016: validate a theme file (built-in or custom) — one path for both.
import { isHex, isHexA, luminance } from './color.ts';
import { ALPHA_ROLES, ROLE_KEYS } from './roles.ts';

export const MAX_THEME_BYTES = 256 * 1024;
export const BUILTIN_IDS = ['light', 'paper', 'dark'] as const;

export interface ParsedTheme {
  id: string;
  name: string;
  appearance: 'light' | 'dark';
  background: string;
  foreground: string;
  selection?: string;
  ansi?: string[];
  colors: Record<string, string>;
  source: 'builtin' | 'custom';
}

export interface ThemeIssue {
  file: string;
  field?: string;
  message: string;
}

export type ParseResult = { ok: true; theme: ParsedTheme; warnings: ThemeIssue[] } | { ok: false; error: ThemeIssue };

const fail = (file: string, message: string, field?: string): ParseResult => ({ ok: false, error: { file, field, message } });

/** `file` is the file name (`sepia.json`); the theme id is the name without `.json`. */
export function parseThemeFile(file: string, text: string, source: 'builtin' | 'custom' = 'custom'): ParseResult {
  if (text.length > MAX_THEME_BYTES) return fail(file, `file is larger than ${MAX_THEME_BYTES / 1024} KB`);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return fail(file, `invalid JSON (${(e as Error).message})`);
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail(file, 'the file must contain a JSON object');
  const o = raw as Record<string, unknown>;
  const id = file.replace(/\.json$/i, '');

  for (const f of ['background', 'foreground'] as const) {
    if (o[f] === undefined) return fail(file, 'required color is missing', f);
    if (!isHex(o[f])) return fail(file, 'must be a color like #rrggbb', f);
  }
  if (o.selection !== undefined && !isHex(o.selection)) return fail(file, 'must be a color like #rrggbb', 'selection');
  if (o.ansi !== undefined) {
    if (!Array.isArray(o.ansi) || o.ansi.length !== 16) return fail(file, 'must list exactly 16 colors', 'ansi');
    const bad = o.ansi.findIndex((c) => !isHex(c));
    if (bad >= 0) return fail(file, 'must be a color like #rrggbb', `ansi[${bad}]`);
  }
  let name = id;
  if (o.name !== undefined) {
    if (typeof o.name !== 'string' || o.name.length < 1 || o.name.length > 40) return fail(file, 'must be 1–40 characters', 'name');
    name = o.name;
  }
  let appearance: 'light' | 'dark' = luminance(o.background as string) < 0.5 ? 'dark' : 'light';
  if (o.appearance !== undefined) {
    if (o.appearance !== 'light' && o.appearance !== 'dark') return fail(file, 'must be "light" or "dark"', 'appearance');
    appearance = o.appearance;
  }
  if (source === 'custom') {
    const clash = (s: string) => (BUILTIN_IDS as readonly string[]).includes(s.toLowerCase());
    if (clash(id) || clash(name)) return fail(file, 'name is already used by a built-in theme (light, paper, dark)', 'name');
  }

  const colors: Record<string, string> = {};
  const warnings: ThemeIssue[] = [];
  if (o.colors !== undefined) {
    if (!o.colors || typeof o.colors !== 'object' || Array.isArray(o.colors)) return fail(file, 'must be an object', 'colors');
    for (const [k, v] of Object.entries(o.colors as Record<string, unknown>)) {
      if (!ROLE_KEYS.has(k)) {
        warnings.push({ file, field: `colors.${k}`, message: 'unknown color role (ignored)' });
        continue;
      }
      const ok = ALPHA_ROLES.has(k) ? isHexA(v) : isHex(v);
      if (!ok) return fail(file, ALPHA_ROLES.has(k) ? 'must be #rrggbb or #rrggbbaa' : 'must be a color like #rrggbb', `colors.${k}`);
      colors[k] = v as string;
    }
  }
  return {
    ok: true,
    warnings,
    theme: { id, name, appearance, background: o.background as string, foreground: o.foreground as string, selection: o.selection as string | undefined, ansi: o.ansi as string[] | undefined, colors, source },
  };
}
