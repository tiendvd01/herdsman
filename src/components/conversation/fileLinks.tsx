import { usePathLabel } from '@/lib/homePath';
import { cloneElement, isValidElement, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FilePosition } from '@/stores/useFileStore';

export type OpenFile = (path: string, position?: FilePosition) => void;

export function fileReference(reference: string) {
  const match = /^(.+?):([1-9]\d*)(?::([1-9]\d*))?$/.exec(reference);
  return match ? { path: match[1], position: { line: Number(match[2]), column: match[3] ? Number(match[3]) : undefined } }
    : { path: reference };
}

export function FileLink({ sessionId, path, position, open, children }: {
  sessionId: string;
  path: string;
  position?: FilePosition;
  open: OpenFile;
  children: ReactNode;
}) {
  const pathLabel = usePathLabel();
  const { data: exists } = useQuery({
    queryKey: ['session-file-exists', sessionId, path],
    queryFn: () => api.sessionFileExists(sessionId, path),
    retry: false,
    staleTime: 5_000,
  });
  if (exists !== true) return <>{children}</>;
  const label = isValidElement<{ children?: ReactNode }>(children) && children.type === 'code' && children.props.children === path
    ? cloneElement(children, {}, pathLabel(path))
    : children === path ? pathLabel(path) : children;
  return (
    <button type="button" role="link" className="cursor-pointer text-left text-primary underline underline-offset-2 focus-visible:outline-ring" onClick={() => position ? open(path, position) : open(path)}>
      {label}
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
    const candidate = token.replace(/[.:]+$/, '');
    const { path, position } = fileReference(candidate);
    return (pathToken.test(path) || (position && /^[\w.-]+\.[\w-]+$/.test(path)))
      ? [{ text: candidate, path: candidate }, { text: token.slice(candidate.length) }]
      : [{ text: token }];
  });
}

export function ToolOutputLinks({ text, tool, sessionId, open }: {
  text: string;
  tool: string;
  sessionId: string;
  open: OpenFile;
}) {
  return text.split('\n').map((line, index) => {
    const match = tool === 'Grep' ? /^([^:]+:[1-9]\d*)(?=:|$)/.exec(line) : null;
    const reference = match?.[1] ?? (tool === 'Glob' && /^[^:*?{}[\]]*[^/:*?{}[\]\s]$/.test(line) ? line : undefined);
    const parts = reference
      ? [{ text: reference, path: reference }, { text: line.slice(reference.length) }]
      : fileParts(line);
    return (
      <span key={index}>{index ? '\n' : ''}{parts.map(({ text, path }, part) => path
        ? <FileLink key={part} sessionId={sessionId} {...fileReference(path)} open={open}>{text}</FileLink>
        : text)}</span>
    );
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
      if (!/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(fileReference(path).path) && /^(?:\.{1,2}\/|\/|[^/]+\/|[^/]+\.[^/]+$)/.test(path)) {
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
