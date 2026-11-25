import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import HcOutputWindow from '@/components/conversation/HcOutputWindow';

it('renders the original output as text alongside its terminal status', () => {
  const client = new QueryClient({ defaultOptions: { queries: { enabled: false } } });
  client.setQueryData(['hc-output'], {
    terminal: { address: 't7', name: 'backend-test', state: 'finished', exit_code: 3 },
    text: '\x1b[31m<test failure>\x1b[0m',
    complete: false,
  });
  const { container } = render(
    <QueryClientProvider client={client}>
      <HcOutputWindow />
    </QueryClientProvider>,
  );
  expect(screen.getByRole('status').textContent).toContain('Failed (exit 3)');
  expect(screen.getByText('backend-test')).toBeTruthy();
  expect(screen.getByText('Only part of the terminal output is available.')).toBeTruthy();
  expect(screen.getByLabelText('Terminal output').textContent).toBe('<test failure>');
  expect(container.querySelector('test')).toBeNull();
});
