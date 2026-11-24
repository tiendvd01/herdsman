import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

type OpenFile = (path: string) => void;

export function FileLink({ sessionId, path, open, children }: {
  sessionId: string;
  path: string;
  open: OpenFile;
  children: ReactNode;
}) {
  const { data: exists } = useQuery({
    queryKey: ['session-file-exists', sessionId, path],
    queryFn: () => api.sessionFileExists(sessionId, path),
    retry: false,
    staleTime: 5_000,
  });
  if (exists !== true) return <>{children}</>;
  return (
    <button type="button" role="link" className="cursor-pointer text-left text-primary underline underline-offset-2 focus-visible:outline-ring" onClick={() => open(path)}>
      {children}
    </button>
  );
}

export function markdownFilePath(href?: string) {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(href)) return;
  try {
    return decodeURIComponent(href);
  } catch {
    return;
  }
}

const pathToken = /^(?:\.{1,2}\/|\/)?(?:[\p{L}\p{N}_@.+~-]+\/)+[\p{L}\p{N}_@.+~-]+$|^\/[\p{L}\p{N}_@.+~-]+$/u;

export function fileParts(text: string) {
  return text.split(/([\s"'“”‘’`()[\]{}<>,;!?]+)/u).flatMap((token) => {
    const candidate = token.replace(/\.+$/, '');
    return pathToken.test(candidate)
      ? [{ text: candidate, path: candidate }, { text: token.slice(candidate.length) }]
      : [{ text: token }];
  });
}

type MarkdownNode =
  | { type: 'text'; value: string }
  | { type: 'element'; tagName: string; properties?: { href?: string; className?: string[] }; children: MarkdownNode[] };

function fileAnchor(path: string, children: MarkdownNode[]): MarkdownNode {
  const href = path.split('/').map(encodeURIComponent).join('/');
  return { type: 'element', tagName: 'a', properties: { href }, children };
}

function linkNode(node: MarkdownNode): MarkdownNode[] {
  if (node.type === 'text') {
    return fileParts(node.value).filter(({ text }) => text).map(({ text, path }) => {
      const label: MarkdownNode = { type: 'text', value: text };
      return path ? fileAnchor(path, [label]) : label;
    });
  }
  if (['a', 'pre', 'script', 'style', 'math'].includes(node.tagName)) return [node];
  if (node.tagName === 'code') {
    const child = node.children[0];
    if (node.properties?.className?.some((name) => name.includes('math'))) return [node];
    if (node.children.length === 1 && child?.type === 'text') {
      const path = child.value;
      if (!/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path) && /^(?:\.{1,2}\/|\/|[^/]+\/|[^/]+\.[^/]+$)/.test(path)) {
        return [fileAnchor(path, [node])];
      }
    }
    return [node];
  }
  node.children = node.children.flatMap(linkNode);
  return [node];
}

export function rehypeFileLinks() {
  return (tree: { children: MarkdownNode[] }) => {
    tree.children = tree.children.flatMap(linkNode);
  };
}
