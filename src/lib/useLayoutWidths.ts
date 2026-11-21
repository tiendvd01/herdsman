// Spec 004: display widths of the two sidebars for the current window size (kept apart from layout.ts so the store can import it).
import { useEffect, useState } from 'react';
import { layoutWidths, type LayoutWidths } from '@/lib/layout';
import { useUiStore } from '@/stores/useUiStore';
import { currentZoomFactor } from '@/lib/uiZoom';

export function useViewportWidth(): number {
  // Native zoom (Tauri) already shrinks innerWidth; CSS zoom (browser preview) does not, so divide by it.
  const cssWidth = () => window.innerWidth / currentZoomFactor();
  const zoom = useUiStore((s) => s.zoom);
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 1440 : cssWidth()));
  useEffect(() => {
    const on = () => setW(cssWidth());
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [zoom]);
  return w;
}

export function useLayoutWidths(): LayoutWidths {
  const viewport = useViewportWidth();
  const left = useUiStore((s) => s.sidebarWidth);
  const right = useUiStore((s) => s.rightWidth);
  const leftOpen = useUiStore((s) => s.sidebarOpen);
  const rightOpen = useUiStore((s) => s.rightOpen);
  return layoutWidths({ left, right, leftOpen, rightOpen, viewport });
}

/** Spec 013: window height in CSS px (same zoom handling as the width). */
export function useViewportHeight(): number {
  const cssHeight = () => window.innerHeight / currentZoomFactor();
  const zoom = useUiStore((s) => s.zoom);
  const [h, setH] = useState(() => (typeof window === 'undefined' ? 900 : cssHeight()));
  useEffect(() => {
    const on = () => setH(cssHeight());
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [zoom]);
  return h;
}
