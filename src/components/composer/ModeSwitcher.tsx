// Four per-session approval modes; "Bypass all approvals" needs its own confirmation (FR-022a/b).
import { useState } from 'react';
import { Check, ChevronDown, ShieldAlert } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import type { PermissionMode, Session } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/toast';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queries';

export const MODES: Record<PermissionMode, { label: string; desc: string }> = {
  ask: { label: 'Ask before editing', desc: 'Every tool that needs permission waits for your approval' },
  accept_edits: { label: 'Auto-accept edits', desc: 'File edits in the working directory go through; shell commands still ask' },
  auto: { label: 'Auto mode', desc: 'A safety classifier approves routine actions and only asks for risky ones' },
  bypass: { label: 'Bypass all approvals', desc: "The agent runs every tool without asking — only use this when you're sure" },
};

export function ModeSwitcher({ session, mode }: { session: Session; mode: PermissionMode }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const cur = MODES[mode];

  async function setMode(m: PermissionMode, confirmBypass = false) {
    try {
      await api.sessionSetPermissionMode(session.id, m, confirmBypass);
      qc.invalidateQueries({ queryKey: qk.sessions(session.workspace_id) });
    } catch (e) {
      toast(errMsg(e), 'error');
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={mode === 'bypass' ? 'warn' : 'ghost'} size="sm" className="gap-1.5 font-normal" aria-label={`Permission mode: ${cur.label}`}>
            {mode === 'bypass' ? <ShieldAlert className="size-3.5" /> : null}
            {cur.label}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" className="w-80">
          {(Object.keys(MODES) as PermissionMode[]).map((m) => {
            const { label, desc } = MODES[m];
            return (
              <DropdownMenuItem key={m} onSelect={() => (m === 'bypass' ? setConfirm(true) : setMode(m))} className="items-start">
                <Check className={m === mode ? 'mt-0.5' : 'mt-0.5 invisible'} />
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        destructive
        title="Turn on “Bypass all approvals”?"
        description="The agent will edit files and run shell commands without asking you. The session tab shows a warning badge until you switch modes."
        confirmLabel="Turn on"
        onConfirm={async () => {
          await setMode('bypass', true);
          setConfirm(false);
        }}
      />
    </>
  );
}
