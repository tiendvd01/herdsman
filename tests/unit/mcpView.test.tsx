// Spec 071: MCP servers per project — toggle, add, remove, secrets never shown.
// Spec 072: servers Claude loads by itself are turned on or off per project.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';

vi.mock('@/lib/api', () => ({
  api: {
    mcpCatalog: vi.fn(),
    mcpServerSave: vi.fn(async () => 'new-id'),
    mcpServerRemove: vi.fn(async () => ({ affected_projects: ['alpha', 'beta'] })),
    mcpProjectToggle: vi.fn(async () => undefined),
    mcpNativeToggle: vi.fn(async () => undefined),
  },
  errMsg: (e: unknown) => (e as { message?: string })?.message ?? String(e),
}));

import { api } from '@/lib/api';
import { ProjectMcpSection } from '@/components/settings/ProjectMcpSection';

const catalog = {
  servers: [
    { id: 'm1', name: 'github-tools', transport: 'stdio', command: 'npx', args: ['-y', 'gh'], url: null,
      env: [{ key: 'GITHUB_TOKEN', set: true }], headers: [], enabled: false, conflict: null },
  ],
  native: [
    { name: 'sora-pms', transport: 'stdio', scope: 'user', source: '/home/me/.claude.json', enabled: true },
    { name: 'codegraph', transport: 'stdio', scope: 'project', source: '/repo/.mcp.json', enabled: false },
  ],
};

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <ProjectMcpSection projectId="p1" />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.mcpCatalog).mockResolvedValue(catalog as never);
});

describe('ProjectMcpSection', () => {
  it('lists Herdsman servers with a switch', async () => {
    renderSection();
    const toggle = await screen.findByRole('switch', { name: 'Enable github-tools' });
    expect(screen.getByText('GITHUB_TOKEN=••••')).toBeTruthy();
    fireEvent.click(toggle);
    await waitFor(() => expect(api.mcpProjectToggle).toHaveBeenCalledWith('p1', 'm1', true));
  });

  it('turns servers Claude loads by itself on and off for the project', async () => {
    renderSection();
    const sora = await screen.findByRole('switch', { name: 'Enable sora-pms (Claude user)' });
    const codegraph = screen.getByRole('switch', { name: 'Enable codegraph (Claude project)' });
    expect(sora.getAttribute('aria-checked')).toBe('true');
    expect(codegraph.getAttribute('aria-checked')).toBe('false');
    expect(screen.queryByText(/Read only/)).toBeNull();
    fireEvent.click(sora);
    await waitFor(() => expect(api.mcpNativeToggle).toHaveBeenCalledWith('p1', 'sora-pms', false));
    fireEvent.click(codegraph);
    await waitFor(() => expect(api.mcpNativeToggle).toHaveBeenCalledWith('p1', 'codegraph', true));
  });

  it('shows why turning a Claude server off failed', async () => {
    vi.mocked(api.mcpNativeToggle).mockRejectedValueOnce({ code: 'mcp_invalid', message: 'Name must be 1-64 letters, digits, - or _' });
    renderSection();
    fireEvent.click(await screen.findByRole('switch', { name: 'Enable sora-pms (Claude user)' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Name must be 1-64');
  });

  it('adds a stdio server with its secret as a write-only value', async () => {
    renderSection();
    fireEvent.click(await screen.findByRole('button', { name: /Add server/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'docs' } });
    fireEvent.change(within(dialog).getByLabelText('Command'), { target: { value: 'node' } });
    fireEvent.change(within(dialog).getByLabelText('Arguments'), { target: { value: 'server.js\n--stdio' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /Add variable/ }));
    fireEvent.change(within(dialog).getByLabelText('Variable 1 name'), { target: { value: 'TOKEN' } });
    const value = within(dialog).getByLabelText('Variable 1 value');
    expect(value.getAttribute('type')).toBe('password');
    fireEvent.change(value, { target: { value: 'abc' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add server' }));
    await waitFor(() => expect(api.mcpServerSave).toHaveBeenCalledWith({
      id: undefined, name: 'docs', transport: 'stdio', command: 'node', args: ['server.js', '--stdio'],
      url: undefined, env: [{ key: 'TOKEN', value: 'abc' }], headers: [],
    }));
  });

  it('keeps a stored secret when editing with an empty value', async () => {
    renderSection();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('Variable 1 value')).toHaveProperty('value', '');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.mcpServerSave).toHaveBeenCalledWith(expect.objectContaining({
      id: 'm1', env: [{ key: 'GITHUB_TOKEN' }],
    })));
  });

  it('lists affected projects before removing a server', async () => {
    renderSection();
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    const confirm = await screen.findByRole('alertdialog');
    expect(confirm.textContent).toContain('alpha, beta');
    expect(api.mcpServerRemove).toHaveBeenCalledWith('m1', true);
    fireEvent.click(within(confirm).getByRole('button', { name: 'Remove server' }));
    await waitFor(() => expect(api.mcpServerRemove).toHaveBeenCalledWith('m1', false));
  });
});
