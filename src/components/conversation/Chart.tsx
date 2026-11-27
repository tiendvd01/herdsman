// ```chart blocks (Vega-Lite) → chart; rendered lazily, shows the source on error.
import { useEffect, useRef, useState } from 'react';
import { CodeBlock } from './CodeBlock';
import { useInView } from './useInView';
import { currentFontSans, useThemeColors } from '@/lib/theme';

export function Chart({ code }: { code: string }) {
  const [wrapRef, seen] = useInView<HTMLDivElement>();
  const target = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const theme = useThemeColors();
  useEffect(() => {
    if (!seen || !target.current) return;
    let finalize: (() => void) | undefined;
    let alive = true;
    (async () => {
      try {
        const spec = JSON.parse(code);
        const { default: embed } = await import('vega-embed');
        if (!alive || !target.current) return;
        const k = theme.colors;
        const dark = theme.appearance === 'dark';
        const font = currentFontSans();
        const res = await embed(target.current, { width: 'container', ...spec, $schema: spec.$schema ?? 'https://vega.github.io/schema/vega-lite/v6.json' }, {
          actions: false,
          renderer: 'svg',
          theme: dark ? 'dark' : undefined,
          config: { background: 'transparent', font, mark: { color: k.primary }, range: { category: [k.primary, k.working, k.blocked, k.done, k.idle, k.error] }, axisX: { labelAngle: 0, domain: false, ticks: false, labelPadding: 8 },
            axisY: { domain: false, ticks: false, gridDash: [3, 3], labelPadding: 6 },
            view: { stroke: null },
            scale: { bandPaddingInner: 0.45, bandPaddingOuter: 0.25 },
            bar: { cornerRadiusTopLeft: 4, cornerRadiusTopRight: 4 },
            axis: { labelFont: font, titleFont: font, titleFontWeight: 500, labelColor: k.muted_foreground, titleColor: k.muted_foreground, domainColor: k.border, gridColor: k.muted, tickColor: k.border } },
        });
        finalize = () => res.finalize();
      } catch (e) {
        if (alive) setFailed(String((e as Error)?.message ?? e));
      }
    })();
    return () => {
      alive = false;
      finalize?.();
    };
  }, [code, seen, theme]);
  if (failed) {
    return (
      <div>
        <p className="mb-1 text-xs text-st-error">Chart error ({failed.slice(0, 80)}) — showing source</p>
        <CodeBlock code={code} lang="json" />
      </div>
    );
  }
  return (
    <div ref={wrapRef} className="my-2 rounded-xl border border-border bg-surface p-4 shadow-panel" data-testid="chart">
      <div ref={target} className="w-full" />
    </div>
  );
}
