// Small toasts in the bottom-right corner (action errors, confirmations).
import { useEffect } from 'react';
import { create } from 'zustand';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'error';
}
const useToasts = create<{ items: Toast[]; push: (t: Omit<Toast, 'id'>) => void; drop: (id: number) => void }>((set) => ({
  items: [],
  push: (t) => set((s) => ({ items: [...s.items.slice(-3), { ...t, id: Date.now() + Math.random() }] })),
  drop: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export function toast(text: string, tone: 'info' | 'error' = 'info') {
  useToasts.getState().push({ text, tone });
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
        'flex max-w-[380px] items-start gap-2 rounded-lg border bg-background px-4 py-3 text-[12px] shadow-lg',
        t.tone === 'error' ? 'border-destructive/40 text-destructive' : 'border-border',
      )}
    >
      <span className="flex-1">{t.text}</span>
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
