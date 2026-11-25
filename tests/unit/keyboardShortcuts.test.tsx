import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommandDialog } from '@/components/command/CommandDialog';
import { KeyboardShortcutsSection } from '@/components/settings/KeyboardShortcutsSection';
import { effectiveShortcut, matchShortcut, saveShortcut } from '@/lib/keyboardShortcuts';
import { IS_MAC } from '@/lib/platform';
import { useUiStore } from '@/stores/useUiStore';

const modifier = IS_MAC ? { metaKey: true } : { ctrlKey: true };
const storageKey = 'herdsman.keyboardShortcuts';
const press = (code: string, options: KeyboardEventInit = {}) =>
  fireEvent.keyDown(window, { ...modifier, code, ...options });

afterEach(async () => {
  cleanup();
  await saveShortcut();
  useUiStore.setState({ cmdOpen: false, settingsOpen: false });
});

describe('keyboard shortcuts', () => {
  it('selects positions 1–9 from the rendered order after reordering', () => {
    const pick = vi.fn();
    const client = new QueryClient();
    const frame = (ids: number[]) => (
      <QueryClientProvider client={client}>
        <CommandDialog />
        <div data-workspace-tabs="">
          {ids.map((id) => <button key={id} role="tab" onClick={() => pick(id)}>{id}</button>)}
        </div>
      </QueryClientProvider>
    );
    const order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const view = render(frame(order));
    for (let index = 1; index <= 9; index++) press(`Digit${index}`);
    expect(pick.mock.calls.flat()).toEqual(order.slice(0, 9));
    pick.mockClear();
    const reordered = [5, 4, 3, 2, 1, 10, 9, 8, 7, 6];
    view.rerender(frame(reordered));
    for (let index = 1; index <= 9; index++) press(`Digit${index}`);
    expect(pick.mock.calls.flat()).toEqual(reordered.slice(0, 9));
    view.rerender(frame([5]));
    pick.mockClear();
    press('Digit2');
    expect(pick).not.toHaveBeenCalled();
  });

  it('clicks only the selected tab’s close button and blocks repeats and dialogs', () => {
    const close = vi.fn();
    const other = vi.fn();
    render(<QueryClientProvider client={new QueryClient()}>
      <CommandDialog />
      <div data-workspace-tabs="">
        <div><button role="tab" aria-selected={false} /><button data-close-tab="" onClick={other} /></div>
        <div><button role="tab" aria-selected /><button data-close-tab="" onClick={close} /></div>
      </div>
    </QueryClientProvider>);
    expect(press('KeyW')).toBe(false);
    press('KeyW', { repeat: true });
    expect(close).toHaveBeenCalledTimes(1);
    expect(other).not.toHaveBeenCalled();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.dataset.state = 'open';
    document.body.append(dialog);
    try {
      press('KeyW');
      expect(close).toHaveBeenCalledTimes(1);
    } finally {
      dialog.remove();
    }
    screen.getAllByRole('tab')[1].setAttribute('aria-selected', 'false');
    expect(press('KeyW')).toBe(false);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('edits a binding, reports a conflict, and restores the default', async () => {
    render(<KeyboardShortcutsSection />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Close Tab' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change Close Tab shortcut' }));
    const recorder = screen.getByRole('textbox', { name: 'Record shortcut for Close Tab' });
    fireEvent.keyDown(recorder, { ...modifier, code: 'Digit1', key: '1' });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Switch to Tab 1/);
    fireEvent.keyDown(recorder, { ...modifier, shiftKey: true, code: 'KeyW', key: 'W' });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const replacement = IS_MAC ? 'Meta+Shift+KeyW' : 'Control+Shift+KeyW';
    await waitFor(() => expect(effectiveShortcut('close-tab')).toBe(replacement));
    expect(JSON.parse(localStorage.getItem(storageKey)!)['close-tab']).toBe(replacement);
    expect(matchShortcut(new KeyboardEvent('keydown', { ...modifier, code: 'KeyW' }))).toBeUndefined();
    fireEvent.click(await screen.findByRole('button', { name: 'Reset Close Tab shortcut' }));
    await waitFor(() => expect(matchShortcut(new KeyboardEvent('keydown', { ...modifier, code: 'KeyW' }))).toBe('close-tab'));
  });

  it('rehydrates the last saved binding and keeps it on a failed write', async () => {
    const replacement = IS_MAC ? 'Meta+Shift+KeyW' : 'Control+Shift+KeyW';
    await saveShortcut('close-tab', replacement);
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('Storage unavailable');
    });
    try {
      await expect(saveShortcut('close-tab')).rejects.toThrow('Storage unavailable');
      expect(effectiveShortcut('close-tab')).toBe(replacement);
      vi.resetModules();
      const reloaded = await import('@/lib/keyboardShortcuts');
      expect(reloaded.effectiveShortcut('close-tab')).toBe(replacement);
    } finally {
      write.mockRestore();
    }
  });
});
