// Spacing scale shared by the whole app (spec 009). Every padding / margin / gap / space-*
// class in src/ must use one of these Tailwind steps (1 step = 4px at 100% zoom) or `0`.
// tests/unit/spacingScale.test.ts enforces it.
//
// Alignment rules:
//   R1  Trailing action buttons in the same column share one right edge and one size
//       (`icon-sm` in the sidebar): no extra pr-* / right-* on a single row.
//   R2  Each indent level is one step of the scale (exception: the workspace tree line).
//   R3  The sidebar, main and side-panel headers are all h-14 / min-h-14 so their borders line up.
//   R4  Buttons shown only on hover/focus use opacity or absolute positioning so they never
//       shift other buttons in the column.

export const SPACING_STEPS = [
  { step: '0.5', px: 2, role: 'tight gap between adjacent icon buttons or rows, tablist padding' },
  { step: '1', px: 4, role: 'small gap inside a control, inset within a cluster' },
  { step: '1.5', px: 6, role: 'icon ↔ text gap at small sizes' },
  { step: '2', px: 8, role: 'list-row padding, icon ↔ text gap, gap between controls' },
  { step: '3', px: 12, role: 'section / header / card padding, control padding, gap between groups' },
  { step: '4', px: 16, role: 'large block padding, gap between sections' },
  { step: '6', px: 24, role: 'dialog padding, content-area margins' },
  { step: '8', px: 32, role: 'empty-state whitespace' },
] as const;

/** Values outside the scale that are allowed on purpose. Each must still be used in its file. */
export const SPACING_EXCEPTIONS: readonly { file: string; token: string; reason: string }[] = [
  { file: 'src/lib/platform.ts', token: 'pl-[84px]', reason: 'room for the macOS traffic lights; size set by the OS' },
];

const ALLOWED = new Set<string>(['0', ...SPACING_STEPS.map((s) => s.step)]);

/** `value` is the part after the prefix, e.g. '2', '2.5', 'px', '[3px]'. */
export function isAllowedSpacing(value: string): boolean {
  return ALLOWED.has(value);
}
