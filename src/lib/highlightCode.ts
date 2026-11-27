import { HighlightStyle, LanguageDescription } from '@codemirror/language';
import { highlightCode, tags } from '@lezer/highlight';
import type { LanguageSupport } from '@codemirror/language';

export const codeHighlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.operatorKeyword, tags.typeName, tags.className, tags.function(tags.variableName)], class: 'syntax-keyword' },
  { tag: [tags.atom, tags.bool, tags.number], class: 'syntax-number' },
  { tag: [tags.string, tags.regexp], class: 'syntax-string' },
  { tag: tags.comment, class: 'syntax-comment' },
  { tag: tags.heading, class: 'syntax-heading' },
  { tag: tags.link, class: 'syntax-link' },
]);

export async function languageForFile(path: string) {
  const extension = path.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx': {
      const { javascript } = await import('@codemirror/lang-javascript');
      return javascript({ typescript: extension.startsWith('ts'), jsx: extension.endsWith('x') });
    }
    case 'json': return (await import('@codemirror/lang-json')).json();
    case 'md':
    case 'markdown': return (await import('@codemirror/lang-markdown')).markdown();
    case 'rs': return (await import('@codemirror/lang-rust')).rust();
    default: {
      const { languages } = await import('@codemirror/language-data');
      const filename = path.split(/[\\/]/).pop() ?? path;
      const language = LanguageDescription.matchFilename(languages, filename);
      return language?.load();
    }
  }
}

export async function languageForCode(name: string) {
  const { languages } = await import('@codemirror/language-data');
  return LanguageDescription.matchLanguageName(languages, name, false)?.load();
}

export type CodeToken = { text: string; classes: string };

export function highlightLines(code: string, support: LanguageSupport): CodeToken[][] {
  const lines: CodeToken[][] = [[]];
  highlightCode(
    code,
    support.language.parser.parse(code),
    codeHighlightStyle,
    (text, classes) => lines[lines.length - 1].push({ text, classes }),
    () => lines.push([]),
  );
  return lines;
}
