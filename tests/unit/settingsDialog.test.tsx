import { TooltipProvider } from '@/components/ui/tooltip';
// Spec 010: Settings dialog — opens from the store, theme radio group, font picker + reset.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render as rtlRender, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', () => ({
  api: {
    projectList: vi.fn(async () => [{ id: 'alpha', name: 'Alpha' }, { id: 'beta', name: 'Beta' }]),
    projectSkillCatalog: vi.fn(),
    projectSkillChange: vi.fn(async () => {}),
    fontFamilies: vi.fn(async () => ['Arial', 'Courier New', 'Georgia', 'Menlo']),
    notificationsRequestPermission: vi.fn(async () => {}),
  },
}));

import { api } from '@/lib/api';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { applyFonts, useThemeEffect } from '@/lib/theme';
import { builtinThemes } from '@/theme/catalog';
import { useZoomEffect } from '@/lib/zoomShortcuts';
import { useUiStore } from '@/stores/useUiStore';
import { useThemeFiles } from '@/theme/files';

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.scrollIntoView ??= () => {};
});

beforeEach(() => {
  useThemeFiles.setState({ files: [] });
  useUiStore.setState({ settingsOpen: false, theme: 'system', lightTheme: 'light', darkTheme: 'dark', uiFont: 'geist', codeFont: 'geist-mono' });
});

const render = (ui: React.ReactElement) => rtlRender(<QueryClientProvider client={new QueryClient()}><TooltipProvider>{ui}</TooltipProvider></QueryClientProvider>);
const open = () => act(() => useUiStore.getState().setSettingsOpen(true));

