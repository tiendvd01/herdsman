// T051 (một phần, jsdom): khối mermaid/chart được chuyển sang component vẽ; khi đang stream thì hiện code thô;
// khối lỗi hiện lại mã nguồn. Việc vẽ SVG thật kiểm trong app (quickstart #2, #3).
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToolCard } from '@/components/conversation/ToolCard';
import { Markdown } from '@/components/conversation/Markdown';

describe('Markdown', () => {
  it('bảng GFM và không chạy HTML thô', () => {
    const { container } = render(<Markdown text={'| a | b |\n|---|---|\n| 1 | 2 |\n\n<img src=x onerror="alert(1)">'} />);
    expect(container.querySelector('table')).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('```mermaid và ```chart đi vào component vẽ', () => {
    render(<Markdown text={'```mermaid\ngraph TD; A-->B\n```\n\n```chart\n{"mark":"bar","data":{"values":[{"a":1}]}}\n```'} />);
    expect(screen.getByTestId('mermaid')).toBeTruthy();
    expect(screen.getByTestId('chart')).toBeTruthy();
  });

  it('đang stream thì chưa vẽ, hiện code', () => {
    const { container } = render(<Markdown streaming text={'```mermaid\ngraph TD; A-->B\n```'} />);
    expect(screen.queryByTestId('mermaid')).toBeNull();
    expect(container.textContent).toContain('graph TD');
  });

  it('chart JSON lỗi → hiện mã nguồn', async () => {
    render(<Markdown text={'```chart\n{không phải json\n```'} />);
    await waitFor(() => expect(screen.getByText(/Chart error/)).toBeTruthy());
  });

  it('shows malformed math as source and renders neighboring content', () => {
    const { container } = render(<Markdown text={'$$\\frac{$$\n\n# Next heading'} />);
    expect(container.querySelector('.katex-error')?.textContent).toBe('\\frac{');
    expect(screen.getByRole('heading', { name: 'Next heading' })).toBeTruthy();
  });

  it('công thức KaTeX', () => {
    const { container } = render(<Markdown text={'$$E = mc^2$$'} />);
    expect(container.querySelector('.katex')).not.toBeNull();
  });
});

describe('Rich Conversation code', () => {
  it('highlights a completed one-line block and keeps streaming and fallback source visible', async () => {
    const text = '```C++\n  int value = 1;\n```';
    const { container, rerender } = render(<Markdown text={text} streaming />);
    expect(container.querySelector('pre.text-content-code')?.textContent).toBe('  int value = 1;');
    rerender(<Markdown text={text} />);
    await waitFor(() => expect(container.querySelector('pre.shiki code .line span')?.getAttribute('style')).toContain('color'));
    expect(container.querySelector('pre.shiki code')?.textContent).toBe('  int value = 1;');
    rerender(<Markdown text={'Inline `value`\n\n```\n  untagged\n```\n\n```unknown-language\n  unknown\n```'} />);
    expect(container.querySelector('p > code')?.textContent).toBe('value');
    expect([...container.querySelectorAll('pre.text-content-code')].map((pre) => pre.textContent))
      .toEqual(['  untagged', '  unknown']);
    expect(container.querySelector('.shiki')).toBeNull();
  });

  it('highlights supported files in a multi-file tool diff and preserves other lines', async () => {
    render(<TooltipProvider><ToolCard item={{
      kind: 'tool', key: 'edit', tool_use_id: 'edit', tool: 'Edit', steps: 0, ts: 0,
      input: {
        file_path: 'sample.ts, sample.unknown-language',
        unified_diff: '--- sample.ts\n@@ -1,2 +1,2 @@\n const kept = true;\n-  const old = 1;\n+  const next = 2;\n--- sample.unknown-language\n@@ -0,0 +1 @@\n+  plain text',
      },
    }} /></TooltipProvider>);
    const pre = screen.getByTestId('diff').querySelector('pre.text-content-code');
    expect(pre).not.toBeNull();
    await waitFor(() => {
      const coloredRows = [...pre!.children].filter((row) => row.querySelector('[style*="--patch-light"][style*="--patch-dark"]'));
      expect(coloredRows.map((row) => row.textContent)).toEqual([
        ' const kept = true;', '−  const old = 1;', '+  const next = 2;',
      ]);
    });
    expect(pre?.lastElementChild?.textContent).toBe('+  plain text');
  });
});
