// Spec 007: ⌘B / ⌘R toggle the two sidebars — key matching, no default action, no effect while a dialog is open.
import { cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandDialog } from '@/components/command/CommandDialog';
import { IS_MAC } from '@/lib/platform';
import { matchShortcut } from '@/lib/keyboardShortcuts';
import { useUiStore } from '@/stores/useUiStore';

const modifier = IS_MAC ? { metaKey: true } : { ctrlKey: true };

describe('sidebar bindings', () => {
  it('matches the physical key and the platform modifier', () => {
    const match = (code: string, modifiers: KeyboardEventInit) =>
      matchShortcut(new KeyboardEvent('keydown', { key: 'и', code, ...modifiers }));
    expect(match('KeyB', modifier)).toBe('sidebar');
    expect(match('KeyR', modifier)).toBe('side-panel');
    expect(match('KeyB', {})).toBeUndefined();
    expect(match('KeyB', { metaKey: true, ctrlKey: true })).toBeUndefined();
    expect(match('KeyB', { ...modifier, shiftKey: true })).toBeUndefined();
    expect(match('KeyR', { ...modifier, altKey: true })).toBeUndefined();
  });
  const press = (target: EventTarget, k: string, mods: Partial<KeyboardEventInit> = {}) => {
    const e = new KeyboardEvent('keydown', { key: k, code: `Key${k.toUpperCase()}`, ...modifier, bubbles: true, cancelable: true, ...mods });
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
    render(createElement(QueryClientProvider, { client: new QueryClient() }, createElement(CommandDialog)));
  });
  afterAll(() => vi.unstubAllGlobals());
  afterEach(() => {
    cleanup();
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
    press(ta, 'b', { repeat: true });
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
    document.body.insertAdjacentHTML('beforeend', '<aside aria-label="Sidebar"><input id="search" /></aside><main tabindex="-1"><textarea id="composer-s1"></textarea></main>');
    (document.getElementById('search') as HTMLInputElement).focus();
    press(document.activeElement!, 'b');
    expect(document.activeElement?.id).toBe('composer-s1');
  });
});
