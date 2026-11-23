import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const SVG = '<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="100"/></svg>';
let fail = false;
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    parse: vi.fn(async () => {
      if (fail) throw new Error('bad');
    }),
    render: vi.fn(async () => ({ svg: SVG })),
  },
}));

import { Mermaid } from '@/components/conversation/Mermaid';

describe('MermaidViewer', () => {
  it('có nút phóng to sau khi render, mở/đóng bằng Esc', async () => {
    render(<Mermaid code={'graph TD; A-->B'} />);
    const open = await screen.findByLabelText('Zoom diagram');
    fireEvent.click(open);
    expect(screen.getByTestId('mermaid-viewer')).toBeTruthy();
    expect(screen.getByTestId('mermaid-zoom-level').textContent).toBe('100%');
    fireEvent.keyDown(screen.getByTestId('mermaid-viewer'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('mermaid-viewer')).toBeNull());
  });

  it('Zoom in / out / Reset và phím', async () => {
    render(<Mermaid code={'graph TD; A-->C'} />);
    fireEvent.click(await screen.findByLabelText('Zoom diagram'));
    const level = () => screen.getByTestId('mermaid-zoom-level').textContent;
    fireEvent.click(screen.getByLabelText('Zoom in'));
    expect(level()).toBe('125%');
    fireEvent.click(screen.getByLabelText('Zoom out'));
    fireEvent.click(screen.getByLabelText('Zoom out'));
    expect(level()).toBe('80%');
    fireEvent.click(screen.getByLabelText('Reset zoom'));
    expect(level()).toBe('100%');
    fireEvent.keyDown(screen.getByLabelText('Reset zoom').parentElement!, { key: '+' });
    expect(level()).toBe('125%');
  });

  it('nút Zoom in bị vô hiệu ở giới hạn tối đa', async () => {
    render(<Mermaid code={'graph TD; A-->D'} />);
    fireEvent.click(await screen.findByLabelText('Zoom diagram'));
    for (let i = 0; i < 12; i++) fireEvent.click(screen.getByLabelText('Zoom in'));
    expect((screen.getByLabelText('Zoom in') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId('mermaid-zoom-level').textContent).toBe('800%');
  });

  it('diagram lỗi không có nút phóng to', async () => {
    fail = true;
    render(<Mermaid code={'not valid mermaid'} />);
    await screen.findByText(/Mermaid syntax error/);
    expect(screen.queryByLabelText('Zoom diagram')).toBeNull();
    fail = false;
  });

  it('hai diagram độc lập', async () => {
    render(
      <>
        <Mermaid code={'graph TD; X-->Y'} />
        <Mermaid code={'graph TD; P-->Q'} />
      </>,
    );
    await waitFor(() => expect(screen.getAllByLabelText('Zoom diagram')).toHaveLength(2));
    fireEvent.click(screen.getAllByLabelText('Zoom diagram')[1]!);
    expect(screen.getAllByTestId('mermaid-viewer')).toHaveLength(1);
    expect(screen.getByTestId('mermaid-zoom-level').textContent).toBe('100%');
  });
});
