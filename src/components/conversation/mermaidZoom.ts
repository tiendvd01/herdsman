// Pure zoom/pan math for the Mermaid viewer (spec 018). Scale is relative to the "fit" size (1 = fit).
export const MIN_SCALE = 0.25;
export const MAX_SCALE = 8;
export const ZOOM_FACTOR = 1.25;

export interface View {
  scale: number;
  tx: number;
  ty: number;
}

export function clampScale(s: number): number {
  if (!Number.isFinite(s)) return 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

/** Pixel scale that makes the svg fit the box with padding. */
export function fitScale(boxW: number, boxH: number, svgW: number, svgH: number, pad = 24): number {
  if (boxW <= 0 || boxH <= 0 || svgW <= 0 || svgH <= 0) return 1;
  return Math.max(0.01, Math.min((boxW - pad * 2) / svgW, (boxH - pad * 2) / svgH));
}

/** Translation that centers the svg at pixel scale `px` (fit * scale). */
export function centerOffset(boxW: number, boxH: number, svgW: number, svgH: number, px: number) {
  return { tx: (boxW - svgW * px) / 2, ty: (boxH - svgH * px) / 2 };
}

/** Zoom by `factor` keeping the point (cx, cy) in box coordinates fixed. */
export function zoomAt(v: View, factor: number, cx: number, cy: number): View {
  const scale = clampScale(v.scale * factor);
  const k = scale / v.scale;
  return { scale, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k };
}
