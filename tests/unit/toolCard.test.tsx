import { expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToolCard } from '@/components/conversation/ToolCard';
import type { Item } from '@/stores/useSessionStore';

it('shows the complete Bash command as plain text in expanded details', () => {
  const command = '  cd "/a long path"\nprintf "%s" \'<tag>\'  ';
  const { container } = render(<ToolCard item={{
    kind: 'tool', key: '1', tool_use_id: 'one', tool: 'Bash',
    input: { command, description: 'Check frontend', timeout: 300000 }, steps: 0, ts: 1,
    result: { content: '(Bash completed with no output)', is_error: false },
  }} />, { wrapper: TooltipProvider });

  expect(screen.queryByLabelText('Shell command')).toBeNull();
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByLabelText('Shell command').textContent).toBe(command);
  expect(container.textContent).not.toContain('Check frontend');
  expect(screen.getByText('(Bash completed with no output)')).toBeTruthy();
});

it.each(['Bash', 'Read'])('keeps generic details for %s without a command', (tool) => {
  const input = { file_path: 'notes.txt' };
  const { container } = render(<ToolCard item={{
    kind: 'tool', key: '1', tool_use_id: 'one', tool, input, steps: 0, ts: 1,
  }} />, { wrapper: TooltipProvider });

  fireEvent.click(screen.getByRole('button'));
  expect(container.querySelector('pre')?.textContent).toBe(JSON.stringify(input, null, 2));
});

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
