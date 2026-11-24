// Spec 006: ⌘= / ⌘+ / ⌘− / ⌘0 zoom the whole UI; ⌥⌘= / ⌥⌘− / ⌥⌘0 change the content text size (Ctrl / Alt off macOS).
import { useEffect } from 'react';
import { IS_MAC } from '@/lib/platform';
import { applyCodeFontSize, applyContentStep, applyZoom } from '@/lib/uiZoom';
import { useUiStore } from '@/stores/useUiStore';

export type ZoomAction = 'in' | 'out' | 'reset' | 'text-in' | 'text-out' | 'text-reset';

type KeyInfo = Pick<KeyboardEvent, 'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>;

/** By physical key: ⌥ changes `key` on macOS, and ⌘+ is ⌘⇧= on a US layout. Key repeat is allowed. */
export function matchZoomShortcut(e: KeyInfo, ctx: { isMac: boolean }): ZoomAction | null {
  const mod = ctx.isMac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
  if (!mod) return null;
  const code = e.code || '';
  let dir: 'in' | 'out' | 'reset' | null = null;
  if (code === 'Equal' || code === 'NumpadAdd' || (!code && (e.key === '=' || e.key === '+'))) dir = 'in';
  else if (code === 'Minus' || code === 'NumpadSubtract' || (!code && (e.key === '-' || e.key === '_'))) dir = 'out';
  else if (code === 'Digit0' || code === 'Numpad0' || (!code && e.key === '0')) dir = 'reset';
  if (!dir) return null;
  // Shift only matters for ⌘+ (= ⌘⇧=); ⌘⇧− / ⌘⇧0 are not ours.
  if (e.shiftKey && dir !== 'in') return null;
  return e.altKey ? (`text-${dir}` as ZoomAction) : dir;
}

export function runZoomAction(a: ZoomAction) {
  const ui = useUiStore.getState();
  ({
    in: ui.zoomIn,
    out: ui.zoomOut,
    reset: ui.zoomReset,
    'text-in': ui.contentBigger,
    'text-out': ui.contentSmaller,
    'text-reset': ui.contentReset,
  })[a]();
}

export const ZOOM_LABEL: Record<ZoomAction, string> = IS_MAC
  ? { in: '⌘=', out: '⌘−', reset: '⌘0', 'text-in': '⌥⌘=', 'text-out': '⌥⌘−', 'text-reset': '⌥⌘0' }
  : { in: 'Ctrl+=', out: 'Ctrl+−', reset: 'Ctrl+0', 'text-in': 'Ctrl+Alt+=', 'text-out': 'Ctrl+Alt+−', 'text-reset': 'Ctrl+Alt+0' };

export function installZoomShortcuts(): () => void {
  const onKey = (e: KeyboardEvent) => {
    const a = matchZoomShortcut(e, { isMac: IS_MAC });
    if (!a) return;
    // Capture phase: keep the focused input / terminal from getting the key, and the browser from zooming.
    e.preventDefault();
    e.stopPropagation();
    runZoomAction(a);
  };
  window.addEventListener('keydown', onKey, true);

  // macOS menu View → Zoom In / Zoom Out / Actual Size (src-tauri/src/lib.rs).
  let unlisten: (() => void) | null = null;
  let disposed = false;
  if ('__TAURI_INTERNALS__' in window) {
    import('@tauri-apps/api/event')
      .then(({ listen }) =>
        listen<string>('ui-zoom', (ev) => {
          if (ev.payload === 'in' || ev.payload === 'out' || ev.payload === 'reset') runZoomAction(ev.payload);
        }),
      )
      .then((u) => (disposed ? u() : (unlisten = u)))
      .catch(() => {});
  }
  return () => {
    disposed = true;
    window.removeEventListener('keydown', onKey, true);
    unlisten?.();
  };
}

/** Apply zoom / content text size whenever they change (the saved values are applied before first render in main.tsx). */
export function useZoomEffect() {
  const zoom = useUiStore((s) => s.zoom);
  const step = useUiStore((s) => s.contentStep);
  const codeFontSize = useUiStore((s) => s.codeFontSize);
  useEffect(() => void applyZoom(zoom), [zoom]);
  useEffect(() => applyContentStep(step), [step]);
  useEffect(() => applyCodeFontSize(codeFontSize), [codeFontSize]);
}
