import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, errMsg } from '@/lib/api';
import { useUiStore } from '@/stores/useUiStore';

const cliDefault = ':default';

export function GitHubSettingsSection() {
  const selected = useUiStore((state) => state.githubAccount);
  const selectAccount = useUiStore((state) => state.setGitHubAccount);
  const accounts = useQuery({ queryKey: ['github-accounts'], queryFn: api.githubAccounts, retry: false });
  const logins = accounts.data ?? [];

  return (
    <div className="flex flex-col gap-2 py-4">
      <label htmlFor="github-account" className="text-sm font-medium">GitHub account</label>
      <p id="github-account-hint" className="text-xs text-muted-foreground">
        Choose the account Herdsman uses for Pull Requests. Add accounts with <code>gh auth login</code>.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selected ?? cliDefault} onValueChange={(value) => selectAccount(value === cliDefault ? null : value)}>
          <SelectTrigger id="github-account" aria-describedby="github-account-hint" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={cliDefault}>GitHub CLI default</SelectItem>
              {selected && !logins.includes(selected) && <SelectItem value={selected}>{selected}</SelectItem>}
              {logins.map((login) => <SelectItem key={login} value={login}>{login}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" disabled={accounts.isFetching} onClick={() => void accounts.refetch()}>
          Refresh accounts
        </Button>
      </div>
      {accounts.isFetching && <p role="status" className="text-xs text-muted-foreground">Loading GitHub accounts…</p>}
      {accounts.isError && <p role="alert" className="text-xs text-destructive">{errMsg(accounts.error)}</p>}
      {accounts.isSuccess && logins.length === 0 && (
        <p className="text-xs text-muted-foreground">No GitHub accounts are signed in.</p>
      )}
      {accounts.isSuccess && selected && !logins.includes(selected) && (
        <p role="status" className="text-xs text-muted-foreground">The selected account is no longer signed in.</p>
      )}
    </div>
  );
}
