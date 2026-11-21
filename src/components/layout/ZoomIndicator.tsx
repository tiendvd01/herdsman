// Spec 006: a short-lived pill showing the zoom level or text size right after it changes.
import { useEffect, useState } from 'react';
import { contentAtLimit, contentPx, formatZoom, zoomAtLimit } from '@/lib/uiZoom';
import { useUiStore } from '@/stores/useUiStore';

const SHOW_MS = 1500;

export function ZoomIndicator() {
  const flash = useUiStore((s) => s.zoomFlash);
  const zoom = useUiStore((s) => s.zoom);
  const step = useUiStore((s) => s.contentStep);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!flash) return;
    setVisible(true);
    const h = setTimeout(() => setVisible(false), SHOW_MS);
    return () => clearTimeout(h);
  }, [flash]);

  if (!flash) return null;
  const limit = flash.kind === 'zoom' ? zoomAtLimit(zoom) : contentAtLimit(step);
  const text = flash.kind === 'zoom' ? `Zoom ${formatZoom(zoom)}` : `Text ${contentPx(step)}px`;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed top-3 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium tabular-nums shadow-md transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {text}
      {limit ? <span className="ml-1 text-muted-foreground">({limit})</span> : null}
    </div>
  );
}
