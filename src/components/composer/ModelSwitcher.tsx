import { TruncatedText } from '@/components/ui/truncated-text';
// Per-session model picker next to the permission mode menu (specs/005-chat-model-switcher).
// The list comes from the session's engine; the label only changes once the agent has acked.
import { useEffect, useState } from 'react';
import { AlertCircle, Check, ChevronDown, Loader2, RotateCw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errCode, errMsg } from '@/lib/api';
import { findModel, modelLabel } from '@/lib/model';
import { qk } from '@/lib/queries';
import type { ModelOption, Session } from '@/lib/types';
import { useSessionStore } from '@/stores/useSessionStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/toast';

export const modelsKey = (sessionId: string) => ['models', sessionId] as const;

export function ModelSwitcher({ session, disabled }: { session: Session; disabled?: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [unsupported, setUnsupported] = useState<string | null>(null);
  const reportedModel = useSessionStore((s) => s.sessions[session.id]?.model);
  const model = reportedModel === undefined ? session.model : reportedModel;

  const list = useQuery({
    queryKey: modelsKey(session.id),
    queryFn: async () => {
      try {
        return await api.sessionListModels(session.id);
      } catch (e) {
        if (errCode(e) === 'unsupported') {
          setUnsupported(errMsg(e));
          setOpen(false);
        }
        throw e;
      }
    },
    // Fetched up front, not on open: with no model set, the label needs the engine default to name it.
    enabled: !unsupported,
    staleTime: Infinity,
    retry: (n, e) => errCode(e) !== 'unsupported' && n < 1,
  });

  const change = useMutation({
    mutationFn: (value: string) => api.sessionSetModel(session.id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.sessions(session.workspace_id) }),
    onError: (e) => toast(errMsg(e), 'error'),
  });

  const models = list.data?.models;
  // No model set means the engine default; show which model that actually is.
  const effective = model ?? list.data?.default_model ?? null;
  const label = modelLabel(effective, models);
  const current = findModel(effective, models);
  // The model in use is always listed, even when the engine's list doesn't name it.
  const options: ModelOption[] = models && effective && !current ? [{ value: effective, display_name: label, description: 'Current model' }, ...models] : (models ?? []);
  const isCurrent = (o: ModelOption) => o.value === (current?.value ?? effective);

  // Once the menu is open and positioned, focus the model in use: it scrolls into view and
  // arrow keys continue from there (Radix would otherwise start at the top of a long list).
  const hasList = !!models;
  useEffect(() => {
    if (!open || !hasList) return;
    const id = requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-model-menu="${session.id}"] [data-current]`)?.focus());
    return () => cancelAnimationFrame(id);
  }, [open, hasList, session.id]);

  function pick(o: ModelOption) {
    if (isCurrent(o) || change.isPending) return;
    change.mutate(o.value);
  }

  const button = (
    <Button
      variant="ghost"
      size="sm"
      className="max-w-[180px] gap-1.5 font-normal"
      aria-label={`Model: ${label}`}
      disabled={disabled || !!unsupported || change.isPending}
    >
      {change.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
      <TruncatedText className="truncate">{label}</TruncatedText>
      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
    </Button>
  );

  if (unsupported) {
    return (
      <Tooltip content={unsupported} side="top">
        {/* span: a disabled button gets no pointer events, so the tooltip needs a wrapper */}
        <span tabIndex={0}>{button}</span>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
      {/* Long lists scroll: cap at 360px or the space Radix says is available, whichever is smaller. */}
      <DropdownMenuContent data-model-menu={session.id} side="top" className="max-h-[min(360px,var(--radix-dropdown-menu-content-available-height))] w-72 overflow-y-auto">
        {list.isPending ? (
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-3.5 animate-spin" />
            Loading models…
          </div>
        ) : list.isError ? (
          <>
            <div className="flex items-start gap-2 px-2 py-1.5 text-sm text-muted-foreground" role="alert">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>Couldn't load models: {errMsg(list.error)}</span>
            </div>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                list.refetch();
              }}
            >
              <RotateCw />
              Retry
            </DropdownMenuItem>
          </>
        ) : (
          options.map((o) => (
            <DropdownMenuItem
              key={o.value}
              onSelect={() => pick(o)}
              className="items-start"
              data-current={isCurrent(o) ? '' : undefined}
            >
              {/* shrink-0: a two-line description must not squeeze the check column */}
              <Check className={isCurrent(o) ? 'mt-0.5 shrink-0' : 'mt-0.5 shrink-0 invisible'} />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium">{o.display_name}</span>
                {o.description ? <span className="text-xs text-muted-foreground">{o.description}</span> : null}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
