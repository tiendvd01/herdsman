// Spec 006: zoom steps, content text size, shortcut matching and the v1 → v2 migration.
import { describe, expect, it, vi } from 'vitest';
import { applyZoom, clampContentStep, clampZoom, currentZoomFactor, formatZoom, nextZoom, zoomAtLimit, ZOOM_STEPS } from '@/lib/uiZoom';
import { matchZoomShortcut } from '@/lib/zoomShortcuts';
import { migrateUi, useUiStore } from '@/stores/useUiStore';

const { setZoom } = vi.hoisted(() => ({ setZoom: vi.fn() }));
vi.mock('@tauri-apps/api/webview', () => ({ getCurrentWebview: () => ({ setZoom }) }));

describe('rendered UI zoom', () => {
  it('renders the reset level at the previous 110% scale in the browser', async () => {
    try {
      const store = useUiStore.getState();
      store.zoomIn();
      store.zoomReset();
      const { zoom } = useUiStore.getState();
      await applyZoom(zoom);
      expect(formatZoom(zoom)).toBe('100%');
      expect(currentZoomFactor()).toBe(1.1);
      await applyZoom(nextZoom(zoom, 1));
      expect(currentZoomFactor()).toBeCloseTo(1.21);
    } finally {
      document.documentElement.style.zoom = '';
    }
  });

  it('passes the scaled value to Tauri and uses the same scale if native zoom fails', async () => {
    vi.stubGlobal('__TAURI_INTERNALS__', {});
    try {
      await applyZoom(1);
      expect(setZoom).toHaveBeenLastCalledWith(1.1);
      expect(currentZoomFactor()).toBe(1);
      setZoom.mockRejectedValueOnce(new Error('Zoom unavailable'));
      await applyZoom(1.5);
      expect(currentZoomFactor()).toBeCloseTo(1.65);
    } finally {
      vi.unstubAllGlobals();
      document.documentElement.style.zoom = '';
    }
  });
});

const key = (code: string, mods: Partial<KeyboardEventInit> = {}) => ({
  key: '',
  code,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});
const mac = { isMac: true };
const other = { isMac: false };

describe('clampZoom / nextZoom', () => {
  it('snaps to the nearest step and defaults bad values to 1', () => {
    expect(clampZoom(1)).toBe(1);
    expect(clampZoom(1.12)).toBe(1.1);
    expect(clampZoom(3)).toBe(1.5);
    expect(clampZoom(0.1)).toBe(0.8);
    expect(clampZoom('1.2')).toBe(1);
    expect(clampZoom(NaN)).toBe(1);
    expect(clampZoom(undefined)).toBe(1);
  });
  it('moves one step and stops at the ends', () => {
    expect(nextZoom(1, 1)).toBe(1.1);
    expect(nextZoom(1, -1)).toBe(0.9);
    expect(nextZoom(1.5, 1)).toBe(1.5);
    expect(nextZoom(0.8, -1)).toBe(0.8);
    expect(zoomAtLimit(ZOOM_STEPS[0])).toBe('min');
    expect(zoomAtLimit(1.5)).toBe('max');
    expect(zoomAtLimit(1)).toBeNull();
  });
});

describe('clampContentStep', () => {
  it('rounds and clamps to -2…4, bad values become 0', () => {
    expect(clampContentStep(2)).toBe(2);
    expect(clampContentStep(1.6)).toBe(2);
    expect(clampContentStep(9)).toBe(4);
    expect(clampContentStep(-5)).toBe(-2);
    expect(clampContentStep(null)).toBe(0);
  });
});

describe('matchZoomShortcut', () => {
  it('maps ⌘= / ⌘+ / ⌘− / ⌘0 to zoom on macOS', () => {
    expect(matchZoomShortcut(key('Equal', { metaKey: true }), mac)).toBe('in');
    expect(matchZoomShortcut(key('Equal', { metaKey: true, shiftKey: true }), mac)).toBe('in');
    expect(matchZoomShortcut(key('NumpadAdd', { metaKey: true }), mac)).toBe('in');
    expect(matchZoomShortcut(key('Minus', { metaKey: true }), mac)).toBe('out');
    expect(matchZoomShortcut(key('Digit0', { metaKey: true }), mac)).toBe('reset');
  });
  it('maps ⌥⌘ to the content text size', () => {
    expect(matchZoomShortcut(key('Equal', { metaKey: true, altKey: true }), mac)).toBe('text-in');
    expect(matchZoomShortcut(key('Minus', { metaKey: true, altKey: true }), mac)).toBe('text-out');
    expect(matchZoomShortcut(key('Digit0', { metaKey: true, altKey: true }), mac)).toBe('text-reset');
  });
  it('uses Ctrl / Alt off macOS', () => {
    expect(matchZoomShortcut(key('Equal', { ctrlKey: true }), other)).toBe('in');
    expect(matchZoomShortcut(key('Minus', { ctrlKey: true, altKey: true }), other)).toBe('text-out');
    expect(matchZoomShortcut(key('Equal', { metaKey: true }), other)).toBeNull();
  });
  it('ignores other keys and modifiers', () => {
    expect(matchZoomShortcut(key('Equal'), mac)).toBeNull();
    expect(matchZoomShortcut(key('Equal', { ctrlKey: true }), mac)).toBeNull();
    expect(matchZoomShortcut(key('Equal', { metaKey: true, ctrlKey: true }), mac)).toBeNull();
    expect(matchZoomShortcut(key('Minus', { metaKey: true, shiftKey: true }), mac)).toBeNull();
    expect(matchZoomShortcut(key('KeyB', { metaKey: true }), mac)).toBeNull();
  });
  it('falls back to `key` when `code` is missing', () => {
    expect(matchZoomShortcut({ ...key('', { metaKey: true }), key: '+' }, mac)).toBe('in');
  });
});

describe('store actions and migration', () => {
  it('steps zoom and content size, flagging the indicator', () => {
    const s = useUiStore.getState();
    s.zoomReset();
    s.zoomIn();
    s.zoomIn();
    expect(useUiStore.getState().zoom).toBe(1.2);
    expect(useUiStore.getState().zoomFlash?.kind).toBe('zoom');
    s.contentReset();
    s.contentBigger();
    expect(useUiStore.getState().contentStep).toBe(1);
    expect(useUiStore.getState().zoomFlash?.kind).toBe('text');
    expect(useUiStore.getState().zoom).toBe(1.2);
    s.zoomReset();
    s.contentReset();
  });
  it('v1 → v2 adds zoom 1 and content step 0', () => {
    expect(migrateUi({ rightWidth: 400 }, 1)).toMatchObject({ rightWidth: 400, zoom: 1, contentStep: 0 });
  });
});
