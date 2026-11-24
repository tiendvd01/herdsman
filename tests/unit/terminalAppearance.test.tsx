import { act, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import WorkspaceTerminal from '@/components/terminal/WorkspaceTerminal';
import { useUiStore } from '@/stores/useUiStore';

const checks = vi.hoisted(() => ({
  attach: vi.fn(async () => {}),
  detach: vi.fn(async () => {}),
  fit: vi.fn(),
  fontData: vi.fn(async () => new ArrayBuffer(4)),
  fontAvailable: vi.fn(() => true),
  dispose: vi.fn(),
  instances: [] as { fontFamily?: string; fontSize?: number }[],
}));

vi.mock('@xterm/addon-fit', () => ({ FitAddon: class { fit = checks.fit; } }));

vi.mock('@xterm/xterm', () => ({
  Terminal: class {
    rows = 24;
    cols = 80;
    constructor(public options: { fontFamily?: string; fontSize?: number }) {
      checks.instances.push(options);
    }
    loadAddon() {}
    open() {}
    focus() {}
    onData() { return { dispose() {} }; }
    onBinary() { return { dispose() {} }; }
    onResize() { return { dispose() {} }; }
    dispose() { checks.dispose(); }
  },
}));

vi.mock('@/lib/fonts', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/fonts')>(),
  isFontAvailable: checks.fontAvailable,
}));

vi.mock('@/lib/api', () => ({
  api: {
    workspaceTerminalAttach: checks.attach,
    terminalFontData: checks.fontData,
    workspaceTerminalDetach: checks.detach,
    workspaceTerminalResize: vi.fn(async () => {}),
  },
  errMsg: String,
}));

it('updates and refits the existing terminal when Code font or size changes without reattaching', async () => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  useUiStore.setState({ codeFont: 'menlo', codeFontSize: null, contentStep: 2 });
  const view = render(<WorkspaceTerminal workspaceId="ws" address="t1" live />);
  try {
    const viewport = screen.getByLabelText('Terminal');
    expect(viewport.parentElement?.classList.contains('p-2')).toBe(true);
    await waitFor(() => expect(checks.instances[0]?.fontFamily).toContain('Menlo'));
    expect(checks.instances[0].fontSize).toBe(14);
    const initialFits = checks.fit.mock.calls.length;

    act(() => useUiStore.getState().setCodeFont('family:JetBrainsMono Nerd Font'));
    expect(checks.instances[0].fontFamily).toBe("'JetBrainsMono Nerd Font', 'Geist Mono', ui-monospace, monospace");
    expect(checks.fit.mock.calls.length).toBeGreaterThan(initialFits);

    act(() => useUiStore.getState().setCodeFont('menlo'));
    expect(checks.instances[0].fontFamily).toMatch(/^'Menlo'/);
    const fontFits = checks.fit.mock.calls.length;
    act(() => useUiStore.getState().setCodeFontSize(20));
    expect(checks.instances[0].fontSize).toBe(20);
    expect(checks.fit.mock.calls.length).toBeGreaterThan(fontFits);
    act(() => useUiStore.getState().setCodeFontSize(null));
    expect(checks.instances[0].fontSize).toBe(14);
    expect(checks.instances).toHaveLength(1);
    expect(checks.attach).toHaveBeenCalledTimes(1);
    expect(checks.detach).not.toHaveBeenCalled();
    expect(checks.dispose).not.toHaveBeenCalled();
  } finally {
    view.unmount();
    vi.unstubAllGlobals();
  }
});

it('registers a local font hidden by WebKit and applies it to the rendered terminal', async () => {
  checks.fontAvailable.mockReturnValueOnce(false);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('FontFace', class {
    constructor(public family: string) {}
    async load() { return this; }
  });
  const fonts = { add: vi.fn(), delete: vi.fn() };
  Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
  useUiStore.setState({ codeFont: 'family:0xProto Nerd Font Mono' });
  const view = render(<WorkspaceTerminal workspaceId="ws" address="t2" live />);
  try {
    await waitFor(() => expect(fonts.add).toHaveBeenCalledTimes(1));
    expect(checks.fontData).toHaveBeenCalledWith('0xProto Nerd Font Mono');
    expect(checks.instances[checks.instances.length - 1]?.fontFamily).toMatch(/^'Herdsman Terminal Font/);
  } finally {
    view.unmount();
    Reflect.deleteProperty(document, 'fonts');
    vi.unstubAllGlobals();
  }
});
