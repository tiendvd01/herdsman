import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { StatusBar } from '@/components/layout/StatusBar';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { qk } from '@/lib/queries';

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => true,
  invoke: vi.fn(),
}));

vi.mock('@/components/terminal/WorkspaceTerminal', () => ({
  default: ({ address }: { address: string }) => <div>Connected to {address}</div>,
}));

it('toggles the numbered terminal tabs, switches shells and creates a new shell in context', async () => {
  const appInfo = vi.spyOn(api, 'appInfo').mockImplementation(() => new Promise(() => {}));
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const info = { environment: 'development', hc_connected: true, hc_path: '/bin/hc', node_path: '/bin/node' };
  let terminals = [{ address: 't1', state: 'live' }];
  const stop = vi.spyOn(api, 'floatingTerminalStop').mockImplementation(async (address) => {
    terminals = terminals.filter((terminal) => terminal.address !== address);
  });
  const list = vi.spyOn(api, 'floatingTerminalList').mockImplementation(async () => terminals);
  const create = vi.spyOn(api, 'floatingTerminalCreate')
    .mockRejectedValueOnce({ message: 'hc is not connected.' })
    .mockImplementationOnce(async () => {
      const next = { address: 't2', state: 'live' };
      terminals = [...terminals, next];
      return next;
    });
  render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <StatusBar workspaceId="workspace" projectId="project" />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>,
  );

  expect(screen.getByText('Checking hc…')).toBeTruthy();
  act(() => { client.setQueryData(qk.appInfo, { ...info, hc_connected: false, hc_path: null }); });
  expect(await screen.findByText('hc not installed')).toBeTruthy();
  act(() => { client.setQueryData(qk.appInfo, { ...info, hc_connected: false }); });
  expect(await screen.findByText('hc not connected')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Terminal' }));
  const panel = await screen.findByRole('region', { name: 'Floating terminal' });
  expect(within(panel).getByRole('group', { name: 'Terminal tabs' })).toBeTruthy();
  expect(await screen.findByText('Connected to t1')).toBeTruthy();
  fireEvent.click(within(panel).getByRole('button', { name: 'New terminal' }));
  expect(await screen.findByText('hc is not connected.')).toBeTruthy();
  act(() => { client.setQueryData(qk.appInfo, info); });
  expect(await screen.findByText('hc connected')).toBeTruthy();
  expect(await screen.findByText('Development')).toBeTruthy();
  fireEvent.click(within(panel).getByRole('button', { name: 'New terminal' }));
  expect(await screen.findByText('Connected to t2')).toBeTruthy();
  expect(create).toHaveBeenLastCalledWith('workspace', 'project');
  fireEvent.click(screen.getByRole('button', { name: 'Terminal 1' }));
  expect(screen.getByText('Connected to t1')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Terminal' }));
  expect(screen.queryByRole('group', { name: 'Terminal tabs' })).toBeNull();
  expect(screen.queryByRole('region', { name: 'Floating terminal' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Terminal' }));
  expect(screen.getByText('Connected to t1')).toBeTruthy();
  const reopened = screen.getByRole('region', { name: 'Floating terminal' });
  fireEvent.click(within(reopened).getByRole('button', { name: 'Close Terminal 1' }));
  expect(await screen.findByText('Connected to t2')).toBeTruthy();
  expect(stop).toHaveBeenCalledExactlyOnceWith('t1');
  fireEvent.click(within(reopened).getByRole('button', { name: 'Minimize Terminal' }));
  expect(screen.queryByRole('region', { name: 'Floating terminal' })).toBeNull();
  expect(stop).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledTimes(2);
  act(() => { client.setQueryData(qk.appInfo, { ...info, environment: 'production' }); });
  expect(await screen.findByText('Production')).toBeTruthy();
  stop.mockRestore();
  list.mockRestore();
  create.mockRestore();
  appInfo.mockRestore();
});
