import { useEffect, useMemo, useState } from 'react';
import { useUiStore, type Theme } from '@/stores/useUiStore';
import { fontStack } from '@/lib/fonts';
import { useThemeFiles } from '@/theme/files';
import { applyTheme } from '@/theme/apply';
import { buildCatalog, pickTheme, type ThemeCatalog } from '@/theme/catalog';
import { resolveTheme, type ResolvedTheme } from '@/theme/resolve';

// Spec 016: colours come from theme files (src/theme/builtin/*.json + <data_dir>/themes/*.json) through the role registry.
// Theme mode (System/Light/Dark, spec 010) decides light or dark; `lightTheme` / `darkTheme` pick the theme for each.

const DARK_QUERY = '(prefers-color-scheme: dark)';
const darkMql = () => (typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null);
const CACHE_KEY = 'herdsman-theme-cache';

/** Light or dark in effect: the mode wins, System follows macOS. */
export function isDarkMode(mode: Theme, systemDark: boolean): boolean {
  return mode === 'dark' || (mode === 'system' && systemDark);
}

/** Id of the theme in effect (before checking it exists). */
export function resolveThemeId(mode: Theme, lightTheme: string, darkTheme: string, systemDark: boolean): string {
  return isDarkMode(mode, systemDark) ? darkTheme : lightTheme;
}

function useSystemDark(): boolean {
  const [systemDark, setSystemDark] = useState(() => darkMql()?.matches ?? false);
  useEffect(() => {
    const mq = darkMql();
    if (!mq) return;
    const on = () => setSystemDark(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return systemDark;
}

/** Built-in themes plus valid custom ones; errors and warnings for the rest (shown in Settings). */
export function useThemeCatalog(): ThemeCatalog {
  const files = useThemeFiles((s) => s.files);
  return useMemo(() => buildCatalog(files), [files]);
}

/** The theme in effect (reactive); Mermaid, charts and Settings redraw when it changes. */
export function useThemeColors(): ResolvedTheme {
  const mode = useUiStore((s) => s.theme);
  const lightTheme = useUiStore((s) => s.lightTheme);
  const darkTheme = useUiStore((s) => s.darkTheme);
  const systemDark = useSystemDark();
  const catalog = useThemeCatalog();
  const dark = isDarkMode(mode, systemDark);
  return useMemo(() => pickTheme(catalog, dark ? darkTheme : lightTheme, dark), [catalog, dark, lightTheme, darkTheme]);
}

/** Apply the theme in effect to <html> and remember it, so the next launch paints it before React renders. */
export function useThemeEffect() {
  const load = useThemeFiles((s) => s.load);
  useEffect(() => void load(), [load]);
  const theme = useThemeColors();
  useEffect(() => {
    applyTheme(theme);
    writeCache(theme);
  }, [theme]);
}

function readCache(): Partial<Record<'light' | 'dark', ResolvedTheme>> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeCache(t: ResolvedTheme) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...readCache(), [t.appearance]: t }));
  } catch {
    /* storage unavailable: the built-in theme paints first instead */
  }
}

/** Synchronous first paint (before React): cached theme of the chosen id, else the built-in one. */
export function bootTheme() {
  const { theme: mode, lightTheme, darkTheme } = useUiStore.getState();
  const dark = isDarkMode(mode, darkMql()?.matches ?? false);
  const id = dark ? darkTheme : lightTheme;
  const cached = readCache()[dark ? 'dark' : 'light'];
  if (cached?.source === 'custom' && cached.id === id && cached.colors?.background && cached.colors.foreground) {
    applyTheme(resolveTheme({ ...cached, background: cached.colors.background, foreground: cached.colors.foreground }));
  } else {
    applyTheme(pickTheme(buildCatalog(), id, dark));
  }
}

/** Interface/code fonts: override the Tailwind font tokens on <html>, so every font-sans / font-mono follows. */
export function applyFonts(uiFont: string, codeFont: string, root: HTMLElement = document.documentElement) {
  root.style.setProperty('--font-sans', fontStack('ui', uiFont));
  root.style.setProperty('--font-mono', fontStack('code', codeFont));
}

import lightIconUrl from '@/assets/herdsman_lightmode.png';
import darkIconUrl from '@/assets/herdsman_darkmode.png';

/** Favicon follows the theme in effect: herdsman_darkmode.png on dark, herdsman_lightmode.png on light. */
function useFaviconEffect() {
  const dark = useThemeColors().appearance === 'dark';
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    link.type = 'image/png';
    link.href = dark ? darkIconUrl : lightIconUrl;
  }, [dark]);
}

export function useAppearanceEffect() {
  useThemeEffect();
  useFaviconEffect();
  const uiFont = useUiStore((s) => s.uiFont);
  const codeFont = useUiStore((s) => s.codeFont);
  useEffect(() => applyFonts(uiFont, codeFont), [uiFont, codeFont]);
}

/** Current interface font stack, for renderers that need a literal family name (Mermaid, charts). */
export function currentFontSans(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim();
  return v || "'Geist', system-ui, sans-serif";
}
