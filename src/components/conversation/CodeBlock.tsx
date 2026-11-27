import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { highlightLines, languageForCode, type CodeToken } from '@/lib/highlightCode';

const cache = new Map<string, CodeToken[][]>();

async function render(code: string, lang: string) {
  const key = `${lang}\0${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const support = await languageForCode(lang);
  if (!support) return;
  const lines = highlightLines(code, support);
  cache.set(key, lines);
  return lines;
}

export function CodeBlock({ code, lang, plain }: { code: string; lang?: string; plain?: boolean }) {
  const [highlight, setHighlight] = useState<{ code: string; lang: string; lines: CodeToken[][] }>();
  const lines = lang && !plain
    ? cache.get(`${lang}\0${code}`) ?? (highlight?.code === code && highlight.lang === lang ? highlight.lines : undefined)
    : undefined;
  const [copyState, setCopyState] = useState<'idle' | 'pending' | 'copied'>('idle');
  useEffect(() => {
    if (copyState !== 'copied') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 1200);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  async function copyCode() {
    if (copyState === 'pending') return;
    setCopyState('pending');
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
    } catch {
      setCopyState('idle');
      toast('Could not copy code. Try again.', 'error');
    }
  }
  useEffect(() => {
    if (plain || !lang) return;
    let alive = true;
    render(code, lang)
      .then((lines) => alive && lines && setHighlight({ code, lang, lines }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [code, lang, plain]);
  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border border-border bg-code">
      <div className="flex h-8 items-center justify-between border-b border-border bg-muted px-3 text-xs text-muted-foreground">
        <span className="font-mono">{lang ?? 'text'}</span>
        <Button variant="ghost" size="xs"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100"
          onClick={() => void copyCode()} aria-disabled={copyState === 'pending'} aria-label="Copy code">
          {copyState === 'pending' ? <Spinner label="Copying" /> : copyState === 'copied' ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          <span aria-live="polite">{copyState === 'pending' ? 'Copying…' : copyState === 'copied' ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
      <pre className="m-0 overflow-x-auto p-3 font-mono text-content-code leading-[1.7] text-foreground">
        {lines ? (
          <code>{lines.map((row, index) => (
            <span key={index}>{index > 0 ? '\n' : ''}{row.map((token, position) => (
              <span key={position} className={token.classes || undefined}>{token.text}</span>
            ))}</span>
          ))}</code>
        ) : code}
      </pre>
    </div>
  );
}
