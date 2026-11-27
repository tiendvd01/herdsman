// Small toasts in the bottom-right corner (action errors, confirmations).
import { useEffect, type ReactNode } from 'react';
import { create } from 'zustand';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'error';
  action?: { label: string; run: () => void };
  badge?: ReactNode;
}
const useToasts = create<{ items: Toast[]; push: (t: Omit<Toast, 'id'>) => void; drop: (id: number) => void }>((set) => ({
  items: [],
  push: (t) => set((s) => ({ items: [...s.items.slice(-3), { ...t, id: Date.now() + Math.random() }] })),
  drop: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export function toast(text: string, tone: 'info' | 'error' = 'info', action?: Toast['action'], badge?: ReactNode) {
  useToasts.getState().push({ text, tone, action, badge });
}

function ToastItem({ t }: { t: Toast }) {
  const drop = useToasts((s) => s.drop);
  useEffect(() => {
    const h = setTimeout(() => drop(t.id), t.tone === 'error' ? 7000 : 3500);
    return () => clearTimeout(h);
  }, [t, drop]);
  return (
    <div
      role={t.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex max-w-[380px] items-start gap-2 rounded-lg border bg-surface px-4 py-3 text-xs shadow-overlay',
        t.tone === 'error' ? 'border-destructive/40 text-destructive' : 'border-border',
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        {t.badge}
        <span className="wrap-anywhere">{t.text}</span>
      </span>
      {t.action && <button type="button" className="shrink-0 font-medium underline" onClick={() => {
        t.action?.run();
        drop(t.id);
      }}>{t.action.label}</button>}
      <button onClick={() => drop(t.id)} aria-label="Dismiss" className="text-muted-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2 [&>*]:pointer-events-auto">
      {items.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </div>
  );
}
