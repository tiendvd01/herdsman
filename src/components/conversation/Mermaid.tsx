// Mermaid: renders lazily when scrolled into view, cached by content + theme; on error shows the source (FR-014).
import { useEffect, useState } from 'react';
import { CodeBlock } from './CodeBlock';
import { useInView } from './useInView';
import { currentFontSans, useThemeColors } from '@/lib/theme';
import type { ResolvedTheme } from '@/theme/resolve';

const cache = new Map<string, string>();
let seq = 0;
let mermaidP: Promise<typeof import('mermaid').default> | null = null;
let lastTheme = '';

async function renderMermaid(code: string, theme: ResolvedTheme) {
  const font = currentFontSans();
  const fingerprint = `${theme.id}\0${JSON.stringify(theme.colors)}`; // an edited custom theme keeps its id
  const key = `${fingerprint}\0${font}\0${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  mermaidP ??= import('mermaid').then((m) => m.default);
  const mermaid = await mermaidP;
  const themeKey = `${fingerprint}\0${font}`;
  if (themeKey !== lastTheme) {
    // Zinc palette matching the app tokens; compact sizes like the design.
    const k = theme.colors;
    const c = { bg: k.background, node: k.surface, border: k.border, text: k.foreground, muted: k.muted_foreground, line: k.muted_foreground, note: k.muted };
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: font,
      fontSize: 12,
      themeVariables: {
        fontSize: '12px',
        background: c.bg,
        primaryColor: c.node,
        primaryBorderColor: c.border,
        primaryTextColor: c.text,
        secondaryColor: c.note,
        tertiaryColor: c.note,
        lineColor: c.line,
        textColor: c.text,
        actorBkg: c.node,
        actorBorder: c.border,
        actorTextColor: c.text,
        actorLineColor: c.border,
        signalColor: c.line,
        signalTextColor: c.text,
        labelBoxBkgColor: c.note,
        labelBoxBorderColor: c.border,
        noteBkgColor: c.note,
        noteBorderColor: c.border,
        noteTextColor: c.text,
        edgeLabelBackground: c.bg,
        clusterBkg: c.note,
        clusterBorder: c.border,
      },
      sequence: { width: 110, height: 34, actorMargin: 40, boxMargin: 6, messageMargin: 28, mirrorActors: false, actorFontSize: 13, messageFontSize: 12, noteFontSize: 12 },
      flowchart: { padding: 10, nodeSpacing: 30, rankSpacing: 36 },
    });
    lastTheme = themeKey;
  }
  await mermaid.parse(code);
  const { svg } = await mermaid.render(`hs-mmd-${++seq}`, code);
  cache.set(key, svg);
  return svg;
}

export function Mermaid({ code }: { code: string }) {
  const [ref, seen] = useInView<HTMLElement>();
  const theme = useThemeColors();
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);
  useEffect(() => {
    if (!seen) return;
    let alive = true;
    renderMermaid(code, theme)
      .then((s) => alive && setSvg(s))
      .catch((e) => alive && setFailed(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [code, seen, theme]);
  if (failed) {
    return (
      <div>
        <p className="mb-1 text-xs text-st-error">Mermaid syntax error — showing source</p>
        <CodeBlock code={code} lang="mermaid" />
      </div>
    );
  }
  const kind = code.trim().split(/\s/)[0] ?? '';
  return (
    <figure ref={ref} className="my-2 overflow-hidden rounded-xl border border-border" data-testid="mermaid">
      <div className="flex min-h-[80px] justify-center overflow-x-auto px-4 pb-4 pt-4">
        {svg ? <div className="w-full [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} /> : <span className="self-center text-xs text-muted-foreground">Rendering diagram…</span>}
      </div>
      <figcaption className="flex items-center justify-between gap-2 border-t border-border bg-surface py-1 pl-3 pr-1.5 text-xs text-muted-foreground">
        <span className="font-mono">mermaid · {kind}</span>
        <button type="button" className="h-7 rounded-md px-2 text-xs font-medium text-foreground hover:bg-accent" onClick={() => setShowSource((v) => !v)}>
          {showSource ? 'Diagram' : 'Source'}
        </button>
      </figcaption>
      {showSource ? <pre className="m-0 max-h-72 overflow-auto border-t border-border bg-code px-3 py-2 font-mono text-content-code">{code}</pre> : null}
    </figure>
  );
}
