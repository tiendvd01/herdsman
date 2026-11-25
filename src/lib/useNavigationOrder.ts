import { useCallback, useLayoutEffect, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { toast } from '@/components/ui/toast';

type Placement = { id: string; side: 'before' | 'after' };
type Drag = {
  id: string;
  pointerId: number;
  x: number;
  y: number;
  moved: boolean;
  scroll: HTMLElement | null;
};

function readOrder(key: string): string[] | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (Array.isArray(value) && value.every((id) => typeof id === 'string')) {
      return [...new Set(value)];
    }
  } catch {
    // A missing or unreadable preference falls back to the existing order.
  }
  return null;
}

function mergeOrder(saved: string[], visible: string[]) {
  const known = new Set(saved);
  return [...saved, ...visible.filter((id) => !known.has(id))];
}

export function useNavigationOrder(scope: string, ids: string[], axis: 'horizontal' | 'vertical', ready = true) {
  const storageKey = `herdsman.navigation-order:${scope}`;
  const [saved, setSaved] = useState(() => readOrder(storageKey));
  const previousIds = useRef(ids);
  const wasReady = useRef(false);
  const frame = useRef(0);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const focus = useRef<HTMLElement | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const visible = new Set(ids);
  const order = saved ? mergeOrder(saved, ids).filter((id) => visible.has(id)) : ids;
  const horizontal = axis === 'horizontal';
  const backward = horizontal ? 'ArrowLeft' : 'ArrowUp';
  const forward = horizontal ? 'ArrowRight' : 'ArrowDown';

  function save(next: string[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSaved(next);
      return true;
    } catch {
      toast('Could not save the new order. Try again.', 'error');
      return false;
    }
  }

  useLayoutEffect(() => {
    const previous = previousIds.current;
    previousIds.current = ids;
    const justLoaded = ready && !wasReady.current;
    wasReady.current = ready;
    if (!saved || (!justLoaded && previous.length === ids.length && previous.every((id) => visible.has(id)))) return;

    // Only retire items already seen in this view. Restored data may arrive in batches.
    const removed = new Set(previous.filter((id) => !visible.has(id)));
    const next = mergeOrder(saved.filter((id) => justLoaded ? visible.has(id) : !removed.has(id)), ids);
    if (next.length !== saved.length || next.some((id, index) => id !== saved[index])) save(next);
  });

  useLayoutEffect(() => {
    focus.current?.focus();
    focus.current = null;
  }, [saved]);

  function move(id: string, target: Placement, trigger?: HTMLElement) {
    if (id === target.id || !visible.has(id) || !visible.has(target.id)) return;
    const next = order.filter((itemId) => itemId !== id);
    const index = next.indexOf(target.id) + (target.side === 'after' ? 1 : 0);
    next.splice(index, 0, id);
    if (next.every((itemId, position) => itemId === order[position])) return;

    // Keep restored entries that are still loading in their existing slots.
    let nextIndex = 0;
    const persisted = mergeOrder(saved ?? [], ids)
      .map((itemId) => visible.has(itemId) ? next[nextIndex++] : itemId);
    focus.current = trigger ?? null;
    if (!save(persisted)) focus.current = null;
  }

  function targetAt(x: number, y: number, source: string): Placement | null {
    const row = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-reorder-scope]');
    if (row?.dataset.reorderScope !== scope) return null;
    const id = row.dataset.reorderId;
    if (!id || id === source || !visible.has(id)) return null;
    const rect = row.getBoundingClientRect();
    const before = horizontal ? x < rect.left + rect.width / 2 : y < rect.top + rect.height / 2;
    return { id, side: before ? 'before' : 'after' };
  }

  const cancel = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    if (drag.current?.moved) document.body.classList.remove('reordering-navigation');
    drag.current = null;
    setPlacement(null);
  }, []);

  useLayoutEffect(() => {
    function escape(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape' || !drag.current?.moved) return;
      event.preventDefault();
      event.stopPropagation();
      cancel();
    }
    window.addEventListener('keydown', escape, true);
    return () => {
      window.removeEventListener('keydown', escape, true);
      if (drag.current?.moved) document.body.classList.remove('reordering-navigation');
      cancelAnimationFrame(frame.current);
    };
  }, [cancel]);

  useLayoutEffect(() => {
    const active = drag.current;
    if (active && (!visible.has(active.id) || (placement && !visible.has(placement.id)))) cancel();
  });

  function updatePlacement(active: Drag, x: number, y: number) {
    const target = targetAt(x, y, active.id);
    setPlacement((current) => current?.id === target?.id && current?.side === target?.side ? current : target);
  }

  function scrollAtEdge(active: Drag, x: number, y: number) {
    cancelAnimationFrame(frame.current);
    const scroll = active.scroll;
    if (!scroll) return;
    const rect = scroll.getBoundingClientRect();
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) return;
    const start = horizontal ? x - rect.left : y - rect.top;
    const end = horizontal ? rect.right - x : rect.bottom - y;
    const edge = Math.min(28, (horizontal ? rect.width : rect.height) / 3);
    const step = start < edge ? -8 : end < edge ? 8 : 0;
    if (!step) return;
    frame.current = requestAnimationFrame(function tick() {
      if (drag.current !== active) return;
      const before = horizontal ? scroll.scrollLeft : scroll.scrollTop;
      if (horizontal) scroll.scrollLeft += step;
      else scroll.scrollTop += step;
      if (before === (horizontal ? scroll.scrollLeft : scroll.scrollTop)) return;
      updatePlacement(active, x, y);
      frame.current = requestAnimationFrame(tick);
    });
  }

  return {
    order,
    row: (id: string) => ({
      'data-reorder-scope': scope,
      'data-reorder-id': id,
      'data-reorder-edge': placement?.id === id && drag.current && visible.has(drag.current.id)
        ? placement.side : undefined,
    }),
    indicator: horizontal
      ? 'relative before:hidden data-[reorder-edge]:before:block before:pointer-events-none before:absolute before:inset-y-0 before:w-0.5 before:bg-primary data-[reorder-edge=before]:before:left-0 data-[reorder-edge=after]:before:right-0'
      : 'relative before:hidden data-[reorder-edge]:before:block before:pointer-events-none before:absolute before:inset-x-0 before:h-0.5 before:bg-primary data-[reorder-edge=before]:before:top-0 data-[reorder-edge=after]:before:bottom-0',
    item: (id: string) => ({
      'aria-keyshortcuts': `Alt+${backward} Alt+${forward}`,
      onKeyDown(event: KeyboardEvent<HTMLElement>) {
        if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
          && (event.key === backward || event.key === forward)) {
          event.preventDefault();
          event.stopPropagation();
          const target = order[order.indexOf(id) + (event.key === backward ? -1 : 1)];
          if (target) move(id, { id: target, side: event.key === backward ? 'before' : 'after' }, event.currentTarget);
        }
      },
      onPointerDown(event: PointerEvent<HTMLElement>) {
        if (event.button !== 0 || !event.isPrimary) return;
        suppressClick.current = false;
        if (order.length < 2) return;
        drag.current = {
          id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false,
          scroll: event.currentTarget.closest<HTMLElement>('[data-reorder-scroll]'),
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove(event: PointerEvent<HTMLElement>) {
        const active = drag.current;
        if (active?.pointerId !== event.pointerId) return;
        if (!active.moved) {
          if (Math.hypot(event.clientX - active.x, event.clientY - active.y) < 5) return;
          active.moved = true;
          document.body.classList.add('reordering-navigation');
        }
        suppressClick.current = true;
        updatePlacement(active, event.clientX, event.clientY);
        scrollAtEdge(active, event.clientX, event.clientY);
      },
      onPointerUp(event: PointerEvent<HTMLElement>) {
        const active = drag.current;
        if (active?.pointerId !== event.pointerId) return;
        const target = active.moved ? targetAt(event.clientX, event.clientY, active.id) : null;
        cancel();
        if (target) move(active.id, target);
      },
      onPointerCancel: cancel,
      onLostPointerCapture: cancel,
      onClickCapture(event: MouseEvent<HTMLElement>) {
        if (!suppressClick.current || event.detail === 0) return;
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      },
      onDragStart(event: DragEvent<HTMLElement>) {
        event.preventDefault();
      },
    }),
  };
}
