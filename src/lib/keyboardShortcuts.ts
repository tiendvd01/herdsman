import { useSyncExternalStore } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { IS_MAC } from './platform';

const mod = IS_MAC ? 'Meta' : 'Control';
const key = (code: string) => `${mod}+${code}`;
export const tabPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const shortcuts = [
  { id: 'palette', label: 'Command Palette', defaultKey: key('KeyK') },
  { id: 'settings', label: 'Open Settings', defaultKey: key('Comma') },
  { id: 'add-project', label: 'Add Project', defaultKey: key('KeyO') },
  { id: 'new-workspace', label: 'New Workspace', defaultKey: key('KeyN') },
  { id: 'new-session', label: 'New Session', defaultKey: key('KeyT') },
  { id: 'theme', label: 'Toggle Theme', defaultKey: key('Shift+KeyL') },
  { id: 'sidebar', label: 'Toggle Sidebar', defaultKey: key('KeyB') },
  { id: 'side-panel', label: 'Toggle Side Panel', defaultKey: key('KeyR') },
  { id: 'in', label: 'Zoom In', defaultKey: key('Equal') },
  { id: 'out', label: 'Zoom Out', defaultKey: key('Minus') },
  { id: 'reset', label: 'Reset Zoom', defaultKey: key('Digit0') },
  { id: 'text-in', label: 'Increase Text Size', defaultKey: `Alt+${key('Equal')}` },
  { id: 'text-out', label: 'Decrease Text Size', defaultKey: `Alt+${key('Minus')}` },
  { id: 'text-reset', label: 'Reset Text Size', defaultKey: `Alt+${key('Digit0')}` },
  ...tabPositions.map((position) => ({ id: `tab-${position}` as const, label: `Switch to Tab ${position}`, defaultKey: key(`Digit${position}`) })),
  { id: 'close-tab', label: 'Close Tab', defaultKey: key('KeyW') },
] as const;

export type ShortcutId = (typeof shortcuts)[number]['id'];
type Bindings = Partial<Record<ShortcutId, string>>;
const storageKey = 'herdsman.keyboardShortcuts';
const crossPlatformCommands = new Set<ShortcutId>(['palette', 'settings', 'add-project', 'new-workspace', 'new-session', 'theme']);
const modifiers = ['Alt', 'Control', 'Meta', 'Shift'];
const punctuation: Record<string, string> = {
  Backquote: '`', Backslash: '\\', BracketLeft: '[', BracketRight: ']', Comma: ',', Equal: '=',
  Minus: '-', Period: '.', Quote: "'", Semicolon: ';', Slash: '/',
};
const supportedKey = /^(?:Key[A-Z]|Digit[0-9]|F(?:[1-9]|1[0-9]|2[0-4])|Arrow(?:Up|Down|Left|Right)|Backspace|Delete|End|Home|PageUp|PageDown|Space|Enter)$/;

export function shortcutLabel(binding: string, aria = false) {
  const names: Record<string, string> = aria ? {} : IS_MAC
    ? { Meta: '⌘', Control: '⌃', Shift: '⇧', Alt: '⌥' }
    : { Control: 'Ctrl' };
  return binding.split('+').map((part) => names[part] ?? (aria ? undefined : punctuation[part])
    ?? part.replace(aria ? /^(Key|Digit)/ : /^(Key|Digit|Arrow)/, '')).join(IS_MAC && !aria ? '' : '+');
}

export function effectiveShortcut(id: ShortcutId, bindings: Bindings = current) {
  return bindings[id] ?? shortcuts.find((entry) => entry.id === id)!.defaultKey;
}

function validBinding(binding: string) {
  const parts = binding.split('+');
  const code = parts.pop()!;
  return (supportedKey.test(code) || Object.prototype.hasOwnProperty.call(punctuation, code))
    && parts.some((part) => part !== 'Shift')
    && parts.join('+') === modifiers.filter((part) => parts.includes(part)).join('+');
}

function reserved(binding: string) {
  return [key('KeyA'), key('KeyC'), key('KeyV'), key('KeyX'), key('KeyZ'), key('Shift+KeyZ'), key('KeyY')].includes(binding)
    || (IS_MAC && [key('KeyQ'), key('KeyM'), key('KeyH'), `Alt+${key('KeyH')}`, key('Space'), 'Control+Meta+KeyF', 'Control+Meta+Space'].includes(binding))
    || binding === 'Alt+F4' || binding === 'Alt+Control+Delete';
}

function shortcutAliases(id: ShortcutId, binding: string, defaultKey: string) {
  if (binding !== defaultKey) return [];
  if (crossPlatformCommands.has(id)) return [binding.replace(mod, IS_MAC ? 'Control' : 'Meta')];
  if (id === 'in' || id === 'text-in') return [binding.replace('+Equal', '+Shift+Equal')];
  return [];
}

