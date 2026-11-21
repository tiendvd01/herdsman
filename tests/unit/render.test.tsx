// T051 (một phần, jsdom): khối mermaid/chart được chuyển sang component vẽ; khi đang stream thì hiện code thô;
// khối lỗi hiện lại mã nguồn. Việc vẽ SVG thật kiểm trong app (quickstart #2, #3).
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('công thức KaTeX', () => {
    const { container } = render(<Markdown text={'$$E = mc^2$$'} />);
    expect(container.querySelector('.katex')).not.toBeNull();
  });
});