describe('SettingsDialog', () => {
  it('manages skills for the selected project and shows native skills as read only', async () => {
    useUiStore.setState({ projectId: 'beta' });
    const managed = { source_id: 'shared', directory: 'review', name: 'Review', path: '/shared/review', description: 'Review changes', enabled: false, native: false, global: false, reason: null };
    vi.mocked(api.projectSkillCatalog).mockResolvedValue({
      sources: [{ id: 'shared', path: '/shared', available: true }],
      skills: [
        managed,
        { ...managed, source_id: 'native:beta', directory: 'build', name: 'Build', path: '/beta/.claude/skills/build', native: true },
      ],
      enabled: [],
    });
    render(<SettingsDialog />);
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Skills' }));
    expect((await screen.findByRole('combobox', { name: 'Project' })).textContent).toContain('Beta');
    expect(await screen.findByText('Claude project · Read only')).toBeTruthy();
    expect(screen.queryByRole('switch', { name: 'Enable Build' })).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: 'Enable Review' }));
    await waitFor(() => expect(api.projectSkillChange).toHaveBeenCalledWith('beta', {
      kind: 'set', source_id: 'shared', directory: 'review', enabled: true,
    }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Search skills' }), { target: { value: 'unavailable search' } });
    expect(screen.getByText('No matching skills.')).toBeTruthy();
  });

  it('is closed until opened, then shows the Appearance section', () => {
    render(<SettingsDialog />);
    expect(screen.queryByRole('dialog')).toBeNull();
    open();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Appearance' }).getAttribute('aria-current')).toBe('page');
  });

  it('restores notification defaults and persists both choices across rehydration', async () => {
    vi.mocked(api.notificationsRequestPermission).mockClear();
    const key = 'herdsman-ui';
    const previous = localStorage.getItem(key);
    try {
      await act(async () => {
        localStorage.setItem(key, JSON.stringify({ state: { theme: 'system' }, version: 4 }));
        await useUiStore.persist.rehydrate();
      });
      render(<SettingsDialog />);
      open();
      fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
      expect(screen.getByRole('heading', { name: 'Notifications' })).toBeTruthy();
      const completion = screen.getByRole('switch', { name: 'Agent completion notifications' });
      const sound = screen.getByRole('switch', { name: 'Play completion sound' });
      expect(completion.getAttribute('aria-checked')).toBe('true');
      expect(sound.getAttribute('aria-checked')).toBe('true');

      fireEvent.click(sound);
      fireEvent.click(completion);
      expect((sound as HTMLButtonElement).disabled).toBe(true);
      expect(api.notificationsRequestPermission).not.toHaveBeenCalled();
      const configured = localStorage.getItem(key)!;
      await act(async () => {
        useUiStore.setState({ completionNotifications: true, completionSound: true });
        localStorage.setItem(key, configured);
        await useUiStore.persist.rehydrate();
      });
      expect(completion.getAttribute('aria-checked')).toBe('false');
      expect(sound.getAttribute('aria-checked')).toBe('false');

      fireEvent.click(completion);
      expect((sound as HTMLButtonElement).disabled).toBe(false);
      expect(sound.getAttribute('aria-checked')).toBe('false');
      expect(api.notificationsRequestPermission).toHaveBeenCalledTimes(1);
      fireEvent.click(sound);
      expect(api.notificationsRequestPermission).toHaveBeenCalledTimes(2);
    } finally {
      await act(async () => {
        if (previous === null) {
          useUiStore.setState({ completionNotifications: true, completionSound: true });
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, previous);
          await useUiStore.persist.rehydrate();
        }
      });
    }
  });

  it('switches theme from the radio group', () => {
    render(<SettingsDialog />);
    open();
    const group = screen.getByRole('radiogroup', { name: 'Theme' });
    expect(group.querySelector('[aria-checked="true"]')?.textContent).toBe('System');
    fireEvent.click(within(group).getByRole('radio', { name: 'Dark' }));
    expect(useUiStore.getState().theme).toBe('dark');
  });

  it('previews and applies both new palettes and restores independent selections', async () => {
    function SettingsWithTheme() {
      useThemeEffect();
      return <SettingsDialog />;
    }

    const root = document.documentElement;
    const previousStyle = root.style.cssText;
    const previousClass = root.className;
    const cacheKey = 'herdsman-theme-cache';
    const previousCache = localStorage.getItem(cacheKey);
    const key = 'herdsman-ui';
    const previousSettings = localStorage.getItem(key)!;
    const getBackground = (id: string) => builtinThemes().find((theme) => theme.id === id)!.colors.background;
    try {
      render(<SettingsWithTheme />);
      open();
      const dark = within(screen.getByRole('radiogroup', { name: 'Dark themes' }));
      const light = within(screen.getByRole('radiogroup', { name: 'Light themes' }));
      const mode = within(screen.getByRole('radiogroup', { name: 'Theme' }));
      const frappe = dark.getByRole('radio', { name: 'Catppuccin Frappé' });
      const oneDark = dark.getByRole('radio', { name: 'One Dark Pro' });
      const paper = light.getByRole('radio', { name: /paper/i });
      const frappeBackground = getBackground('catppuccin-frappe');
      const preview = frappe.firstElementChild as HTMLElement;
      const expected = document.createElement('span');
      expected.style.backgroundColor = frappeBackground;
      expect(preview.style.backgroundColor).toBe(expected.style.backgroundColor);
      expect(preview.lastElementChild?.children).toHaveLength(5);

      fireEvent.click(mode.getByRole('radio', { name: 'Dark' }));
      fireEvent.click(frappe);
      expect(root.style.getPropertyValue('--background')).toBe(frappeBackground);
      expect(frappe.getAttribute('aria-checked')).toBe('true');

      act(() => frappe.focus());
      fireEvent.keyDown(frappe, { key: 'ArrowRight' });
      await waitFor(() => expect(oneDark.getAttribute('aria-checked')).toBe('true'));
      expect(root.style.getPropertyValue('--background')).toBe(getBackground('one-dark-pro'));

      fireEvent.click(paper);
      expect(paper.getAttribute('aria-checked')).toBe('true');
      expect(root.style.getPropertyValue('--background')).toBe(getBackground('one-dark-pro'));

      const saved = localStorage.getItem(key)!;
      await act(async () => {
        useUiStore.setState({ lightTheme: 'light', darkTheme: 'dark' });
        localStorage.setItem(key, saved);
        await useUiStore.persist.rehydrate();
      });
      expect(oneDark.getAttribute('aria-checked')).toBe('true');
      expect(paper.getAttribute('aria-checked')).toBe('true');
      fireEvent.click(mode.getByRole('radio', { name: 'Light' }));
      expect(root.style.getPropertyValue('--background')).toBe(getBackground('paper'));
      const clearLight = light.getByRole('radio', { name: 'Clear Light' });
      fireEvent.click(clearLight);
      expect(clearLight.getAttribute('aria-checked')).toBe('true');
      expect(useUiStore.getState().lightTheme).toBe('clear-light');
      expect(root.style.getPropertyValue('--background')).toBe('#fdfdfc');
      expect(root.style.getPropertyValue('--primary')).toBe('#1a56b8');
      const minimal = light.getByRole('radio', { name: 'Minimal' });
      fireEvent.click(minimal);
      expect(minimal.getAttribute('aria-checked')).toBe('true');
      expect(useUiStore.getState().lightTheme).toBe('minimal');
      expect(root.style.getPropertyValue('--background')).toBe('#fcfcfa');
      expect(root.style.getPropertyValue('--primary')).toBe('#1f1fd6');
    } finally {
      await act(async () => {
        localStorage.setItem(key, previousSettings);
        await useUiStore.persist.rehydrate();
      });
      root.style.cssText = previousStyle;
      root.className = previousClass;
      if (previousCache === null) localStorage.removeItem(cacheKey);
      else localStorage.setItem(cacheKey, previousCache);
    }
  });

  it('shows custom themes and selects the default if the saved theme disappears', () => {
    useThemeFiles.setState({ files: [{
      file: 'custom-night.json',
      text: JSON.stringify({ name: 'Custom Night', appearance: 'dark', background: '#202020', foreground: '#ffffff' }),
    }] });
    render(<SettingsDialog />);
    open();
    const dark = within(screen.getByRole('radiogroup', { name: 'Dark themes' }));
    const custom = dark.getByRole('radio', { name: 'Custom Night' });
    fireEvent.click(custom);
    expect(custom.getAttribute('aria-checked')).toBe('true');
    act(() => useThemeFiles.setState({ files: [] }));
    expect(dark.queryByRole('radio', { name: 'Custom Night' })).toBeNull();
    expect(dark.getByRole('radio', { name: 'Dark' }).getAttribute('aria-checked')).toBe('true');
  });

  it('shows Reset only for a non-default font and resets it', () => {
    render(<SettingsDialog />);
    open();
    expect(screen.queryByRole('button', { name: 'Reset code font' })).toBeNull();
    act(() => useUiStore.getState().setCodeFont('menlo'));
    expect(screen.getByRole('button', { name: 'Code font' }).textContent).toContain('Menlo');
    fireEvent.click(screen.getByRole('button', { name: 'Reset code font' }));
    expect(useUiStore.getState().codeFont).toBe('geist-mono');
  });

  it('applies and restores a code font size independently of content text size', async () => {
    function SettingsWithZoom() {
      useZoomEffect();
      return <SettingsDialog />;
    }

    const rootStyle = document.documentElement.style;
    const previousStyle = document.documentElement.getAttribute('style');
    const previousSettings = useUiStore.getState();
    try {
      act(() => useUiStore.setState({ codeFontSize: null, contentStep: 2 }));
      render(<SettingsWithZoom />);
      open();
      const size = screen.getByRole('status', { name: 'Current code font size' });
      expect(size.textContent).toBe('14');
      expect(rootStyle.getPropertyValue('--code-font-size')).toBe('');
      fireEvent.click(screen.getByRole('button', { name: 'Increase code font size' }));
      expect(size.textContent).toBe('15');
      expect(rootStyle.getPropertyValue('--code-font-size')).toBe('15px');
      expect(rootStyle.getPropertyValue('--content-step')).toBe('2px');

      const saved = localStorage.getItem('herdsman-ui')!;
      await act(async () => {
        useUiStore.getState().setCodeFontSize(null);
        localStorage.setItem('herdsman-ui', saved);
        await useUiStore.persist.rehydrate();
      });
      expect(size.textContent).toBe('15');
      expect(rootStyle.getPropertyValue('--code-font-size')).toBe('15px');

      fireEvent.click(screen.getByRole('button', { name: 'Decrease code font size' }));
      expect(size.textContent).toBe('14');
      expect(rootStyle.getPropertyValue('--code-font-size')).toBe('14px');
      fireEvent.click(screen.getByRole('button', { name: 'Reset code font size' }));
      expect(useUiStore.getState().codeFontSize).toBeNull();
      expect(rootStyle.getPropertyValue('--code-font-size')).toBe('');
      expect(rootStyle.getPropertyValue('--content-step')).toBe('2px');
    } finally {
      act(() => useUiStore.setState(previousSettings));
      if (previousStyle === null) document.documentElement.removeAttribute('style');
      else document.documentElement.setAttribute('style', previousStyle);
    }
  });

  it('closes on Escape', () => {
    render(<SettingsDialog />);
    open();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(useUiStore.getState().settingsOpen).toBe(false);
  });

  it('lists installed families, filters by search and picks one', async () => {
    render(<SettingsDialog />);
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Interface font' }));
    expect(await screen.findByRole('option', { name: /Georgia/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Geist/ }).getAttribute('aria-selected')).toBe('true');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search interface font' }), { target: { value: 'geo' } });
    expect(screen.queryByRole('option', { name: /Arial/ })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: /Georgia/ }));
    expect(useUiStore.getState().uiFont).toBe('family:Georgia');
  });

  it('selects a code font with the keyboard and restores the saved choice and Reset', async () => {
    render(<SettingsDialog />);
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Code font' }));
    const option = await screen.findByRole('option', { name: 'Menlo' });
    expect(option.querySelector('span')?.style.fontFamily).toContain('Menlo');
    const search = screen.getByRole('textbox', { name: 'Search code font' });
    fireEvent.change(search, { target: { value: 'no-such-font' } });
    expect(screen.getByText('No fonts found')).toBeTruthy();
    fireEvent.change(search, { target: { value: 'menlo' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(useUiStore.getState()).toMatchObject({ codeFont: 'family:Menlo', uiFont: 'geist' });

    const root = document.createElement('div');
    async function restoreFontStack() {
      const saved = localStorage.getItem('herdsman-ui')!;
      await act(async () => {
        useUiStore.setState({ codeFont: 'monaco' });
        localStorage.setItem('herdsman-ui', saved);
        await useUiStore.persist.rehydrate();
      });
      const { uiFont, codeFont } = useUiStore.getState();
      applyFonts(uiFont, codeFont, root);
      return root.style.getPropertyValue('--font-mono');
    }

    expect(await restoreFontStack()).toBe("'Menlo', 'Geist Mono', ui-monospace, monospace");
    fireEvent.click(screen.getByRole('button', { name: 'Reset code font' }));
    expect(await restoreFontStack()).toBe("'Geist Mono', ui-monospace, monospace");
    expect(root.style.getPropertyValue('--font-sans')).toBe("'Geist', system-ui, sans-serif");
  });

  it('lists built-in themes by brightness in the Light and Dark galleries', () => {
    render(<SettingsDialog />);
    open();
    const light = within(screen.getByRole('radiogroup', { name: 'Light themes' }));
    const dark = within(screen.getByRole('radiogroup', { name: 'Dark themes' }));
    expect(light.getAllByRole('radio').map((radio) => radio.getAttribute('aria-label'))).toEqual(['Light', 'Paper', 'Clear Light', 'Minimal']);
    expect(dark.getAllByRole('radio').map((radio) => radio.getAttribute('aria-label'))).toEqual(['Dark', 'Catppuccin Frappé', 'One Dark Pro']);
    fireEvent.click(light.getByRole('radio', { name: 'Paper' }));
    expect(useUiStore.getState().lightTheme).toBe('paper');
  });

  it('shows where custom themes go and that nothing is wrong', () => {
    render(<SettingsDialog />);
    open();
    expect(screen.getByText('Custom themes')).toBeTruthy();
    expect(screen.getByText('No problems found')).toBeTruthy();
  });

  it('lists problems with custom theme files and offers valid ones in the gallery', () => {
    useThemeFiles.setState({
      files: [
        { file: 'bad.json', text: '{"background":"beige","foreground":"#000000"}' },
        { file: 'sepia.json', text: '{"background":"#fbf7ef","foreground":"#2a2622"}' },
      ],
    });
    render(<SettingsDialog />);
    open();
    const list = screen.getByLabelText('Theme problems');
    expect(list.textContent).toContain('bad.json · background');
    expect(list.textContent).toContain('skipped');
    const light = within(screen.getByRole('radiogroup', { name: 'Light themes' }));
    expect(light.getByRole('radio', { name: 'sepia' })).toBeTruthy();
  });
});
