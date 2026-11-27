// Fullscreen-ish viewer for a rendered Mermaid svg: zoom (buttons, Ctrl/Cmd+wheel, keys) and drag-to-pan (spec 018).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as D from '@radix-ui/react-dialog';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { MAX_SCALE, MIN_SCALE, ZOOM_FACTOR, centerOffset, fitScale, zoomAt, type View } from './mermaidZoom';

function svgSize(host: HTMLElement): { w: number; h: number } {
  const svg = host.querySelector('svg');
  if (!svg) return { w: 0, h: 0 };
  const vb = svg.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) return { w: vb.width, h: vb.height };
  const w = parseFloat(svg.getAttribute('width') ?? '') || svg.getBoundingClientRect().width;
  const h = parseFloat(svg.getAttribute('height') ?? '') || svg.getBoundingClientRect().height;
  return { w, h };
}

const btn = 'flex size-8 items-center justify-center rounded-md text-foreground hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent';

function Stage({ svg, onClose }: { svg: string; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const dims = useRef({ boxW: 0, boxH: 0, w: 0, h: 0, fit: 1 });
  const [view, setView] = useState<View>({ scale: 1, tx: 0, ty: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const measure = useCallback(() => {
    const b = box.current;
    const h = host.current;
    if (!b || !h) return;
    const r = b.getBoundingClientRect();
    const s = svgSize(h);
    const fit = fitScale(r.width, r.height, s.w, s.h);
    dims.current = { boxW: r.width, boxH: r.height, w: s.w, h: s.h, fit };
    return dims.current;
  }, []);

  const reset = useCallback(() => {
    const d = measure();
    if (!d) return;
    setView({ scale: 1, ...centerOffset(d.boxW, d.boxH, d.w, d.h, d.fit) });
  }, [measure]);

  // Size the svg at natural size, then fit once on open / when the svg changes.
  useLayoutEffect(() => {
    const svgEl = host.current?.querySelector('svg');
    if (svgEl) {
      const s = svgSize(host.current!);
      svgEl.removeAttribute('style');
      svgEl.setAttribute('width', String(s.w));
      svgEl.setAttribute('height', String(s.h));
    }
    reset();
  }, [svg, reset]);

  useEffect(() => {
    const b = box.current;
    if (!b || typeof ResizeObserver === 'undefined') return;
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      const prev = dims.current;
      const d = measure();
      if (!d || prev.boxW === 0) return;
      // Keep the visual center stable when the window resizes.
      const k = d.fit / (prev.fit || 1);
      const v = viewRef.current;
      const cx = prev.boxW / 2, cy = prev.boxH / 2;
      setView({ scale: v.scale, tx: d.boxW / 2 - (cx - v.tx) * k, ty: d.boxH / 2 - (cy - v.ty) * k });
    });
    ro.observe(b);
    return () => ro.disconnect();
  }, [measure]);

  const zoom = useCallback((factor: number, cx?: number, cy?: number) => {
    const d = dims.current;
    setView((v) => zoomAt(v, factor, cx ?? d.boxW / 2, cy ?? d.boxH / 2));
  }, []);

  useEffect(() => {
    const b = box.current;
    if (!b) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const r = b.getBoundingClientRect();
        zoom(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
      } else {
        setView((v) => ({ ...v, tx: v.tx - e.deltaX, ty: v.ty - e.deltaY }));
      }
    };
    b.addEventListener('wheel', onWheel, { passive: false });
    return () => b.removeEventListener('wheel', onWheel);
  }, [zoom]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 40;
    if (e.key === '+' || e.key === '=') zoom(ZOOM_FACTOR);
    else if (e.key === '-') zoom(1 / ZOOM_FACTOR);
    else if (e.key === '0') reset();
    else if (e.key === 'ArrowLeft') setView((v) => ({ ...v, tx: v.tx + step }));
    else if (e.key === 'ArrowRight') setView((v) => ({ ...v, tx: v.tx - step }));
    else if (e.key === 'ArrowUp') setView((v) => ({ ...v, ty: v.ty + step }));
    else if (e.key === 'ArrowDown') setView((v) => ({ ...v, ty: v.ty - step }));
    else return;
    e.preventDefault();
  };

  const px = dims.current.fit * view.scale;
  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2" onKeyDown={onKeyDown}>
        <D.Title className="text-sm font-medium">Mermaid diagram</D.Title>
        <div className="flex items-center gap-1">
          <button type="button" className={btn} aria-label="Zoom out" disabled={view.scale <= MIN_SCALE} onClick={() => zoom(1 / ZOOM_FACTOR)}>
            <Minus className="size-4" />
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-muted-foreground" data-testid="mermaid-zoom-level">
            {Math.round(view.scale * 100)}%
          </span>
          <button type="button" className={btn} aria-label="Zoom in" disabled={view.scale >= MAX_SCALE} onClick={() => zoom(ZOOM_FACTOR)}>
            <Plus className="size-4" />
          </button>
          <button type="button" className={btn} aria-label="Reset zoom" onClick={reset}>
            <RotateCcw className="size-4" />
          </button>
          <button type="button" className={btn} aria-label="Close" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={box}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={`relative min-h-0 flex-1 touch-none select-none overflow-hidden bg-background focus-visible:outline-none focus-visible:after:pointer-events-none focus-visible:after:absolute focus-visible:after:inset-0 focus-visible:after:z-10 focus-visible:after:border-2 focus-visible:after:border-ring ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
          setDragging(true);
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          const p = drag.current;
          if (!p) return;
          const dx = e.clientX - p.x, dy = e.clientY - p.y;
          drag.current = { x: e.clientX, y: e.clientY };
          setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
        }}
        onPointerUp={() => {
          drag.current = null;
          setDragging(false);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
      >
        <div
          ref={host}
          className="absolute left-0 top-0 origin-top-left"
          style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${px})` }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </>
  );
}

export function MermaidViewer({ svg, open, onOpenChange }: { svg: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-scrim" />
        <D.Content
          data-testid="mermaid-viewer"
          aria-describedby={undefined}
          className="fixed inset-y-4 left-1/2 z-50 flex w-4/5 -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-overlay focus:outline-none"
        >
          <Stage svg={svg} onClose={() => onOpenChange(false)} />
        </D.Content>
      </D.Portal>
    </Dialog>
  );
}
