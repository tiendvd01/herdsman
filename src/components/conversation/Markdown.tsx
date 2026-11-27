// Safe markdown (FR-012, FR-015): GFM, KaTeX, code highlighting, Mermaid, ```chart. Never injects raw agent HTML.
import { memo, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { CodeBlock } from './CodeBlock';
import { Mermaid } from './Mermaid';
import { Chart } from './Chart';
import { FileLink, fileReference, type OpenFile, markdownFilePath, rehypeFileLinks } from './fileLinks';

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-./, 'math-inline', 'math-display']],
  },
};

function makeComponents(streaming: boolean, sessionId?: string, openFile?: OpenFile): Components {
  return {
    a: ({ href, children }) => {
      const path = openFile && markdownFilePath(href);
      return path && sessionId && openFile ? (
        <FileLink sessionId={sessionId} {...fileReference(path)} open={openFile}>{children}</FileLink>
      ) : (
        <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>
      );
    },
    pre: ({ node, children }) => {
      const code = node?.children[0];
      if (code?.type !== 'element' || code.tagName !== 'code') return <pre>{children}</pre>;
      const classes = code.properties.className;
      const lang = Array.isArray(classes)
        ? classes.find((name) => typeof name === 'string' && name.startsWith('language-'))
        : undefined;
      const language = typeof lang === 'string' ? lang.slice('language-'.length).toLowerCase() : undefined;
      const text = code.children.map((part) => part.type === 'text' ? part.value : '').join('').replace(/\n$/, '');
      if (!streaming && language === 'mermaid') return <Mermaid code={text} />;
      if (!streaming && (language === 'chart' || language === 'vega-lite' || language === 'vega')) return <Chart code={text} />;
      return <CodeBlock code={text} lang={language} plain={streaming} />;
    },
    table: ({ children }) => (
      <div className="hs-table">
        <table>{children}</table>
      </div>
    ),
  };
}

export const Markdown = memo(function Markdown({ text, streaming = false, sessionId, openFile }: {
  text: string;
  streaming?: boolean;
  sessionId?: string;
  openFile?: OpenFile;
}) {
  const components = useMemo(() => makeComponents(streaming, sessionId, openFile), [streaming, sessionId, openFile]);
  return (
    <div className="prose-hs text-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeSanitize, schema], ...(sessionId && openFile ? [rehypeFileLinks] : []), rehypeKatex]}
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});
