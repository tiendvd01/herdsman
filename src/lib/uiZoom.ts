// Spec 006: whole-UI zoom steps and the content text-size step, plus applying them to the page.

/** Fixed zoom steps relative to the app's default display scale. */
export const ZOOM_STEPS = [0.8, 0.9, 1, 1.1, 1.2, 1.35, 1.5] as const;
export const ZOOM_DEFAULT = 1;
/** Spec 024: 100% now renders at the previous 110% scale. */
const BASE_UI_SCALE = 1.1;
/** Content text-size offset in px from the default (13px body / 12px code). */
export const CONTENT_STEP = { min: -2, max: 4, def: 0 } as const;
export const CONTENT_BASE_PX = 13;
export const CODE_FONT_SIZE = { min: 10, max: 24 } as const;

export function normalizeCodeFontSize(size: unknown): number | null {
  if (typeof size !== 'number' || !Number.isFinite(size)) return null;
  return Math.min(CODE_FONT_SIZE.max, Math.max(CODE_FONT_SIZE.min, Math.round(size)));
}

/** Any other value snaps to the nearest step; anything that is not a finite number becomes 1. */
export function clampZoom(z: unknown): number {
  if (typeof z !== 'number' || !Number.isFinite(z)) return ZOOM_DEFAULT;
  return ZOOM_STEPS.reduce((best, s) => (Math.abs(s - z) < Math.abs(best - z) ? s : best), ZOOM_STEPS[0] as number);
}

/** Round then clamp to [-2, 4]; anything that is not a finite number becomes 0. */
export function clampContentStep(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return CONTENT_STEP.def;
  return Math.min(CONTENT_STEP.max, Math.max(CONTENT_STEP.min, Math.round(n)));
}

/** The next zoom step in a direction; stays put at the ends. */
export function nextZoom(z: number, dir: 1 | -1): number {
  const i = ZOOM_STEPS.indexOf(clampZoom(z) as (typeof ZOOM_STEPS)[number]);
  return ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, i + dir))];
}

export const zoomAtLimit = (z: number) => (z <= ZOOM_STEPS[0] ? 'min' : z >= ZOOM_STEPS[ZOOM_STEPS.length - 1] ? 'max' : null);
export const contentAtLimit = (n: number) => (n <= CONTENT_STEP.min ? 'min' : n >= CONTENT_STEP.max ? 'max' : null);
export const formatZoom = (z: number) => `${Math.round(z * 100)}%`;
export const contentPx = (n: number) => CONTENT_BASE_PX + n;

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Tauri: native webview zoom (viewport, mouse coordinates and element sizes stay in one coordinate space).
 * Browser preview (?mock): CSS `zoom` on <html>, see currentZoomFactor() for the coordinate fix-up.
 */
export async function applyZoom(z: number): Promise<void> {
  const scale = BASE_UI_SCALE * clampZoom(z);
  if (isTauri()) {
    try {
      const { getCurrentWebview } = await import('@tauri-apps/api/webview');
      await getCurrentWebview().setZoom(scale);
      document.documentElement.style.zoom = '';
      return;
    } catch {
      // fall through to CSS zoom
    }
  }
  document.documentElement.style.zoom = String(scale);
  // CSS zoom does not emit a viewport resize on its own.
  window.dispatchEvent(new Event('resize'));
}

/** CSS zoom factor on <html> for the preview or fallback; 1 when native zoom is used. */
export function currentZoomFactor(): number {
  if (typeof document === 'undefined') return 1;
  const z = parseFloat(document.documentElement.style.zoom);
  return Number.isFinite(z) && z > 0 ? z : 1;
}

export function applyContentStep(n: number): void {
  document.documentElement.style.setProperty('--content-step', `${clampContentStep(n)}px`);
}

export function applyCodeFontSize(size: number | null): void {
  const style = document.documentElement.style;
  if (size === null) style.removeProperty('--code-font-size');
  else style.setProperty('--code-font-size', `${size}px`);
}
