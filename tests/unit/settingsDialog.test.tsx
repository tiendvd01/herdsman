import { TooltipProvider } from '@/components/ui/tooltip';
// Spec 010: Settings dialog — opens from the store, theme radio group, font picker + reset.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/api', () => ({ api: { fontFamilies: vi.fn(async () => ['Arial', 'Courier New', 'Georgia', 'Menlo']) } }));

import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { applyFonts } from '@/lib/theme';
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
  it('is closed until opened, then shows the Appearance section', () => {
    render(<SettingsDialog />);
    expect(screen.queryByRole('dialog')).toBeNull();
    open();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Appearance' }).getAttribute('aria-current')).toBe('page');
  });

  it('switches theme from the radio group', () => {
    render(<SettingsDialog />);
    open();
    const group = screen.getByRole('radiogroup', { name: 'Theme' });
    expect(group.querySelector('[aria-checked="true"]')?.textContent).toBe('System');
    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(useUiStore.getState().theme).toBe('dark');
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

  it('lists built-in themes by brightness in the Light theme and Dark theme selects', () => {
    render(<SettingsDialog />);
    open();
    const light = screen.getByRole('combobox', { name: 'Light theme' });
    const dark = screen.getByRole('combobox', { name: 'Dark theme' });
    expect(light.textContent).toContain('Light');
    expect(dark.textContent).toContain('Dark');
    fireEvent.click(light);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Light', 'Paper']);
    fireEvent.click(screen.getByRole('option', { name: 'Paper' }));
    expect(useUiStore.getState().lightTheme).toBe('paper');
  });

  it('shows where custom themes go and that nothing is wrong', () => {
    render(<SettingsDialog />);
    open();
    expect(screen.getByText('Custom themes')).toBeTruthy();
    expect(screen.getByText('No problems found')).toBeTruthy();
  });

  it('lists problems with custom theme files and offers valid ones in the select', () => {
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
    fireEvent.click(screen.getByRole('combobox', { name: 'Light theme' }));
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toContain('sepia · custom');
  });
});
