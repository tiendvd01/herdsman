// Spec 016 US4: Light/Dark theme choice, System + macOS, ⌘⇧L, migration, <html> state.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({ api: { themeFiles: vi.fn(async () => [{ file: 'sepia.json', text: '{"background":"#fbf7ef","foreground":"#2a2622"}' }]) } }));

import { bootTheme, resolveThemeId, useThemeColors, useThemeEffect } from '@/lib/theme';
import { cycleTheme } from '@/lib/actions';
import { migrateUi, useUiStore } from '@/stores/useUiStore';

let systemDark = false;
const listeners = new Set<() => void>();
const original = window.matchMedia;
const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const html = () => document.documentElement;
const setSystem = (v: boolean) =>
  act(() => {
    systemDark = v;
    listeners.forEach((fn) => fn());
  });

beforeEach(() => {
  systemDark = false;
  listeners.clear();
  window.matchMedia = ((q: string) => ({
    get matches() {
      return systemDark;
    },
    media: q,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  })) as unknown as typeof window.matchMedia;
  useUiStore.setState({ theme: 'system', lightTheme: 'light', darkTheme: 'dark' });
  html().className = '';
  html().removeAttribute('style');
  localStorage.clear();
});
afterEach(() => {
  window.matchMedia = original;
});

describe('resolveThemeId', () => {
  it('Dark mode and System+dark macOS use the dark theme, otherwise the light one', () => {
    expect(resolveThemeId('dark', 'paper', 'dark', false)).toBe('dark');
    expect(resolveThemeId('light', 'paper', 'dark', true)).toBe('paper');
    expect(resolveThemeId('system', 'paper', 'dark', true)).toBe('dark');
    expect(resolveThemeId('system', 'paper', 'dark', false)).toBe('paper');
  });
});

describe('theme on <html>', () => {
  it('writes the colours and the dark class for the theme in effect', () => {
    renderHook(() => useThemeEffect(), { wrapper });
    expect(html().style.getPropertyValue('--background')).toBe('#e7e9f2');
    const lightIgnored = html().style.getPropertyValue('--git-ignored-fg');
    expect(lightIgnored).toMatch(/^#[\da-f]{6}$/i);
    expect(html().classList.contains('dark')).toBe(false);
    act(() => useUiStore.setState({ lightTheme: 'paper' }));
    expect(html().style.getPropertyValue('--background')).toBe('#f6f1e7');
    act(() => useUiStore.setState({ theme: 'dark' }));
    expect(html().style.getPropertyValue('--background')).toBe('#232635');
    expect(html().classList.contains('dark')).toBe(true);
    const darkIgnored = html().style.getPropertyValue('--git-ignored-fg');
    expect(darkIgnored).toMatch(/^#[\da-f]{6}$/i);
    expect(darkIgnored).not.toBe(lightIgnored);
    act(() => useUiStore.setState({ darkTheme: 'one-dark-pro' }));
    expect(html().style.getPropertyValue('--git-ignored-fg')).toMatch(/^#[\da-f]{6}$/i);
    act(() => useUiStore.setState({ theme: 'light', lightTheme: 'light' }));
    expect(html().style.getPropertyValue('--git-ignored-fg')).toBe(lightIgnored);
  });

  it('System + macOS toggle switches Paper ↔ Dark and keeps the choice', () => {
    useUiStore.setState({ lightTheme: 'paper' });
    renderHook(() => useThemeEffect(), { wrapper });
    expect(html().style.getPropertyValue('--background')).toBe('#f6f1e7');
    setSystem(true);
    expect(html().classList.contains('dark')).toBe(true);
    setSystem(false);
    expect(html().style.getPropertyValue('--background')).toBe('#f6f1e7');
    expect(useUiStore.getState().lightTheme).toBe('paper');
  });

  it('a custom theme file becomes selectable and applies', async () => {
    const { result } = renderHook(() => useThemeColors(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    act(() => useUiStore.setState({ lightTheme: 'sepia' }));
    expect(result.current.id).toBe('sepia');
  });

  it('a missing or wrong-brightness theme falls back to the default', () => {
    useUiStore.setState({ lightTheme: 'gone', darkTheme: 'paper', theme: 'system' });
    const { result } = renderHook(() => useThemeColors(), { wrapper });
    expect(result.current.id).toBe('light');
    setSystem(true);
    expect(result.current.id).toBe('dark'); // 'paper' is light, so Dark falls back
  });

  it('paints the current built-in palette when an older version was cached', () => {
    localStorage.setItem('herdsman-theme-cache', JSON.stringify({ light: {
      id: 'light', name: 'Light', appearance: 'light', source: 'builtin',
      colors: { background: '#ffffff', foreground: '#09090b' },
    } }));
    bootTheme();
    expect(html().style.getPropertyValue('--background')).toBe('#e7e9f2');
  });

  it('derives the ignored foreground when restoring an older cached custom theme', () => {
    useUiStore.setState({ lightTheme: 'sepia' });
    localStorage.setItem('herdsman-theme-cache', JSON.stringify({ light: {
      id: 'sepia', name: 'Sepia', appearance: 'light', source: 'custom',
      colors: { background: '#fbf7ef', foreground: '#2a2622' },
    } }));
    bootTheme();
    expect(html().style.getPropertyValue('--background')).toBe('#fbf7ef');
    expect(html().style.getPropertyValue('--git-ignored-fg')).toMatch(/^#[\da-f]{6}$/i);
  });
});

describe('⌘⇧L cycle', () => {
  it('goes System → Light → Dark → System and keeps both theme choices', () => {
    useUiStore.setState({ lightTheme: 'paper', darkTheme: 'dark' });
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      cycleTheme();
      seen.push(useUiStore.getState().theme);
    }
    expect(seen).toEqual(['light', 'dark', 'system']);
    expect(useUiStore.getState().lightTheme).toBe('paper');
  });
});

describe('persistence', () => {
  it('defaults to light and dark', () => {
    expect(useUiStore.getState().lightTheme).toBe('light');
    expect(useUiStore.getState().darkTheme).toBe('dark');
  });

  it('migrates the spec 015 Light style to a theme id (v3 → v4)', () => {
    expect(migrateUi({ lightStyle: 'paper' }, 3)).toMatchObject({ lightTheme: 'paper', darkTheme: 'dark' });
    expect(migrateUi({ lightStyle: 'default' }, 3)).toMatchObject({ lightTheme: 'light' });
    expect('lightStyle' in migrateUi({ lightStyle: 'paper' }, 3)).toBe(false);
  });

  it('replaces junk theme ids when restoring', () => {
    const merge = useUiStore.persist.getOptions().merge!;
    const out = merge({ lightTheme: 42, darkTheme: '' }, useUiStore.getState());
    expect([out.lightTheme, out.darkTheme]).toEqual(['light', 'dark']);
    expect(merge({ lightTheme: 'sepia' }, useUiStore.getState()).lightTheme).toBe('sepia');
  });
});
