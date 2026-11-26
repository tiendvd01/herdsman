import type { HighlighterCore } from 'shiki';

let hl: Promise<HighlighterCore> | null = null;
function highlighter() {
  hl ??= Promise.all([import('shiki'), import('shiki/onig.wasm?url&inline')]).then(
    ([{ createHighlighter, createOnigurumaEngine }, { default: wasm }]) => createHighlighter({
      // Shiki's default loader uses Response.bytes(), unavailable on older WebKit.
      engine: createOnigurumaEngine(() => fetch(wasm).then((response) => response.arrayBuffer())),
      themes: ['github-light', 'github-dark'],
      langs: [],
    }),
  );
  return hl;
}
export async function loadCodeLanguage(lang: string) {
  const h = await highlighter();
  const { bundledLanguages } = await import('shiki');
  const id = Object.prototype.hasOwnProperty.call(bundledLanguages, lang) ? lang : 'text';
  if (id !== 'text' && !h.getLoadedLanguages().includes(id)) await h.loadLanguage(bundledLanguages[id as keyof typeof bundledLanguages]);
  return { h, id };
}
