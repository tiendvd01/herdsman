// Spec 007: ⌘B / ⌘R toggle the two sidebars — key matching, no default action, no effect while a dialog is open.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { matchSidebarShortcut, installSidebarShortcuts } from '@/lib/sidebarShortcuts';
import { useUiStore } from '@/stores/useUiStore';

const key = (k: string, mods: Partial<KeyboardEventInit> = {}) => ({
  key: k,
  code: `Key${k.toUpperCase()}`,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  repeat: false,
  ...mods,
});
const mac = { isMac: true, dialogOpen: false };
const other = { isMac: false, dialogOpen: false };

describe('matchSidebarShortcut', () => {
  it('maps ⌘B / ⌘R on macOS and Ctrl+B / Ctrl+R elsewhere', () => {
    expect(matchSidebarShortcut(key('b', { metaKey: true }), mac)).toBe('left');
    expect(matchSidebarShortcut(key('r', { metaKey: true }), mac)).toBe('right');
    expect(matchSidebarShortcut(key('b', { ctrlKey: true }), other)).toBe('left');
    expect(matchSidebarShortcut(key('r', { ctrlKey: true }), other)).toBe('right');
  });
  it('ignores the wrong modifier, extra modifiers, other keys, repeats and open dialogs', () => {
    expect(matchSidebarShortcut(key('b', { ctrlKey: true }), mac)).toBeNull();
    expect(matchSidebarShortcut(key('b', { metaKey: true, ctrlKey: true }), mac)).toBeNull();
    expect(matchSidebarShortcut(key('b', { metaKey: true, shiftKey: true }), mac)).toBeNull();
    expect(matchSidebarShortcut(key('r', { metaKey: true, altKey: true }), mac)).toBeNull();
    expect(matchSidebarShortcut(key('k', { metaKey: true }), mac)).toBeNull();
    expect(matchSidebarShortcut(key('b'), mac)).toBeNull();
    expect(matchSidebarShortcut(key('b', { metaKey: true, repeat: true }), mac)).toBeNull();
    expect(matchSidebarShortcut(key('b', { metaKey: true }), { isMac: true, dialogOpen: true })).toBeNull();
  });
  it('uses the physical key so non-Latin layouts work', () => {
    expect(matchSidebarShortcut({ ...key('b', { metaKey: true }), key: 'и' }, mac)).toBe('left');
  });
});

describe('installSidebarShortcuts', () => {
  let uninstall: () => void;
  // jsdom user agent is not a Mac, so the app-level modifier is Ctrl here.
  const press = (target: EventTarget, k: string, mods: Partial<KeyboardEventInit> = {}) => {
    const e = new KeyboardEvent('keydown', { key: k, code: `Key${k.toUpperCase()}`, ctrlKey: true, bubbles: true, cancelable: true, ...mods });
    target.dispatchEvent(e);
    return e;
  };

  beforeAll(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
  });
  beforeEach(() => {
    useUiStore.setState({ sidebarOpen: true, rightOpen: true, rightTab: 'log', rightWidth: 500, cmdOpen: false });
    uninstall = installSidebarShortcuts();
  });
  afterEach(() => {
    uninstall();
    document.body.innerHTML = '';
  });

  it('toggles the left sidebar from inside a text field without touching its text', () => {
    const ta = document.createElement('textarea');
    ta.value = 'hello';
    document.body.append(ta);
    ta.focus();
    const typed = vi.fn();
    ta.addEventListener('keydown', typed);
    const e = press(ta, 'b');
    expect(e.defaultPrevented).toBe(true);
    expect(typed).not.toHaveBeenCalled();
    expect(ta.value).toBe('hello');
    expect(useUiStore.getState().sidebarOpen).toBe(false);
    press(ta, 'b');
    expect(useUiStore.getState().sidebarOpen).toBe(true);
  });

  it('toggles the right panel, blocks reload, keeps its tab and width', () => {
    const e = press(window, 'r');
    expect(e.defaultPrevented).toBe(true);
    expect(useUiStore.getState()).toMatchObject({ rightOpen: false, rightTab: 'log', rightWidth: 500 });
    press(window, 'r');
    expect(useUiStore.getState().rightOpen).toBe(true);
  });

  it('does nothing while a dialog is open', () => {
    const dlg = document.createElement('div');
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('data-state', 'open');
    document.body.append(dlg);
    const e = press(dlg, 'b');
    expect(e.defaultPrevented).toBe(false);
    expect(useUiStore.getState().sidebarOpen).toBe(true);
    useUiStore.setState({ cmdOpen: true });
    dlg.remove();
    press(window, 'r');
    expect(useUiStore.getState().rightOpen).toBe(true);
  });

  it('still works while an inline (non-modal) permission card is shown', () => {
    const card = document.createElement('div');
    card.setAttribute('role', 'alertdialog');
    document.body.append(card);
    press(window, 'b');
    expect(useUiStore.getState().sidebarOpen).toBe(false);
  });

  it('moves focus to the composer when the focused column is hidden', () => {
    document.body.innerHTML = '<aside aria-label="Sidebar"><input id="search" /></aside><main tabindex="-1"><textarea id="composer-s1"></textarea></main>';
    (document.getElementById('search') as HTMLInputElement).focus();
    press(document.activeElement!, 'b');
    expect(document.activeElement?.id).toBe('composer-s1');
  });
});
