// Spec 007: ⌘B toggles the left sidebar, ⌘R the right side panel (Ctrl off macOS).
import { IS_MAC } from '@/lib/platform';
import { useUiStore } from '@/stores/useUiStore';

export type SidebarSide = 'left' | 'right';

export const SHORTCUT_LABEL: Record<SidebarSide, string> = IS_MAC ? { left: '⌘B', right: '⌘R' } : { left: 'Ctrl+B', right: 'Ctrl+R' };
/** For aria-keyshortcuts. */
export const SHORTCUT_ARIA: Record<SidebarSide, string> = IS_MAC ? { left: 'Meta+B', right: 'Meta+R' } : { left: 'Control+B', right: 'Control+R' };

type KeyInfo = Pick<KeyboardEvent, 'key' | 'code' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'repeat'>;

export function matchSidebarShortcut(e: KeyInfo, ctx: { isMac: boolean; dialogOpen: boolean }): SidebarSide | null {
  if (e.repeat || e.shiftKey || e.altKey || ctx.dialogOpen) return null;
  const mod = ctx.isMac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
  if (!mod) return null;
  // Prefer the physical key so non-Latin layouts still work.
  const k = e.code ? e.code : `Key${(e.key ?? '').toUpperCase()}`;
  if (k === 'KeyB') return 'left';
  if (k === 'KeyR') return 'right';
  return null;
}

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

export function installSidebarShortcuts(): () => void {
  const onKey = (e: KeyboardEvent) => {
    const side = matchSidebarShortcut(e, { isMac: IS_MAC, dialogOpen: isDialogOpen() });
    if (!side) return;
    // Capture phase: stop the focused input from inserting text and ⌘R from reloading the page.
    e.preventDefault();
    e.stopPropagation();
    toggleSidebar(side);
  };
  window.addEventListener('keydown', onKey, true);
  return () => window.removeEventListener('keydown', onKey, true);
}
