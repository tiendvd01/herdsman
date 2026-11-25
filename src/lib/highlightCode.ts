import type { HighlighterCore } from 'shiki';

let hl: Promise<HighlighterCore> | null = null;
function highlighter() {
  hl ??= import('shiki').then((m) => m.createHighlighter({ themes: ['github-light', 'github-dark'], langs: [] }) as Promise<HighlighterCore>);
  return hl;
}
export async function loadCodeLanguage(lang: string) {
  const h = await highlighter();
  const { bundledLanguages } = await import('shiki');
  const id = Object.prototype.hasOwnProperty.call(bundledLanguages, lang) ? lang : 'text';
  if (id !== 'text' && !h.getLoadedLanguages().includes(id)) await h.loadLanguage(bundledLanguages[id as keyof typeof bundledLanguages]);
  return { h, id };
}
