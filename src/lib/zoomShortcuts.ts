import { useEffect } from 'react';
import { applyCodeFontSize, applyContentStep, applyZoom } from '@/lib/uiZoom';
import { useUiStore } from '@/stores/useUiStore';

export type ZoomAction = 'in' | 'out' | 'reset' | 'text-in' | 'text-out' | 'text-reset';

export function runZoomAction(a: ZoomAction) {
  const ui = useUiStore.getState();
  ({
    in: ui.zoomIn,
    out: ui.zoomOut,
    reset: ui.zoomReset,
    'text-in': ui.contentBigger,
    'text-out': ui.contentSmaller,
    'text-reset': ui.contentReset,
  })[a]();
}

/** Apply zoom / content text size whenever they change (the saved values are applied before first render in main.tsx). */
export function useZoomEffect() {
  const zoom = useUiStore((s) => s.zoom);
  const step = useUiStore((s) => s.contentStep);
  const codeFontSize = useUiStore((s) => s.codeFontSize);
  useEffect(() => void applyZoom(zoom), [zoom]);
  useEffect(() => applyContentStep(step), [step]);
  useEffect(() => applyCodeFontSize(codeFontSize), [codeFontSize]);
}
