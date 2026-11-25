import { useEffect, useRef, useState } from 'react';
import { Button, Kbd } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errMsg } from '@/lib/api';
import {
  effectiveShortcut, eventBinding, saveShortcut, shortcutLabel, shortcuts, syncShortcutMenu, useShortcutBindings,
  type ShortcutId,
} from '@/lib/keyboardShortcuts';

export function KeyboardShortcutsSection() {
  const bindings = useShortcutBindings();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<ShortcutId>();
  const [candidate, setCandidate] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const editor = useRef<HTMLInputElement>(null);
  const editButtonId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!editing) return;
    editor.current?.focus();
    void syncShortcutMenu(undefined, true).catch((cause) => setError(errMsg(cause)));
    return () => { void syncShortcutMenu().catch(() => {}); };
  }, [editing]);

  function stopEditing() {
    setEditing(undefined);
    requestAnimationFrame(() => document.getElementById(editButtonId.current ?? '')?.focus());
  }

  async function save(id?: ShortcutId, binding?: string) {
    setError('');
    setPending(true);
    try {
      await saveShortcut(id, binding);
      if (editing) stopEditing();
    } catch (cause) {
      if (editing && editor.current) void syncShortcutMenu(undefined, true).catch(() => {});
      setError(errMsg(cause));
    } finally {
      setPending(false);
    }
  }

  const search = query.trim().toLowerCase();
  const matches = shortcuts.filter(({ id, label, defaultKey }) => {
    const binding = effectiveShortcut(id, bindings);
    return [label, binding, shortcutLabel(binding), shortcutLabel(defaultKey)]
      .some((value) => value.toLowerCase().includes(search));
  });
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex items-center gap-2">
        <Input type="search" aria-label="Search shortcuts" placeholder="Search shortcuts" value={query}
          disabled={!!editing || pending} onChange={(event) => setQuery(event.target.value)} />
        <Button variant="outline" size="sm" disabled={!!editing || pending} onClick={() => void save()}>
          Reset all
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <ul>
        {matches.map(({ id, label, defaultKey }) => {
          const binding = effectiveShortcut(id, bindings);
          return (
            <li key={id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2">
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">Default {shortcutLabel(defaultKey)}</div>
              </div>
              {editing === id ? (
                <div data-record-shortcut="" className="flex items-center gap-2">
                  <Input ref={editor} aria-label={`Record shortcut for ${label}`} placeholder="Press shortcut"
                    value={candidate ? shortcutLabel(candidate) : ''} readOnly
                    onKeyDown={(event) => {
                      if (event.key === 'Tab') return;
                      event.preventDefault();
                      event.stopPropagation();
                      if (pending || event.repeat || event.nativeEvent.isComposing) return;
                      if (event.key === 'Escape') {
                        setError('');
                        stopEditing();
                        return;
                      }
                      const recorded = eventBinding(event.nativeEvent);
                      if (['Alt', 'Control', 'Meta', 'Shift'].includes(event.key)) return;
                      setCandidate(recorded ?? '');
                      setError(recorded ? '' : 'Press a supported key with Command, Ctrl, or Alt.');
                    }} />
                  <Button size="sm" disabled={!candidate || pending} onClick={() => void save(id, candidate)}>Save</Button>
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => { setError(''); stopEditing(); }}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Kbd>{shortcutLabel(binding)}</Kbd>
                  <Button variant="outline" size="sm" id={`edit-shortcut-${id}`} aria-label={`Change ${label} shortcut`}
                    disabled={!!editing || pending} onClick={(event) => {
                      editButtonId.current = event.currentTarget.id;
                      setEditing(id);
                      setCandidate('');
                      setError('');
                    }}>Change</Button>
                  <Button variant="ghost" size="sm" aria-label={`Reset ${label} shortcut`}
                    disabled={binding === defaultKey || !!editing || pending} onClick={() => void save(id)}>Reset</Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!matches.length && <p className="text-sm text-muted-foreground">No matching shortcuts.</p>}
    </div>
  );
}
