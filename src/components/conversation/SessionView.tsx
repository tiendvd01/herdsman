// Keep streaming after the tab is first shown, until its panel is removed.
import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import type { Session, Workspace } from '@/lib/types';
import { useSessionStore } from '@/stores/useSessionStore';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/queries';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useLiveStatus } from '@/components/layout/WorkspaceView';
import { ENGINE_LABEL } from '@/components/ui/engine-icon';
import { COLUMN, MessageList } from './MessageList';
import { EmptySession } from './EmptySession';
import { Composer } from '@/components/composer/Composer';
import { PermissionCard } from '@/components/permission/PermissionCard';

export function SessionView({ session, ws }: { session: Session; ws: Workspace }) {
  const qc = useQueryClient();
  const view = useSessionStore((s) => s.sessions[session.id]);
  const status = useLiveStatus(session);
  const [opening, setOpening] = useState(true);
  const [resuming, setResuming] = useState(false);
  const [nonce, setNonce] = useState(0);
  const agentName = ENGINE_LABEL[session.engine] ?? 'Agent';
  const historyOnly = ws.deleted_at != null;

  useEffect(() => {
    let active = true;
    setOpening(true);
    useSessionStore.getState().reset(session.id);
    api.sessionOpen(session.id)
      .catch((e) => {
        if (active) toast(errMsg(e), 'error');
      })
      .finally(() => {
        if (active) setOpening(false);
      });
    return () => {
      active = false;
      api.sessionCloseView(session.id).catch(() => {});
      useSessionStore.getState().release(session.id); // free memory; reopening replays from the event log
    };
  }, [session.id, historyOnly, nonce]);

  const needsResume = !opening && (status === 'error' || (status === 'done' && view?.closed));

  async function resume() {
    setResuming(true);
    try {
      await api.sessionResume(session.id);
      qc.invalidateQueries({ queryKey: qk.sessions(ws.id) });
      setNonce((n) => n + 1);
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setResuming(false);
    }
  }

  const isEmpty = view?.loaded && view.items.length === 0 && !view.streaming;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!view?.loaded && !view?.error ? (
        <div className="flex flex-1 items-center justify-center text-[12px] text-muted-foreground">{historyOnly ? 'Loading conversation…' : 'Connecting to agent…'}</div>
      ) : isEmpty ? (
        <EmptySession />
      ) : (
        <MessageList sessionId={session.id} working={!historyOnly && status === 'working'} agentName={agentName} />
      )}
      {!historyOnly && (view?.error || needsResume) ? (
        <div className={`${COLUMN} pb-2`}>
          <div role="status" className="flex items-start gap-3 rounded-lg border border-border bg-background py-3 pl-4 pr-2">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[13px] font-medium">{view?.error ? 'Could not connect to the agent' : status === 'error' ? 'The agent stopped unexpectedly' : 'The agent has finished'}</span>
              <span className="text-[12px] text-muted-foreground">{view?.error ? `${view.error}. ` : ''}Resume to continue the conversation.</span>
            </div>
            <Button size="sm" variant="outline" onClick={resume} disabled={resuming}>
              <RotateCcw /> {resuming ? 'Resuming…' : 'Resume'}
            </Button>
          </div>
        </div>
      ) : null}
      {view?.pending.map((p) => <PermissionCard key={p.id} sessionId={session.id} req={p} agentName={agentName} />)}
      {!historyOnly && <Composer
        session={session}
        status={status}
        mode={view?.mode ?? session.permission_mode}
        disabled={opening || !!view?.error}
        onNeedResume={needsResume ? resume : undefined}
        agentName={agentName}
        firstPrompt={!!isEmpty}
      />}
    </div>
  );
}