function validate(bindings: Bindings) {
  const seen = new Map<string, string>();
  for (const { id, label, defaultKey } of shortcuts) {
    const binding = effectiveShortcut(id, bindings);
    if (!validBinding(binding)) throw new Error('Press a supported key with Command, Ctrl, or Alt.');
    if (reserved(binding)) throw new Error('This shortcut is reserved.');
    for (const combination of [binding, ...shortcutAliases(id, binding, defaultKey)]) {
      const conflict = seen.get(combination);
      if (conflict) throw new Error(`Shortcut conflict: ${conflict} and ${label} both use ${shortcutLabel(combination)}.`);
      seen.set(combination, label);
    }
  }
}

function readBindings(): Bindings {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    if (!stored || typeof stored !== 'object') return {};
    const bindings: Bindings = {};
    for (const { id } of shortcuts) {
      const binding = (stored as Record<string, unknown>)[id];
      if (typeof binding === 'string') bindings[id] = binding;
    }
    validate(bindings);
    return bindings;
  } catch {
    return {};
  }
}

let current = readBindings();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useShortcutBindings() {
  return useSyncExternalStore(subscribe, () => current);
}

let menuUpdate: Promise<unknown> = Promise.resolve();

export function syncShortcutMenu(bindings?: Bindings, recording = false) {
  if (!isTauri()) return Promise.resolve();
  const update = menuUpdate.then(() => invoke('set_shortcut_accelerators', {
    closeTabLabel: shortcutLabel(effectiveShortcut('close-tab', bindings)),
    accelerators: (['in', 'out', 'reset'] as const)
      .map((id) => recording ? null : effectiveShortcut(id, bindings).replace('Meta+', 'Command+').replace(/Key([A-Z])$/, '$1')),
  }));
  menuUpdate = update.catch(() => {});
  return update;
}

let pendingSave: Promise<void> = Promise.resolve();

export function saveShortcut(id?: ShortcutId, binding?: string) {
  const save = pendingSave.then(() => commitShortcut(id, binding));
  pendingSave = save.catch(() => {});
  return save;
}

async function commitShortcut(id?: ShortcutId, binding?: string) {
  const next = id ? { ...current } : {};
  if (id && binding && binding !== effectiveShortcut(id, {})) next[id] = binding;
  else if (id) delete next[id];
  validate(next);
  try {
    await syncShortcutMenu(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  } catch (error) {
    await syncShortcutMenu(current).catch(() => {});
    throw error;
  }
  current = next;
  for (const listener of listeners) listener();
}

export function eventBinding(event: KeyboardEvent) {
  const code = event.code || (event.key?.match(/^[a-z]$/i) ? `Key${event.key.toUpperCase()}`
    : event.key?.match(/^\d$/) ? `Digit${event.key}`
    : Object.keys(punctuation).find((entry) => punctuation[entry] === event.key)
      ?? ({ '+': 'Equal', ' ': 'Space' } as Record<string, string>)[event.key] ?? event.key);
  const binding = [
    event.altKey && 'Alt', event.ctrlKey && 'Control', event.metaKey && 'Meta', event.shiftKey && 'Shift', code,
  ].filter(Boolean).join('+');
  return validBinding(binding) ? binding : undefined;
}

export function matchShortcut(event: KeyboardEvent) {
  const binding = eventBinding(event);
  if (!binding && !event.code?.startsWith('Numpad')) return;
  const exact = shortcuts.find(({ id, defaultKey }) => {
    const effective = effectiveShortcut(id);
    return effective === binding || (binding && shortcutAliases(id, effective, defaultKey).includes(binding));
  })?.id;
  if (exact) return exact;
  // Keep the existing zoom aliases while the corresponding default is active.
  const zoomCode = event.code === 'NumpadAdd' || event.key === '+' ? 'Equal'
    : event.code === 'NumpadSubtract' ? 'Minus' : event.code === 'Numpad0' ? 'Digit0' : undefined;
  if ((IS_MAC ? !event.metaKey || event.ctrlKey : !event.ctrlKey || event.metaKey) || !zoomCode
      || (event.shiftKey && zoomCode !== 'Equal')) return;
  const alias = `${event.altKey ? 'Alt+' : ''}${key(zoomCode)}`;
  return shortcuts.find(({ id, defaultKey }) => defaultKey === alias && effectiveShortcut(id) === defaultKey)?.id;
}

export function runTabShortcut(id: ShortcutId) {
  const row = document.querySelector('[data-workspace-tabs]');
  if (id === 'close-tab') {
    row?.querySelector('[role="tab"][aria-selected="true"]')?.parentElement
      ?.querySelector<HTMLButtonElement>('[data-close-tab]')?.click();
  } else if (id.startsWith('tab-')) {
    const tab = row?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[Number(id.slice(4)) - 1];
    tab?.focus();
    tab?.click();
    tab?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }
}
