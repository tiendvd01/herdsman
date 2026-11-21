// Spec 016: write a resolved theme onto <html> — CSS custom properties + the `dark` class.
import { cssVars, type ResolvedTheme } from './resolve.ts';

let applied = new Set<string>();

export function applyTheme(theme: ResolvedTheme, root: HTMLElement = document.documentElement) {
  const vars = cssVars(theme);
  for (const v of applied) if (!(v in vars)) root.style.removeProperty(v);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  applied = new Set(Object.keys(vars));
  root.classList.toggle('dark', theme.appearance === 'dark');
  root.classList.remove('paper');
}
