import { useUiStore } from '@/stores/useUiStore';

export type SidebarSide = 'left' | 'right';

export function isDialogOpen(): boolean {
  if (useUiStore.getState().cmdOpen) return true;
  // Only overlay dialogs/popovers (Radix sets data-state="open"); the inline permission card is role="alertdialog" too but is not modal.
  return !!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
}

const asideOf = (side: SidebarSide) => document.querySelector<HTMLElement>(side === 'left' ? 'aside[aria-label="Sidebar"]' : 'aside[aria-label="Side panel"]');

/** Same result as the header buttons; if focus was inside the column being hidden, move it to the composer (or main). */
export function toggleSidebar(side: SidebarSide) {
  const ui = useUiStore.getState();
  const open = side === 'left' ? ui.sidebarOpen : ui.rightOpen;
  const active = document.activeElement;
  const focusInside = open && !!active && !!asideOf(side)?.contains(active);
  if (side === 'left') ui.setSidebarOpen(!open);
  else ui.setRightOpen(!open);
  if (!focusInside) return;
  requestAnimationFrame(() => {
    const target = document.querySelector<HTMLElement>('textarea[id^="composer-"]:not(:disabled)') ?? document.querySelector<HTMLElement>('main');
    target?.focus();
  });
}
