// spec 071: add or edit an MCP server managed by Herdsman. Secret values are write-only.
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Input, Label, NativeSelect } from '@/components/ui/input';
import type { McpServerInput, McpServerView, McpTransport } from '@/lib/api';

interface Row {
  key: string;
  value: string;
  /** The app already stores a value for this key; leaving `value` empty keeps it. */
  stored: boolean;
}

const rows = (items: { key: string; set: boolean }[] | undefined): Row[] =>
  (items ?? []).map((item) => ({ key: item.key, value: '', stored: item.set }));

function KeyValueRows({ label, keyLabel, rows: list, onChange }: {
  label: string;
  keyLabel: string;
  rows: Row[];
  onChange: (rows: Row[]) => void;
}) {
  const update = (i: number, patch: Partial<Row>) => onChange(list.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      {list.map((row, i) => (
        <div key={i} className="flex gap-2">
          <Input aria-label={`${keyLabel} ${i + 1} name`} placeholder={keyLabel} value={row.key}
            onChange={(e) => update(i, { key: e.target.value })} className="flex-1 font-mono" />
          <Input aria-label={`${keyLabel} ${i + 1} value`} type="password" autoComplete="off"
            placeholder={row.stored ? '•••• (unchanged)' : 'Value'} value={row.value}
            onChange={(e) => update(i, { value: e.target.value })} className="flex-1" />
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${row.key || keyLabel}`}
            onClick={() => onChange(list.filter((_, j) => j !== i))}>
            <X aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start"
        onClick={() => onChange([...list, { key: '', value: '', stored: false }])}>
        <Plus data-icon="inline-start" /> Add {keyLabel.toLowerCase()}
      </Button>
    </fieldset>
  );
}

export function McpServerDialog({ server, open, onOpenChange, onSave, busy, error }: {
  server?: McpServerView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: McpServerInput) => void;
  busy: boolean;
  error: string;
}) {
  const [name, setName] = useState(server?.name ?? '');
  const [transport, setTransport] = useState<McpTransport>(server?.transport ?? 'stdio');
  const [command, setCommand] = useState(server?.command ?? '');
  const [args, setArgs] = useState((server?.args ?? []).join('\n'));
  const [url, setUrl] = useState(server?.url ?? '');
  const [env, setEnv] = useState(rows(server?.env));
  const [headers, setHeaders] = useState(rows(server?.headers));
  const stdio = transport === 'stdio';
  const pack = (list: Row[]) => list.map((row) => (row.value ? { key: row.key, value: row.value } : { key: row.key }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader
          title={server ? `Edit ${server.name}` : 'Add MCP server'}
          description="Values of environment variables and headers are stored in the Keychain."
        />
        <form className="flex flex-col gap-4" onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: server?.id,
            name,
            transport,
            command: stdio ? command : undefined,
            args: stdio ? args.split('\n').map((arg) => arg.trim()).filter(Boolean) : [],
            url: stdio ? undefined : url,
            env: stdio ? pack(env) : [],
            headers: stdio ? [] : pack(headers),
          });
        }}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mcp-name">Name</Label>
            <Input id="mcp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="github-tools" className="font-mono" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mcp-transport">Transport</Label>
            <NativeSelect id="mcp-transport" value={transport} onChange={(e) => setTransport(e.target.value as McpTransport)}>
              <option value="stdio">Local command (stdio)</option>
              <option value="http">HTTP</option>
              <option value="sse">Server-sent events (SSE)</option>
            </NativeSelect>
          </div>
          {stdio ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mcp-command">Command</Label>
                <Input id="mcp-command" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="npx" className="font-mono" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mcp-args">Arguments</Label>
                <textarea id="mcp-args" value={args} onChange={(e) => setArgs(e.target.value)} rows={3}
                  placeholder={'-y\n@acme/mcp-server'}
                  className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <p className="text-xs text-muted-foreground">One argument per line.</p>
              </div>
              <KeyValueRows label="Environment variables" keyLabel="Variable" rows={env} onChange={setEnv} />
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mcp-url">URL</Label>
                <Input id="mcp-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/mcp" />
              </div>
              <KeyValueRows label="Headers" keyLabel="Header" rows={headers} onChange={setHeaders} />
            </>
          )}
          {error ? <p role="alert" className="rounded-md border border-destructive/40 bg-danger-bg px-3 py-2 text-xs text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !name.trim()}>{busy ? 'Saving…' : server ? 'Save' : 'Add server'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
