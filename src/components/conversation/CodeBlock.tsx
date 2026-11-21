// Code highlighting with Shiki (languages loaded lazily); Shiki builds the HTML from escaped text.
import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
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
        <button
          className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          aria-label="Copy code"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {html && !plain ? (
        <div className="overflow-x-auto p-3 font-mono text-content-code leading-[1.7] [&_pre]:m-0" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="m-0 overflow-x-auto p-3 font-mono text-content-code leading-[1.7]">{code}</pre>
      )}
    </div>
  );
}
