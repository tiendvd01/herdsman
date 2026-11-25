import { expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToolCard } from '@/components/conversation/ToolCard';
import type { Item } from '@/stores/useSessionStore';

it('shows running Bash output as text and keeps the card open on failure', () => {
  const item: Extract<Item, { kind: 'tool' }> = {
    kind: 'tool', key: '1', tool_use_id: 'one', tool: 'Bash', input: { command: 'test backend' }, steps: 0, ts: 1,
    shell: { status: 'running', output: 'starting\n<img src=x>\n', truncated: true },
  };
  const { container, rerender } = render(<ToolCard item={item} />, { wrapper: TooltipProvider });
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText('Running')).toBeTruthy();
  expect(screen.getByText('Earlier output omitted.')).toBeTruthy();
  expect(container.textContent).toContain('starting\n<img src=x>');
  expect(container.querySelector('img')).toBeNull();

  rerender(<ToolCard item={{ ...item, shell: { ...item.shell, status: 'failed' }, result: { content: 'Exit code 3\nstarting\n<img src=x>\nfailed', is_error: true } }} />);
  expect(screen.getByText('Failed', { exact: true })).toBeTruthy();
  expect(container.textContent).toContain('Exit code 3');
  expect(screen.queryByText('Earlier output omitted.')).toBeNull();
});
