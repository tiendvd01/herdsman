// Spec 016: small sRGB colour helpers. Only erasable TypeScript + explicit `.ts` imports (the theme CSS generator runs this under plain Node).

export type RGB = [number, number, number];

const HEX6 = /^#[0-9a-fA-F]{6}$/;
const HEX8 = /^#[0-9a-fA-F]{8}$/;

export const isHex = (s: unknown): s is string => typeof s === 'string' && HEX6.test(s);
/** `#rrggbb` or `#rrggbbaa` (only the `scrim` role takes alpha). */
export const isHexA = (s: unknown): s is string => typeof s === 'string' && (HEX6.test(s) || HEX8.test(s));

export function parseHex(s: string): RGB {
  const n = s.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as RGB;
}

export function toHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
}

/** `pct` percent of `b` mixed into `a` (0 → a, 100 → b). */
export function mix(a: string, b: string, pct: number): string {
  const x = parseHex(a);
  const y = parseHex(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * (pct / 100)) as RGB);
}

export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `#rrggbb` + alpha 0..1 → `#rrggbbaa`. */
export function withAlpha(hex: string, alpha: number): string {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, '0');
}

/** CSS value for a stored colour: `#rrggbbaa` becomes `rgba()` so every WebView renders it the same. */
export function toCss(value: string): string {
  if (!HEX8.test(value)) return value;
  const [r, g, b] = parseHex(value.slice(0, 7));
  const a = parseInt(value.slice(7, 9), 16) / 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`;
}
