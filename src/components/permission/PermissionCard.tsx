import { TruncatedText } from '@/components/ui/truncated-text';
// Allow/Deny card (FR-021): diff for Edit/Write, the full command for Bash. Never expires on its own (FR-023).
import { useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import type { PermissionReq } from '@/stores/useSessionStore';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { Diff } from '@/components/conversation/Diff';
import { toolDiff } from '@/components/conversation/lineDiff';
import { COLUMN } from '@/components/conversation/MessageList';

function askTitle(agent: string, tool: string) {
  if (tool === 'Edit' || tool === 'MultiEdit') return `${agent} wants to edit a file`;
  if (tool === 'Write') return `${agent} wants to write a file`;
  if (tool === 'Bash') return `${agent} wants to run a command`;
  if (tool === 'WebFetch' || tool === 'WebSearch') return `${agent} wants to access the web`;
  return `${agent} wants to use ${tool}`;
}

export function PermissionCard({ sessionId, req, agentName = 'Agent' }: { sessionId: string; req: PermissionReq; agentName?: string }) {
  const [busy, setBusy] = useState<'allow' | 'deny' | null>(null);
  const diff = useMemo(() => toolDiff(req.tool, req.input), [req.tool, req.input]);
  const command = typeof req.input.command === 'string' ? req.input.command : null;
  const where = diff?.file || req.cwd;

  async function decide(decision: 'allow' | 'deny') {
    setBusy(decision);
    try {
      await api.sessionPermission(sessionId, req.id, decision);
    } catch (e) {
      toast(errMsg(e), 'error');
      setBusy(null);
    }
  }

  return (
    <div className={`${COLUMN} pb-3`} role="alertdialog" aria-label={askTitle(agentName, req.tool)}>
      <div className="flex flex-col gap-3 rounded-xl border border-warn-border bg-warn-bg p-4 shadow-xs dark:shadow-none">
        <div className="flex flex-wrap items-center gap-2">
          <ShieldAlert className="size-4 shrink-0 text-warn-icon" />
          <span className="flex-1 text-[13px] font-medium">{askTitle(agentName, req.tool)}</span>
          <TruncatedText className="max-w-full truncate font-mono text-xs text-muted-foreground">{where}</TruncatedText>
        </div>
        {diff ? (
          <div className="overflow-hidden rounded-md border border-border bg-background">
            <Diff file={diff.file} lines={diff.lines} maxHeight={280} bare />
          </div>
        ) : command ? (
          <div className="flex flex-col gap-1">
            <pre className="m-0 overflow-x-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-content-code leading-[1.7] whitespace-pre-wrap">$ {command}</pre>
            {typeof req.input.description === 'string' ? <p className="text-xs text-muted-foreground">{req.input.description}</p> : null}
          </div>
        ) : (
          <pre className="m-0 max-h-48 overflow-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-content-code whitespace-pre-wrap">
            {JSON.stringify(req.input, null, 2)}
          </pre>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => decide('allow')} disabled={!!busy}>
            {busy === 'allow' ? 'Allowing…' : 'Allow'}
          </Button>
          <Button variant="ghost" onClick={() => decide('deny')} disabled={!!busy}>
            {busy === 'deny' ? 'Denying…' : 'Deny'}
          </Button>
        </div>
      </div>
    </div>
  );
}
