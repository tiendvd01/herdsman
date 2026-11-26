// spec 071: MCP servers per project. Herdsman servers can be enabled per project.
// spec 072: servers Claude loads by itself can be turned off per project, by name.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { api, errMsg, type McpServerInput, type McpServerView } from '@/lib/api';
import { McpServerDialog } from './McpServerDialog';

const SCOPE = { project: 'Claude project', local: 'Claude local', user: 'Claude user' } as const;

const target = (server: McpServerView) =>
  server.transport === 'stdio' ? [server.command, ...server.args].filter(Boolean).join(' ') : server.url ?? '';

export function ProjectMcpSection({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ['project-mcp', projectId] as const;
  const catalog = useQuery({ queryKey, queryFn: () => api.mcpCatalog(projectId) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['project-mcp'] });
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<{ server?: McpServerView }>();
  const [removing, setRemoving] = useState<{ server: McpServerView; projects: string[] }>();
  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => api.mcpProjectToggle(projectId, id, enabled),
    onSettled: refresh,
  });
  const nativeToggle = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) => api.mcpNativeToggle(projectId, name, enabled),
    onSettled: refresh,
  });
  const save = useMutation({
    mutationFn: (input: McpServerInput) => api.mcpServerSave(input),
    onSuccess: () => setEditing(undefined),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: async ({ server, confirmed }: { server: McpServerView; confirmed: boolean }) => {
      const impact = await api.mcpServerRemove(server.id, !confirmed);
      if (!confirmed) setRemoving({ server, projects: impact.affected_projects });
    },
    onSettled: (_, __, { confirmed }) => (confirmed ? refresh() : undefined),
  });
  const term = search.trim().toLowerCase();
  const matches = (name: string, detail: string) => name.toLowerCase().includes(term) || detail.toLowerCase().includes(term);
  const servers = catalog.data?.servers.filter((server) => matches(server.name, target(server)));
  const native = catalog.data?.native.filter((server) => matches(server.name, server.source));
  const failed = [toggle, nativeToggle, remove].find((mutation) => mutation.isError);
  const error = failed ? errMsg(failed.error) : '';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input aria-label="Search MCP servers" placeholder="Search MCP servers" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button variant="outline" disabled={catalog.isFetching} onClick={() => void catalog.refetch()}>
          <RefreshCw data-icon="inline-start" /> Refresh
        </Button>
        <Button onClick={() => { save.reset(); setEditing({}); }}>
          <Plus data-icon="inline-start" /> Add server
        </Button>
      </div>
      {catalog.isPending && <p role="status" className="text-sm text-muted-foreground">Loading MCP servers…</p>}
      {catalog.isError && <p role="alert" className="text-sm text-destructive">Could not load MCP servers. {errMsg(catalog.error)}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {catalog.data && (
        <>
          <p className="text-xs text-muted-foreground">Enabled servers apply to new Claude sessions in this project.</p>
          {servers?.length === 0 && (
            <p className="text-sm text-muted-foreground">{term ? 'No matching MCP servers.' : 'No MCP servers yet. Add one to use it in this project.'}</p>
          )}
          <ul aria-label="Herdsman MCP servers" className="divide-y divide-border">
            {servers?.map((server) => (
              <li key={server.id} className="flex items-start justify-between gap-4 py-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="break-words font-mono">{server.name}</span>
                    <Badge variant="muted">{server.transport}</Badge>
                  </span>
                  <span className="break-all font-mono text-xs text-muted-foreground">{target(server)}</span>
                  {[...server.env, ...server.headers].length > 0 && (
                    <span className="break-all text-xs text-muted-foreground">
                      {[...server.env, ...server.headers].map((item) => `${item.key}=••••`).join('  ')}
                    </span>
                  )}
                  {server.conflict && (
                    <span className="flex items-center gap-1.5 text-xs text-warn-fg">
                      <AlertTriangle aria-hidden="true" className="size-3.5 text-warn-icon" /> {server.conflict}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { save.reset(); setEditing({ server }); }}>Edit</Button>
                  <Button variant="outline" size="sm" disabled={remove.isPending}
                    onClick={() => remove.mutate({ server, confirmed: false })}>Remove</Button>
                  <Switch aria-label={`Enable ${server.name}`} checked={server.enabled} disabled={toggle.isPending}
                    onCheckedChange={(enabled) => toggle.mutate({ id: server.id, enabled })} />
                </div>
              </li>
            ))}
          </ul>
          <section aria-labelledby="mcp-native-title" className="flex flex-col gap-2 border-t border-border pt-4">
            <h3 id="mcp-native-title" className="text-sm font-medium">Loaded by Claude</h3>
            <p className="text-xs text-muted-foreground">Turn a server off to keep it out of new Claude sessions in this project. Claude's config files stay unchanged.</p>
            {native?.length === 0 && <p className="text-xs text-muted-foreground">Claude loads no MCP servers of its own for this project.</p>}
            <ul className="divide-y divide-border">
              {native?.map((server) => (
                <li key={`${server.scope}:${server.name}`} className="flex items-start justify-between gap-4 py-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="break-words font-mono">{server.name}</span>
                      <Badge variant="outline">{SCOPE[server.scope] ?? server.scope}</Badge>
                    </span>
                    <span className="break-all text-xs text-muted-foreground">{server.transport} · {server.source}</span>
                  </div>
                  <Switch aria-label={`Enable ${server.name} (${SCOPE[server.scope] ?? server.scope})`} checked={server.enabled}
                    disabled={nativeToggle.isPending}
                    onCheckedChange={(enabled) => nativeToggle.mutate({ name: server.name, enabled })} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      {editing && (
        <McpServerDialog
          key={editing.server?.id ?? 'new'}
          open
          server={editing.server}
          busy={save.isPending}
          error={save.isError ? errMsg(save.error) : ''}
          onOpenChange={(open) => { if (!open) setEditing(undefined); }}
          onSave={(input) => save.mutate(input)}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => { if (!open) setRemoving(undefined); }}
        title="Remove MCP server?"
        description={removing?.projects.length
          ? `New Claude sessions in these projects stop getting ${removing.server.name}: ${removing.projects.join(', ')}.`
          : 'No projects use this server.'}
        confirmLabel="Remove server"
        destructive
        onConfirm={() => {
          if (!removing) return;
          remove.mutate({ server: removing.server, confirmed: true });
          setRemoving(undefined);
        }}
      />
    </div>
  );
}
