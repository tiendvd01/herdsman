import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CodeBlock } from '@/components/conversation/CodeBlock';
import { toast } from '@/components/ui/toast';

vi.mock('@/components/ui/toast', () => ({ toast: vi.fn() }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('confirms only a completed write and allows retry after a clipboard error', async () => {
  let finish = () => {};
  const writeText = vi.fn()
    .mockRejectedValueOnce(new Error('Clipboard denied'))
    .mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  render(<CodeBlock code="pnpm test" plain />);
  const copy = screen.getByRole('button', { name: 'Copy code' });
  copy.focus();
  fireEvent.click(copy);
  await waitFor(() => expect(toast).toHaveBeenCalledWith('Could not copy code. Try again.', 'error'));
  expect(screen.queryByText('Copied')).toBeNull();
  fireEvent.click(copy);
  expect(screen.getByText('Copying…')).toBeTruthy();
  expect(screen.queryByText('Copied')).toBeNull();
  finish();
  expect(await screen.findByText('Copied')).toBeTruthy();
  expect(writeText).toHaveBeenLastCalledWith('pnpm test');
});
