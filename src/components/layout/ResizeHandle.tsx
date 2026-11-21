// Spec 004: a vertical splitter on the edge of a sidebar — drag, keyboard (WAI-ARIA window splitter), double-click to reset.
// Spec 013: `orientation="horizontal"` is a row splitter on the top edge of the expanded composer (drag up = taller).
import { useEffect, useRef, useState } from 'react';
import { KEY_STEP } from '@/lib/layout';
import { currentZoomFactor } from '@/lib/uiZoom';
import { cn } from '@/lib/utils';

export interface ResizeHandleProps {
  /** 'left': the handle sits on the right edge of the left sidebar; 'right': on the left edge of the right panel. */
  side: 'left' | 'right';
  label: string;
  /** 'vertical' (default): a column splitter dragged sideways; 'horizontal': a row splitter dragged up/down, `side` is ignored. */
  orientation?: 'vertical' | 'horizontal';
  value: number;
  min: number;
  max: number;
  onChange: (px: number) => void;
  onReset: () => void;
  className?: string;
}

const BODY_CLASS = 'resizing';

export function ResizeHandle({ side, label, orientation = 'vertical', value, min, max, onChange, onReset, className }: ResizeHandleProps) {
  const [dragging, setDragging] = useState(false);
  const horizontal = orientation === 'horizontal';
  const drag = useRef<{ x: number; w: number; id: number } | null>(null);
  const frame = useRef<number | null>(null);
  const pending = useRef<number | null>(null);
  const clamp = (px: number) => Math.min(max, Math.max(min, Math.round(px)));

  const flush = () => {
    frame.current = null;
    if (pending.current !== null) onChange(pending.current);
    pending.current = null;
  };

  const end = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      flush();
    }
    document.body.classList.remove(BODY_CLASS);
  };

  // Never leave the page stuck in "resizing" if the handle unmounts mid-drag (e.g. the sidebar is collapsed).
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      document.body.classList.remove(BODY_CLASS);
    },
    [],
  );

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      data-dragging={dragging ? '' : undefined}
      className={cn(
        'group/resize absolute z-20 flex touch-none justify-center outline-none',
        horizontal
          ? 'inset-x-0 -top-1 h-2 cursor-row-resize items-center'
          : cn('inset-y-0 w-2 cursor-col-resize', side === 'left' ? '-right-1' : '-left-1'),
        className,
      )}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        drag.current = { x: horizontal ? e.clientY : e.clientX, w: value, id: e.pointerId };
        setDragging(true);
        document.body.classList.add(BODY_CLASS);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        // CSS zoom (browser preview) reports the pointer in zoomed px; widths are in CSS px.
        const dx = ((horizontal ? e.clientY : e.clientX) - d.x) / currentZoomFactor();
        pending.current = clamp(horizontal || side === 'right' ? d.w - dx : d.w + dx);
        if (frame.current === null) {
          const id = requestAnimationFrame(flush);
          // If the callback already ran (synchronous scheduler), there is nothing left to wait for.
          if (pending.current !== null) frame.current = id;
        }
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        const dir = side === 'left' ? 1 : -1;
        let next: number | null = null;
        if (horizontal) {
          if (e.key === 'ArrowUp') next = value + KEY_STEP;
          else if (e.key === 'ArrowDown') next = value - KEY_STEP;
        } else if (e.key === 'ArrowRight') next = value + KEY_STEP * dir;
        else if (e.key === 'ArrowLeft') next = value - KEY_STEP * dir;
        if (e.key === 'Home') next = min;
        else if (e.key === 'End') next = max;
        else if (e.key === 'Enter') {
          e.preventDefault();
          onReset();
          return;
        }
        if (next === null) return;
        e.preventDefault();
        onChange(clamp(next));
      }}
    >
      <span
        aria-hidden="true"
        className={cn(
          horizontal ? 'h-px w-full' : 'h-full w-px',
          'bg-transparent transition-colors group-focus-visible/resize:bg-ring',
          // Spec 013: the composer's row splitter shows no line on hover/drag (cursor alone signals it); sidebars keep theirs.
          !horizontal && 'group-hover/resize:bg-ring group-data-[dragging]/resize:bg-ring',
        )}
      />
    </div>
  );
}
