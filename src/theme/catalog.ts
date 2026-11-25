// Spec 016: built-in + custom themes → one catalog (valid themes, errors, warnings).
import { contrastReport, resolveTheme, type ResolvedTheme } from './resolve.ts';
import { parseThemeFile, type ThemeIssue } from './schema.ts';

/** A raw file from `<data_dir>/themes/` (Rust only reads; validation happens here). Same shape as `ThemeFile` in src/lib/types.ts. */
export interface ThemeFile {
  file: string;
  text?: string | null;
  error?: string | null;
}

export interface ThemeCatalog {
  themes: ResolvedTheme[];
  errors: ThemeIssue[];
  warnings: ThemeIssue[];
}

export const DEFAULT_LIGHT = 'light';
export const DEFAULT_DARK = 'dark';

const raw = import.meta.glob('./builtin/*.json', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

const BUILTIN: ResolvedTheme[] = ['light', 'paper', 'clear-light', 'minimal', 'dark', 'catppuccin-frappe', 'one-dark-pro'].map((id) => {
  const text = raw[`./builtin/${id}.json`];
  const r = parseThemeFile(`${id}.json`, text, 'builtin');
  if (!r.ok) throw new Error(`built-in theme ${id}: ${r.error.message} (${r.error.field ?? ''})`);
  return resolveTheme(r.theme);
});

export function builtinThemes(): ResolvedTheme[] {
  return BUILTIN;
}

export function buildCatalog(files: ThemeFile[] = []): ThemeCatalog {
  const themes = [...BUILTIN];
  const errors: ThemeIssue[] = [];
  const warnings: ThemeIssue[] = [];
  const seenIds = new Set(themes.map((t) => t.id));
  const seenNames = new Set(themes.map((t) => t.name.toLowerCase()));
  for (const f of [...files].sort((a, b) => a.file.localeCompare(b.file))) {
    if (f.error || f.text == null) {
      errors.push({ file: f.file, message: f.error ?? 'could not read the file' });
      continue;
    }
    const r = parseThemeFile(f.file, f.text, 'custom');
    if (!r.ok) {
      errors.push(r.error);
      continue;
    }
    const id = r.theme.id.toLowerCase();
    if (seenIds.has(id) || seenNames.has(r.theme.name.toLowerCase())) {
      errors.push({ file: f.file, field: 'name', message: 'another theme already uses this name' });
      continue;
    }
    seenIds.add(id);
    seenNames.add(r.theme.name.toLowerCase());
    warnings.push(...r.warnings);
    const resolved = resolveTheme(r.theme);
    for (const c of contrastReport(resolved)) warnings.push({ file: f.file, message: `low contrast ${c.ratio}:1 — ${c.fg} on ${c.bg} (needs 4.5:1)` });
    themes.push(resolved);
  }
  return { themes, errors, warnings };
}

/** The theme with this id and the wanted brightness, else the built-in default of that brightness. */
export function pickTheme(catalog: ThemeCatalog, id: string, dark: boolean): ResolvedTheme {
  const want = dark ? 'dark' : 'light';
  const hit = catalog.themes.find((t) => t.id === id && t.appearance === want);
  if (hit) return hit;
  const fallback = dark ? DEFAULT_DARK : DEFAULT_LIGHT;
  return catalog.themes.find((t) => t.id === fallback)!;
}
