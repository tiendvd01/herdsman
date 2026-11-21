// Fonts for Settings → Appearance (spec 010): bundled Geist + every family installed on the machine (offline only).
export type FontKind = 'ui' | 'code';

export interface FontOption {
  id: string;
  label: string;
  /** CSS family name; null = the generic system font. */
  family: string | null;
  bundled?: boolean;
}

export const DEFAULT_FONT: Record<FontKind, string> = { ui: 'geist', code: 'geist-mono' };

const BASE_STACK: Record<FontKind, string> = {
  ui: "'Geist', system-ui, sans-serif",
  code: "'Geist Mono', ui-monospace, monospace",
};

export const UI_FONTS: FontOption[] = [
  { id: 'geist', label: 'Geist', family: 'Geist', bundled: true },
  { id: 'system', label: 'System (SF Pro)', family: null },
  { id: 'inter', label: 'Inter', family: 'Inter' },
  { id: 'helvetica-neue', label: 'Helvetica Neue', family: 'Helvetica Neue' },
  { id: 'avenir-next', label: 'Avenir Next', family: 'Avenir Next' },
];

export const CODE_FONTS: FontOption[] = [
  { id: 'geist-mono', label: 'Geist Mono', family: 'Geist Mono', bundled: true },
  { id: 'sf-mono', label: 'SF Mono', family: 'SF Mono' },
  { id: 'menlo', label: 'Menlo', family: 'Menlo' },
  { id: 'monaco', label: 'Monaco', family: 'Monaco' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', family: 'JetBrains Mono' },
  { id: 'fira-code', label: 'Fira Code', family: 'Fira Code' },
  { id: 'cascadia-code', label: 'Cascadia Code', family: 'Cascadia Code' },
];

export const FONTS: Record<FontKind, FontOption[]> = { ui: UI_FONTS, code: CODE_FONTS };

/** Installed families are stored as `family:<name>`; preset ids (above) stay valid. */
export const FAMILY_PREFIX = 'family:';
export const familyId = (name: string) => FAMILY_PREFIX + name;

/** Known option for an id; unknown or stale ids fall back to the default (FR-012). */
export function fontOption(kind: FontKind, id: string | null | undefined): FontOption {
  const list = FONTS[kind];
  const preset = list.find((f) => f.id === id);
  if (preset) return preset;
  const name = id?.startsWith(FAMILY_PREFIX) ? id.slice(FAMILY_PREFIX.length).replace(/['"\\;{}]/g, '').trim() : '';
  if (name) return { id: id!, label: name, family: name };
  return list.find((f) => f.id === DEFAULT_FONT[kind])!;
}

/** Full CSS stack: chosen font first, then the bundled default and generics, so a missing font degrades cleanly. */
export function fontStack(kind: FontKind, id: string | null | undefined): string {
  const f = fontOption(kind, id);
  if (f.bundled) return BASE_STACK[kind];
  const head = f.family ? `'${f.family}'` : kind === 'ui' ? '-apple-system, system-ui' : 'ui-monospace';
  return `${head}, ${BASE_STACK[kind]}`;
}

const availability = new Map<string, boolean>();

/** WebKit's document.fonts.check() says yes to anything, so compare rendered widths against generic fallbacks. */
export function isFontAvailable(family: string): boolean {
  const hit = availability.get(family);
  if (hit !== undefined) return hit;
  let ok = false;
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return true;
    const sample = 'mmmmmmmmmmlli1WQ@#';
    ok = ['monospace', 'serif', 'sans-serif'].some((g) => {
      ctx.font = `72px ${g}`;
      const base = ctx.measureText(sample).width;
      ctx.font = `72px '${family}', ${g}`;
      return ctx.measureText(sample).width !== base;
    });
  } catch {
    ok = true;
  }
  availability.set(family, ok);
  return ok;
}

/** Options installed on this machine; the bundled/system entries and the current choice are always kept. */
export function availableFonts(kind: FontKind, current?: string): FontOption[] {
  return FONTS[kind].filter((f) => f.bundled || !f.family || f.id === current || isFontAvailable(f.family));
}

const mono = new Map<string, boolean>();

/** Monospace check: narrow and wide glyphs render at the same width. Missing fonts fall back to serif → false. */
export function isMonospace(family: string): boolean {
  const hit = mono.get(family);
  if (hit !== undefined) return hit;
  let ok = false;
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.font = `40px '${family}', serif`;
      const narrow = ctx.measureText('iiiiiiiiii').width;
      ok = narrow > 0 && Math.abs(narrow - ctx.measureText('WWWWWWWWWW').width) < 0.5;
    }
  } catch {
    ok = false;
  }
  mono.set(family, ok);
  return ok;
}

/**
 * Picker entries: pinned defaults first, then every installed family (code: monospace only).
 * Without a system list (non-macOS, error) fall back to the presets found on this machine.
 */
export function fontChoices(kind: FontKind, systemFamilies: string[] | undefined, current?: string): FontOption[] {
  if (!systemFamilies?.length) return availableFonts(kind, current);
  const pinned = FONTS[kind].filter((f) => f.bundled || !f.family);
  const pinnedFamilies = new Set(pinned.map((f) => f.family));
  const families = systemFamilies.filter((n) => !pinnedFamilies.has(n) && (kind === 'ui' || isMonospace(n)));
  const out = [...pinned, ...families.map((n) => ({ id: familyId(n), label: n, family: n }))];
  const cur = fontOption(kind, current);
  if (!out.some((f) => sameFont(f, cur))) out.splice(pinned.length, 0, cur);
  return out;
}

/** A preset (e.g. `menlo`) and the installed family of the same name are the same choice. */
export function sameFont(a: FontOption, b: FontOption): boolean {
  return a.id === b.id || (!!a.family && a.family === b.family);
}
