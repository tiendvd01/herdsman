// Code highlighting with Shiki (languages loaded lazily); Shiki builds the HTML from escaped text.
import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import type { HighlighterCore } from 'shiki';

let hl: Promise<HighlighterCore> | null = null;
function highlighter() {
  hl ??= import('shiki').then((m) => m.createHighlighter({ themes: ['github-light', 'github-dark'], langs: [] }) as Promise<HighlighterCore>);
  return hl;
}
const cache = new Map<string, string>();

async function render(code: string, lang: string) {
  const key = `${lang}\0${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const h = await highlighter();
  const { bundledLanguages } = await import('shiki');
  const id = lang in bundledLanguages ? lang : 'text';
  if (id !== 'text' && !h.getLoadedLanguages().includes(id)) await h.loadLanguage(bundledLanguages[id as keyof typeof bundledLanguages]);
  const html = h.codeToHtml(code, { lang: id, themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: 'light' });
  cache.set(key, html);
  return html;
}

export function CodeBlock({ code, lang, plain }: { code: string; lang?: string; plain?: boolean }) {
  const [html, setHtml] = useState<string | null>(() => cache.get(`${lang ?? 'text'}\0${code}`) ?? null);
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
    if (plain) return;
    let alive = true;
    render(code, lang ?? 'text')
      .then((h) => alive && setHtml(h))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [code, lang, plain]);
  return (
    <div className="group relative my-2 overflow-hidden rounded-lg border border-border bg-code">
      <div className="flex h-8 items-center justify-between border-b border-border bg-surface px-3 text-xs text-muted-foreground">
        <span className="font-mono">{lang ?? 'text'}</span>
        <Button variant="ghost" size="xs"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100"
          onClick={() => void copyCode()} aria-disabled={copyState === 'pending'} aria-label="Copy code">
          {copyState === 'pending' ? <Spinner label="Copying" /> : copyState === 'copied' ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          <span aria-live="polite">{copyState === 'pending' ? 'Copying…' : copyState === 'copied' ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
      {html && !plain ? (
        <div className="overflow-x-auto p-3 text-content-code leading-[1.7] [&_pre]:m-0 [&_:is(pre,code)]:font-mono" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="m-0 overflow-x-auto p-3 font-mono text-content-code leading-[1.7]">{code}</pre>
      )}
    </div>
  );
}
