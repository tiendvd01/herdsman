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
import { FileLink, markdownFilePath, rehypeFileLinks } from './fileLinks';

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-./, 'math-inline', 'math-display']],
  },
};

function makeComponents(streaming: boolean, sessionId?: string, openFile?: (path: string) => void): Components {
  return {
    a: ({ href, children }) => {
      const path = openFile && markdownFilePath(href);
      return path && sessionId && openFile ? (
        <FileLink sessionId={sessionId} path={path} open={openFile}>{children}</FileLink>
      ) : (
        <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>
      );
    },
    pre: ({ children }) => <>{children}</>,
    table: ({ children }) => (
      <div className="hs-table">
        <table>{children}</table>
      </div>
    ),
    code: ({ className, children }) => {
      const lang = /language-([\w-]+)/.exec(className ?? '')?.[1];
      const text = String(children ?? '').replace(/\n$/, '');
      const isBlock = !!lang || text.includes('\n');
      if (!isBlock) return <code>{children}</code>;
      if (!streaming && lang === 'mermaid') return <Mermaid code={text} />;
      if (!streaming && (lang === 'chart' || lang === 'vega-lite' || lang === 'vega')) return <Chart code={text} />;
      return <CodeBlock code={text} lang={lang} plain={streaming} />;
    },
  };
}

export const Markdown = memo(function Markdown({ text, streaming = false, sessionId, openFile }: {
  text: string;
  streaming?: boolean;
  sessionId?: string;
  openFile?: (path: string) => void;
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
