// Spec 004: resizable sidebars — width limits and the layout math that keeps the main column usable.

export interface WidthLimits {
  min: number;
  max: number;
  def: number;
}

export const LEFT = { min: 184, max: 440, def: 232 } as const satisfies WidthLimits;
export const RIGHT = { min: 256, max: 660, def: 308, wide: 504 } as const satisfies WidthLimits & { wide: number };
/** Spec 013: height of the expanded composer editor (px). */
export const COMPOSER = { min: 120, max: 1200, def: 300 } as const satisfies WidthLimits;
/** The expanded editor never takes more than this share of the window height. */
export const COMPOSER_VIEWPORT_SHARE = 0.8;
/** The conversation column never gets narrower than this. */
export const MAIN_MIN = 400;
/** Arrow-key step on a resize handle. */
export const KEY_STEP = 16;

/** Round and clamp a width into [min, max]; anything that is not a finite number becomes the default. */
export function clampWidth(px: unknown, { min, max, def }: WidthLimits): number {
  if (typeof px !== 'number' || !Number.isFinite(px)) return def;
  return Math.min(max, Math.max(min, Math.round(px)));
}

export interface LayoutInput {
  left: number;
  right: number;
  leftOpen: boolean;
  rightOpen: boolean;
  viewport: number;
}

export interface LayoutWidths {
  left: number;
  right: number;
  /** Largest width the left sidebar can take right now and still leave MAIN_MIN for the main column. */
  leftMax: number;
  rightMax: number;
}

/**
 * Display widths for the two sidebars. The saved widths are what the user asked for; when the window
 * is too narrow, the right panel shrinks first, then the left sidebar, never below their minimums.
 * Closed sidebars count as 0px; a width of 0 for an open sidebar means it is hidden for lack of room.
 */
export function layoutWidths({ left, right, leftOpen, rightOpen, viewport }: LayoutInput): LayoutWidths {
  let l = leftOpen ? clampWidth(left, LEFT) : 0;
  let r = rightOpen ? clampWidth(right, RIGHT) : 0;
  const room = Math.max(0, viewport - MAIN_MIN);
  let over = l + r - room;
  if (over > 0 && rightOpen) {
    const cut = Math.min(over, r - RIGHT.min);
    r -= cut;
    over -= cut;
  }
  if (over > 0 && leftOpen) {
    const cut = Math.min(over, l - LEFT.min);
    l -= cut;
    over -= cut;
  }
  // Spec 006: at high zoom even both minimums may not fit. Hide the right panel for now (then the left
  // sidebar) instead of squeezing the conversation; the saved open state is untouched, so it comes back
  // as soon as there is room again.
  if (over > 0 && r > 0) {
    r = 0;
    // The left sidebar gets back the room the panel left, up to its saved width.
    if (leftOpen) l = Math.min(clampWidth(left, LEFT), Math.max(LEFT.min, room));
    over = l - room;
  }
  if (over > 0 && l > 0) {
    l = 0;
  }
  return {
    left: l,
    right: r,
    leftMax: Math.max(LEFT.min, Math.min(LEFT.max, room - r)),
    rightMax: Math.max(RIGHT.min, Math.min(RIGHT.max, room - l)),
  };
}

/** Spec 013: saved editor height, clamped to its limits and to what the window currently allows (the saved value is untouched). */
export function effectiveComposerHeight(saved: unknown, viewportHeight: number): number {
  const cap = Math.max(COMPOSER.min, Math.floor(COMPOSER_VIEWPORT_SHARE * viewportHeight));
  return Math.min(cap, clampWidth(saved, COMPOSER));
}
