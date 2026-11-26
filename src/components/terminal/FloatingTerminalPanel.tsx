import { useRef, type PointerEvent } from 'react';
import { GripHorizontal, Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import WorkspaceTerminal from './WorkspaceTerminal';

export interface PanelPosition {
  left: number;
  top: number;
}

export function FloatingTerminalPanel({ terminal, terminals, position, onMove, onHide, onSelect, onCreate, onClose, closing,
  creating, error, loading }: {
  terminal?: string;
  terminals: string[];
  position?: PanelPosition;
  onMove: (position: PanelPosition) => void;
  onHide: () => void;
  onSelect: (address: string) => void;
  onCreate: () => void;
  onClose: (address: string) => void;
  closing: boolean;
  creating: boolean;
  error?: string;
  loading: boolean;
}) {
  const panel = useRef<HTMLElement>(null);
  const drag = useRef<{ id: number; x: number; y: number }>();

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !panel.current) return;
    const { left, top } = panel.current.getBoundingClientRect();
    drag.current = { id: event.pointerId, x: event.clientX - left, y: event.clientY - top };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  return (
    <section ref={panel} aria-label="Floating terminal" id="floating-terminal-panel"
      className="fixed z-40 flex h-[min(28rem,calc(100dvh-6rem))] w-[min(48rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-xl"
      style={position ? {
        left: `clamp(0px, ${position.left}px, max(0px, calc(100vw - min(48rem, 100vw - 2rem))))`,
        top: `clamp(0px, ${position.top}px, max(0px, calc(100dvh - min(28rem, 100dvh - 6rem) - 2rem)))`,
      } : { right: '1rem', bottom: '3rem' }}>
      <header className="flex min-w-0 shrink-0 items-center gap-1 border-b border-border bg-surface pr-1">
        <div className="flex h-9 shrink-0 cursor-grab touch-none select-none items-center px-3 active:cursor-grabbing"
          title="Drag terminal panel"
          onPointerDown={startDrag}
          onPointerMove={(event) => {
            if (drag.current?.id === event.pointerId) {
              onMove({ left: event.clientX - drag.current.x, top: event.clientY - drag.current.y });
            }
          }}
          onLostPointerCapture={() => { drag.current = undefined; }}>
          <GripHorizontal aria-hidden="true" className="size-4 text-muted-foreground" />
        </div>
        <div role="group" aria-label="Terminal tabs" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {terminals.map((address, index) => (
            <div key={address} className={cn('flex shrink-0 items-center rounded-md pr-1', address === terminal && 'bg-muted')}>
              <Button size="xs" variant={address === terminal ? 'secondary' : 'muted'}
                aria-pressed={address === terminal} onClick={() => onSelect(address)}>
                Terminal {index + 1}
              </Button>
              <Button size="xs" variant="muted" className="size-6 px-0" disabled={closing}
                aria-label={`Close Terminal ${index + 1}`} onClick={() => onClose(address)}>
                <X aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
        <Button size="icon-sm" variant="muted" aria-label="New terminal" title="New terminal"
          disabled={creating} onClick={onCreate}><Plus aria-hidden="true" /></Button>
        <Button size="icon-sm" variant="muted" aria-label="Minimize Terminal" title="Minimize Terminal" onClick={onHide}><Minus aria-hidden="true" /></Button>
      </header>
      {error && <p role="status" className="p-2 text-destructive">{error}</p>}
      {terminal ? <WorkspaceTerminal key={terminal} address={terminal} live /> : (
        <p className="p-3 text-muted-foreground">{loading ? 'Loading terminals…' : 'Select + to start a shell.'}</p>
      )}
    </section>
  );
}
