import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { api, errMsg } from '@/lib/api';
import { fontOption, fontStack, isFontAvailable } from '@/lib/fonts';
import { CODE_FONT_SIZE } from '@/lib/uiZoom';
import { useUiStore } from '@/stores/useUiStore';
import { Button } from '@/components/ui/button';

let nextFontAlias = 0;

export default function WorkspaceTerminal({ workspaceId, address, live }: {
  workspaceId: string;
  address: string;
  live: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const renderer = useRef<{ terminal: Terminal; fit: FitAddon }>();
  const codeFont = useUiStore((s) => s.codeFont);
  const codeFontSize = useUiStore((s) => s.codeFontSize);
  const contentStep = useUiStore((s) => s.contentStep);
  const fontSize = codeFontSize ?? CODE_FONT_SIZE.base + contentStep;
  const selected = fontOption('code', codeFont);
  const localFamily = selected.bundled ? null : selected.family;
  const [loadedFont, setLoadedFont] = useState<{ family: string; alias: string }>();
  const fallback = fontStack('code', codeFont);
  const fontFamily = loadedFont && loadedFont.family === localFamily
    ? `'${loadedFont.alias}', ${fallback}`
    : fallback;
  const [attempt, retry] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    setError('');
    let disposed = false;
    const id = crypto.randomUUID();
    const encoder = new TextEncoder();
    const theme = () => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, foreground: style.color, cursor: style.color };
    };
    const style = getComputedStyle(element);
    const terminal = new Terminal({
      fontFamily: style.fontFamily,
      fontSize: Number.parseFloat(style.fontSize),
      scrollback: 1000,
      cursorBlink: true,
      theme: theme(),
    });
    const fit = new FitAddon();
    try {
      terminal.loadAddon(fit);
      terminal.open(element);
    } catch (error) {
      terminal.dispose();
      throw error;
    }
    renderer.current = { terminal, fit };
    fit.fit();
    terminal.focus();

    let connected = false;
    let inputQueue = Promise.resolve();
    const report = (failure: unknown) => { if (!disposed) setError(errMsg(failure)); };
    const sendInput = (data: Uint8Array) => {
      if (!connected) return;
      inputQueue = inputQueue.then(async () => {
        if (!disposed) await api.workspaceTerminalInput(id, data);
      }).catch(report);
    };
    const input = terminal.onData((data) => sendInput(encoder.encode(data)));
    const binary = terminal.onBinary((data) => sendInput(Uint8Array.from(data, (byte) => byte.charCodeAt(0))));
    const resize = terminal.onResize(({ rows, cols }) => {
      if (connected) void api.workspaceTerminalResize(id, rows, cols).catch(report);
    });
    const observer = new ResizeObserver(() => fit.fit());
    observer.observe(element);
    const themeObserver = new MutationObserver(() => { terminal.options.theme = theme(); });
    themeObserver.observe(document.documentElement, { attributes: true });

    const attachment = api.workspaceTerminalAttach(id, workspaceId, address, terminal.rows, terminal.cols, (buffer) => {
      if (disposed) return;
      if (buffer.byteLength) terminal.write(new Uint8Array(buffer));
      else {
        connected = false;
        terminal.options.disableStdin = true;
        setError('Terminal disconnected.');
      }
    }).then(() => {
      if (disposed) return;
      connected = !terminal.options.disableStdin;
      if (connected) return api.workspaceTerminalResize(id, terminal.rows, terminal.cols);
    }).catch(report);

    return () => {
      disposed = true;
      renderer.current = undefined;
      observer.disconnect();
      themeObserver.disconnect();
      input.dispose();
      binary.dispose();
      resize.dispose();
      terminal.dispose();
      void attachment.then(() => api.workspaceTerminalDetach(id)).catch(() => {});
    };
  }, [workspaceId, address, attempt]);

  useEffect(() => {
    if (!localFamily || typeof FontFace === 'undefined' || isFontAvailable(localFamily)) return;
    let disposed = false;
    let loaded: FontFace | undefined;
    const alias = `Herdsman Terminal Font ${++nextFontAlias}`;
    void api.terminalFontData(localFamily)
      .then((bytes) => new FontFace(alias, bytes).load())
      .then((face) => {
        if (disposed) return;
        loaded = face;
        document.fonts.add(face);
        setLoadedFont({ family: localFamily, alias });
      })
      .catch(() => {});
    return () => {
      disposed = true;
      if (loaded) document.fonts.delete(loaded);
      setLoadedFont(undefined);
    };
  }, [localFamily]);

  useEffect(() => {
    const view = renderer.current;
    if (!view) return;
    const { options } = view.terminal;
    if (options.fontFamily === fontFamily && options.fontSize === fontSize) return;
    options.fontFamily = fontFamily;
    options.fontSize = fontSize;
    view.fit.fit();
  }, [fontFamily, fontSize]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <div className="flex min-h-0 flex-1 flex-col p-2">
        <div ref={container} aria-label="Terminal" style={{ fontFamily, fontSize }}
          className="min-h-0 flex-1 overflow-hidden bg-background font-mono" />
      </div>
      {!live || error ? (
        <div role="status" className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2 text-sm">
          {live ? error : 'Terminal ended.'}
          {live ? <Button size="xs" variant="outline" onClick={() => retry((value) => value + 1)}>Reconnect</Button> : null}
        </div>
      ) : null}
    </div>
  );
}
