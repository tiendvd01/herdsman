import { useLayoutEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Terminal output may contain control codes and is always rendered as text.
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g;

export default function HcOutputWindow() {
  const pre = useRef<HTMLPreElement>(null);
  const follow = useRef(true);
  const { data, error } = useQuery({
    queryKey: ['hc-output'],
    queryFn: api.hcOutputRead,
    refetchInterval: 750,
    refetchIntervalInBackground: true,
    retry: false,
  });
  useLayoutEffect(() => {
    if (follow.current && pre.current) pre.current.scrollTop = pre.current.scrollHeight;
  }, [data?.text]);

  const terminal = data?.terminal;
  const status = terminal?.state === 'live' ? 'Running'
    : terminal?.exit_code === 0 ? 'Succeeded'
    : terminal?.exit_code != null ? `Failed (exit ${terminal.exit_code})`
    : terminal ? 'Ended' : 'Connecting…';
  const errorCode = (error as { code?: string } | null)?.code;
  const missing = errorCode === 'hc_output_unavailable' || errorCode === 'hc_not_found';

  return (
    <main className="flex h-dvh flex-col gap-2 bg-background p-3 text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium">{terminal?.name || terminal?.address || 'Terminal Output'}</span>
        <span role="status" className="text-muted-foreground">
          {error ? (missing || !data ? 'Terminal output unavailable' : 'Connection lost. Retrying…') : status}
        </span>
      </header>
      {data && !data.complete ? (
        <p className="text-xs text-muted-foreground">Only part of the terminal output is available.</p>
      ) : null}
      <pre
        ref={pre}
        tabIndex={0}
        aria-label="Terminal output"
        onScroll={(e) => {
          const el = e.currentTarget;
          follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
        }}
        className="m-0 min-h-0 flex-1 overflow-auto rounded-md border border-border bg-term-bg p-3 font-mono text-content-code leading-relaxed break-words whitespace-pre-wrap text-term-fg"
      >
        {data?.text.replace(ANSI, '') || (error ? 'The original output could not be read.' :
          terminal?.state === 'live' ? 'Waiting for output…' : terminal ? 'No terminal output.' : 'Connecting to terminal…')}
      </pre>
    </main>
  );
}
