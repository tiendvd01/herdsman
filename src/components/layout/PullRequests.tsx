import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, ChevronRight, CircleCheck, CircleX, GitPullRequest, Info, RefreshCw, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { errCode, errMsg } from '@/lib/api';
import { useProjects } from '@/lib/queries';
import { useUiStore } from '@/stores/useUiStore';
import { PullRequestStatusChip, pullRequestDetailKey } from './PullRequestActivity';
import { PullRequestDetails, PullRequestUpdated, pullRequestProgress, type PullRequest } from './PullRequestDetails';

interface Notification {
  repository: string;
  projects: { id: string; name: string }[];
  event: { key: string; title: string; number: number; kind: string; read: boolean; at?: string };
}

const notificationTypes = {
  warning: { label: 'Warning', variant: 'warn', Icon: TriangleAlert },
  approved: { label: 'Approved', variant: 'success', Icon: CircleCheck },
  info: { label: 'Info', variant: 'info', Icon: Info },
  error: { label: 'Error', variant: 'danger', Icon: CircleX },
} as const;

const notificationTypeByEvent = new Map<string, keyof typeof notificationTypes>([
  ['Review requested', 'warning'],
  ['Changes requested', 'warning'],
  ['Base branch update required', 'warning'],
  ['Approved', 'approved'],
  ['CI failed', 'error'],
]);

function NotificationTypeBadge({ kind }: { kind: string }) {
  const { label, variant, Icon } = notificationTypes[notificationTypeByEvent.get(kind) ?? 'info'];
  return <Badge variant={variant}><Icon aria-hidden="true" />{label}</Badge>;
}

const notificationTimeFormatter = new Intl.DateTimeFormat('en', {
  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

function NotificationTime({ at }: { at?: string }) {
  if (!at) return null;
  const date = new Date(at);
  if (!Number.isFinite(date.getTime())) return null;
  return <time dateTime={at} title={date.toLocaleString('en')}>{notificationTimeFormatter.format(date)}</time>;
}

export type WorktreePull = {
  number: number;
  headRefName: string;
  state: 'OPEN' | 'MERGED' | 'CLOSED';
  isDraft: boolean;
};

interface Snapshot {
  account?: string;
  error?: string;
  projects: Record<string, { repository?: string; error?: string; stale?: boolean; pulls: PullRequest[]; worktreePulls?: WorktreePull[] }>;
  notifications: Notification[];
}

const queryKey = ['pull-requests'] as const;
export const allProjects = 'all';
const views = [
  { key: 'overview', label: 'Overview', countVariant: 'muted' },
  { key: 'authored', label: 'Authored by Me', countVariant: 'success' },
  { key: 'requested', label: 'Review Requested', countVariant: 'info' },
  { key: 'notifications', label: 'Notifications', countVariant: 'warn' },
] as const;
type ContentView = typeof views[number]['key'];
type Target = { projectId: string; repository: string; number: number; account: string };

function rowId(projectId: string, repository: string, number: number) {
  return `pull-request-${projectId}-${repository}-${number}`;
}

export function openOriginal(repository: string, number: number) {
  return invoke('pull_request_open', { repository, number }).catch((error) => toast(errMsg(error), 'error'));
}

export function usePullRequests() {
  const projectQuery = useProjects();
  const { data: projects = [], isSuccess } = projectQuery;
  const githubAccount = useUiStore((s) => s.githubAccount);
  const accountQueryKey = [...queryKey, githubAccount] as const;
  const screen = useUiStore((s) => s.screen);
  const workspaceProjectId = useUiStore((s) => s.projectId);
  const setScreen = useUiStore((s) => s.setScreen);
  const [projectFilter, setProjectFilter] = useState<string>();
  const [view, setView] = useState<ContentView>('overview');
  const [target, setTarget] = useState<Target>();
  const [choice, setChoice] = useState<Notification>();
  const [updatingReadStatus, setUpdatingReadStatus] = useState(false);
  const client = useQueryClient();
  const previous = useRef<{ account?: string; keys: Set<string> }>();
  const openNotification = useRef<(item: Notification, account?: string) => void>();
  const query = useQuery({
    queryKey: accountQueryKey,
    queryFn: async (): Promise<Snapshot> => {
      try {
        return await invoke<Snapshot>('pull_requests_refresh', { githubAccount });
      } catch (error) {
        if (errCode(error) === 'offline') throw error;
        return { error: errMsg(error), projects: {}, notifications: [] };
      }
    },
    enabled: isTauri() && isSuccess,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    gcTime: 0,
    retry: false,
  });
  const projectIds = projects.map((project) => project.id).sort().join(',');
  useEffect(() => {
    if (isSuccess && isTauri()) void client.invalidateQueries({ queryKey });
  }, [projectIds, isSuccess, client]);

  useEffect(() => {
    setTarget(undefined);
    setChoice(undefined);
  }, [githubAccount]);

  const data = query.data;
  useEffect(() => {
    const inaccessible = new Set(Object.values(data?.projects ?? {})
      .filter((project) => project.error && !project.stale)
      .map((project) => project.repository));
    client.removeQueries({
      queryKey: [pullRequestDetailKey],
      type: 'inactive',
      predicate: ({ queryKey: [, selected, account, repository] }) => selected !== githubAccount
        || Boolean(data?.error || (data?.account && account !== data.account))
        || (typeof repository === 'string' && inaccessible.has(repository)),
    });
  }, [client, data, githubAccount]);
  const error = query.isError ? errMsg(query.error) : data?.error;
  const stale = query.isError && Boolean(data?.account);
  const preferredProject = projectFilter ?? workspaceProjectId;
  const projectId = projects.find((project) => project.id === preferredProject)?.id ?? allProjects;
  useEffect(() => {
    if (screen === 'pull-requests' && isSuccess) setProjectFilter(projectId);
  }, [screen, isSuccess, projectId]);

  const visibleProjects = projectId === allProjects ? projects : projects.filter((project) => project.id === projectId);
  const projectLists = visibleProjects.map((project) => ({ ...project, current: data?.projects[project.id] }));
  const current = target && target.account === data?.account
    ? projectLists.find(({ id }) => id === target.projectId)?.current : undefined;
  const pull = target && current && current.repository === target.repository && (!current.error || current.stale)
    ? current.pulls.find((item) => item.number === target.number) : undefined;
  const detail = target && pull ? { ...target, pull, error: current?.error } : undefined;
  useEffect(() => {
    if (target && !pull) setTarget(undefined);
  }, [target, pull]);

  const notifications = (data?.notifications ?? []).flatMap((item) => {
    const eligible = item.projects.filter((candidate) => projects.some((project) => project.id === candidate.id));
    return eligible.length ? [{ ...item, projects: eligible }] : [];
  });
  const unread = notifications.filter(({ event }) => !event.read).length;
  const visibleNotifications = notifications.filter((item) =>
    projectId === allProjects || item.projects.some((project) => project.id === projectId));
  const canMarkUnread = Boolean(data?.account && visibleNotifications.some(({ event }) => event.read));

  const canMarkRead = Boolean(data?.account && visibleNotifications.some(({ event }) => !event.read));

  async function markAllNotifications(read: boolean) {
    const account = data?.account;
    if (!account || updatingReadStatus || !(read ? canMarkRead : canMarkUnread)) return;
    const eventsByRepository = new Map<string, Set<string>>();
    for (const { repository, event } of visibleNotifications) {
      const events = eventsByRepository.get(repository) ?? new Set<string>();
      events.add(event.key);
      eventsByRepository.set(repository, events);
    }

    setUpdatingReadStatus(true);
    try {
      await invoke('pull_requests_set_read', {
        account,
        read,
        eventsByRepository: Object.fromEntries(
          Array.from(eventsByRepository, ([repository, events]) => [repository, [...events]]),
        ),
      });
      if (useUiStore.getState().githubAccount !== githubAccount) return;
      await client.cancelQueries({ queryKey: accountQueryKey, exact: true });
      client.setQueryData<Snapshot>(accountQueryKey, (snapshot) => {
        if (!snapshot || snapshot.account !== account) return snapshot;
        return {
          ...snapshot,
          notifications: snapshot.notifications.map((notification) =>
            notification.event.read !== read && eventsByRepository.get(notification.repository)?.has(notification.event.key)
              ? { ...notification, event: { ...notification.event, read } }
              : notification),
        };
      });
    } catch (error) {
      toast(`Could not mark notifications as ${read ? 'read' : 'unread'}. Try again. ${errMsg(error)}`, 'error');
    } finally {
      setUpdatingReadStatus(false);
    }
  }

  async function showNotification(item: Notification, destination?: string, fromToast = false) {
    if (!data?.account) return;
    const id = destination ?? item.projects.find((project) => project.id === projectId)?.id
      ?? (item.projects.length === 1 ? item.projects[0].id : undefined);
    setScreen('pull-requests');
    if (fromToast) setView('overview');
    if (!id) {
      setProjectFilter(allProjects);
      setTarget(undefined);
      setChoice(item);
      return;
    }
    setChoice(undefined);
    setProjectFilter(id);
    const account = data.account;
    const destinationData = data.projects[id];
    const tracked = destinationData?.repository === item.repository && destinationData.pulls.some((pr) => pr.number === item.event.number);
    setTarget(tracked ? { projectId: id, repository: item.repository, number: item.event.number, account } : undefined);
    try {
      await invoke('pull_requests_read', { account, repository: item.repository, eventKey: item.event.key });
      await client.cancelQueries({ queryKey: accountQueryKey, exact: true });
      client.setQueryData<Snapshot>(accountQueryKey, (snapshot) => {
        if (!snapshot || snapshot.account !== account) return snapshot;
        return {
          ...snapshot,
          notifications: snapshot.notifications.map((notification) =>
            notification.repository === item.repository && notification.event.key === item.event.key
              ? { ...notification, event: { ...notification.event, read: true } }
              : notification),
        };
      });
      const latest = client.getQueryData<Snapshot>(accountQueryKey);
      if (!tracked && latest?.account === account && latest.projects[id]?.repository === item.repository
        && (!latest.projects[id].error || latest.projects[id].stale)
        && useUiStore.getState().githubAccount === githubAccount) {
        await openOriginal(item.repository, item.event.number);
      }
    } catch (error) {
      toast(errMsg(error), 'error');
    }
  }

  useEffect(() => {
    openNotification.current = (item, account) => {
      if (data?.account !== account) return;
      const latest = notifications.find((candidate) => candidate.repository === item.repository && candidate.event.key === item.event.key);
      if (latest) void showNotification(latest, undefined, true);
    };
  });
  useEffect(() => {
    if (!data) return;
    const key = (item: Notification) => `${item.repository}:${item.event.key}`;
    const last = previous.current;
    const keys = last?.account === data.account ? new Set(last?.keys) : new Set<string>();
    for (const item of data.notifications) {
      if (last && last.account === data.account && !keys.has(key(item)) && !item.event.read) {
        const name = item.projects.map((project) => project.name).join(', ');
        toast(`${name} · #${item.event.number} ${item.event.title} · ${item.event.kind}`, 'info', {
          label: 'View',
          run: () => openNotification.current?.(item, data.account),
        }, <NotificationTypeBadge kind={item.event.kind} />);
      }
      keys.add(key(item));
    }
    previous.current = { account: data.account, keys };
  }, [data]);

  return { projectQuery, projectId, projectLists, view, unread, detail, choice, showNotification,
    canMarkRead, canMarkUnread, updatingReadStatus, markAllNotifications,
    worktreePullsByProject: data?.account && !data.error ? data.projects : undefined,
    selectView: (next: ContentView) => {
      setView(next);
      setTarget(undefined);
      setChoice(undefined);
    },
    openDetail: (id: string, repository: string, number: number) => {
      if (!data?.account) return;
      setTarget({ projectId: id, repository, number, account: data.account });
      setChoice(undefined);
    },
    closeDetail: () => setTarget(undefined),
    notifications: visibleNotifications,
    selectProject: (id: string) => {
      setProjectFilter(id);
      setTarget(undefined);
      setChoice(undefined);
    },
    error,
    stale,
    summaryUpdatedAt: query.dataUpdatedAt,
    loading: query.isFetching,
    refresh: () => void query.refetch(),
  };
}

type Tracker = ReturnType<typeof usePullRequests>;

const roles = [
  { key: 'authored', label: 'Authored by Me', empty: 'No open pull requests authored by you.' },
  { key: 'requested', label: 'Review Requested', empty: 'No pull requests awaiting your review.' },
] as const;

function messageFor(error: string, stale?: boolean) {
  return stale ? `Showing last known data. ${error}` : error;
}

export function PullRequestsView({ tracker }: { tracker: Tracker }) {
  const { detail, projectLists, notifications, choice, view } = tracker;
  const scroll = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const listTitle = useRef<HTMLHeadingElement>(null);
  const destination = useRef<HTMLButtonElement>(null);
  const resume = useRef<{ top: number; row: string; view: ContentView; project: string }>();
  const detailKey = detail && rowId(detail.projectId, detail.repository, detail.number);
  const desktop = isTauri();
  const canShowSnapshot = desktop && (!tracker.error || tracker.stale);
  const waiting = desktop && (tracker.projectQuery.isPending || (!tracker.error && projectLists.some(({ current }) => !current)));
  const loaded = !waiting && projectLists.some(({ current }) => current?.repository && (!current.error || current.stale));
  const counts = {
    overview: undefined,
    authored: loaded ? projectLists.reduce((total, { current }) => total + (current?.pulls.filter((pr) => pr.role === 'authored').length ?? 0), 0) : undefined,
    requested: loaded ? projectLists.reduce((total, { current }) => total + (current?.pulls.filter((pr) => pr.role === 'requested').length ?? 0), 0) : undefined,
    notifications: loaded ? notifications.filter(({ event }) => !event.read).length : undefined,
  };

  useLayoutEffect(() => {
    if (!scroll.current) return;
    if (detailKey) {
      scroll.current.scrollTop = 0;
      title.current?.focus({ preventScroll: true });
      return;
    }
    const last = resume.current;
    resume.current = undefined;
    scroll.current.scrollTop = 0;
    if (last?.view === view && last.project === tracker.projectId) {
      scroll.current.scrollTop = last.top;
      const row = document.getElementById(last.row);
      (row ?? listTitle.current)?.focus({ preventScroll: true });
    }
  }, [detailKey, view, tracker.projectId]);

  useLayoutEffect(() => {
    if (choice) destination.current?.focus();
  }, [choice]);

  return (
    <section aria-label="Pull Requests" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-linear-to-r from-st-working/10 to-surface px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-st-working/15 text-git-rename-fg"><GitPullRequest aria-hidden="true" className="size-4" /></span>
          <div className="min-w-0">
            <h1 className="text-base leading-tight font-semibold">Pull Requests</h1>
            <p className="wrap-anywhere text-xs text-muted-foreground">
              {tracker.projectId === allProjects ? 'All projects' : projectLists[0]?.name}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="xs" disabled={tracker.loading || !desktop} onClick={tracker.refresh}>
            <RefreshCw aria-hidden="true" className={tracker.loading ? 'motion-safe:animate-spin' : undefined} />
            {tracker.loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </header>

      <Tabs value={view} onValueChange={(value) => tracker.selectView(value as ContentView)} className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-border bg-surface px-4">
          <TabsList aria-label="Pull request views" className="h-auto max-w-full flex-wrap justify-start gap-1 rounded-none bg-transparent p-0">
            {views.map(({ key, label, countVariant }) => (
              <TabsTrigger key={key} value={key} className="h-10 rounded-none border-0 border-b-2 border-transparent px-3 aria-selected:border-st-working aria-selected:bg-st-working/10 aria-selected:text-git-rename-fg">
                {label}
                {counts[key] !== undefined && (
                  <Badge variant={counts[key] ? countVariant : 'muted'} className="h-auto rounded-full px-1 tabular-nums">{counts[key]}</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {detail && (
          <div className="shrink-0 border-b border-border bg-surface px-4 py-2">
            <Button variant="ghost" size="sm" onClick={() => {
              resume.current ??= { top: 0, row: '', view, project: tracker.projectId };
              tracker.closeDetail();
            }}>
              <ArrowLeft aria-hidden="true" data-icon="inline-start" />
              Back to list
            </Button>
          </div>
        )}

        <TabsContent ref={scroll} value={view} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
          {tracker.error && (
            <Alert variant={tracker.stale ? 'default' : 'destructive'} className="mb-4">
              <AlertDescription>{messageFor(tracker.error, tracker.stale)}</AlertDescription>
            </Alert>
          )}
          {detail ? (
            <>
              {detail.error && (
                <Alert className="mb-4"><AlertDescription>{messageFor(detail.error, true)}</AlertDescription></Alert>
              )}
              <PullRequestDetails
                key={detailKey + ':' + detail.account}
                ref={title}
                account={detail.account}
                summaryUpdatedAt={tracker.summaryUpdatedAt}
                pull={detail.pull}
                repository={detail.repository}
                onOpen={() => void openOriginal(detail.repository, detail.number)}
              />
            </>
          ) : (
            <div className="mx-auto flex max-w-5xl flex-col gap-4">
              <h2 ref={listTitle} tabIndex={-1} className="sr-only">{views.find(({ key }) => key === view)?.label} list</h2>
              {tracker.projectQuery.isError && (
                <Alert variant="destructive"><AlertDescription>Could not load projects.</AlertDescription></Alert>
              )}
              {tracker.projectQuery.isPending && <p role="status" className="text-sm text-muted-foreground">Loading projects…</p>}
              {!tracker.projectQuery.isPending && !tracker.projectQuery.isError && projectLists.length === 0 && (
                <Empty><EmptyMedia><GitPullRequest /></EmptyMedia><EmptyDescription>Add a project in Projects to see its pull requests.</EmptyDescription></Empty>
              )}
              {!desktop && projectLists.length > 0 && (
                <Empty><EmptyMedia><GitPullRequest /></EmptyMedia><EmptyDescription>Pull requests are available in the desktop app.</EmptyDescription></Empty>
              )}
              {canShowSnapshot && view !== 'notifications' && projectLists.map(({ id, name, current }) => {
                const repository = current?.repository;
                return (
                  <section key={id} aria-label={name} className="flex min-w-0 flex-col gap-2">
                    <header className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                      <h3 className="wrap-anywhere text-sm font-semibold">{name}</h3>
                      {repository && <span className="wrap-anywhere text-xs text-muted-foreground">{repository}</span>}
                    </header>
                    {current?.error && <Alert variant={current.stale ? 'default' : 'destructive'}><AlertDescription>{messageFor(current.error, current.stale)}</AlertDescription></Alert>}
                    {!current && <p role="status" className="text-sm text-muted-foreground">Loading pull requests…</p>}
                    {repository && current && (!current.error || current.stale) && (
                      <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
                        {roles.filter((role) => view === 'overview' || view === role.key).map((role) => {
                          const pulls = current.pulls.filter((pr) => pr.role === role.key);
                          return (
                            <section key={role.key} aria-label={role.label} className="flex min-w-0 flex-col border-b border-border last:border-b-0">
                              <h4 className="border-b border-border bg-st-working/5 px-3 py-2 text-xs font-semibold text-muted-foreground">{role.label}</h4>
                              {pulls.length === 0 && <p className="px-3 py-3 text-xs text-muted-foreground">{role.empty}</p>}
                              {pulls.map((pr) => {
                                const idForRow = rowId(id, repository, pr.number);
                                return (
                                  <button type="button" key={pr.number} id={idForRow}
                                    className="group grid min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-b border-border px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-st-working/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                                    onClick={() => {
                                      resume.current = { top: scroll.current?.scrollTop ?? 0, row: idForRow, view, project: tracker.projectId };
                                      tracker.openDetail(id, repository, pr.number);
                                    }}>
                                    <GitPullRequest aria-hidden="true" className="mt-1 size-4 text-git-rename-fg" />
                                    <span className="flex min-w-0 flex-col gap-1">
                                      <span className="line-clamp-2 wrap-anywhere text-sm font-semibold">{pr.title}</span>
                                      <span className="flex flex-wrap gap-x-2 text-xs font-normal text-muted-foreground">
                                        <span className="wrap-anywhere">{repository} · #{pr.number}</span>
                                        <PullRequestUpdated updatedAt={pr.updatedAt} />
                                      </span>
                                      <span className="flex flex-wrap gap-1.5">
                                        {pullRequestProgress(pr).map(({ label, ...status }) => {
                                          if (status.value === 'No update reported') return null;
                                          const text = label === 'CI' || status.value === 'Unknown' ? `${label} ${status.value.toLowerCase()}` : status.value;
                                          return <PullRequestStatusChip key={label} {...status} value={text} />;
                                        })}
                                      </span>
                                    </span>
                                    <ChevronRight aria-hidden="true" className="mt-1 size-4 text-muted-foreground group-hover:text-foreground" />
                                  </button>
                                );
                              })}
                            </section>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
              {canShowSnapshot && view === 'notifications' && projectLists.map(({ id, name, current }) => current?.error && (
                <Alert key={id} variant={current?.stale ? 'default' : 'destructive'}>
                  <AlertDescription>{name} · {messageFor(current.error, current.stale)}</AlertDescription>
                </Alert>
              ))}
              {canShowSnapshot && (waiting || loaded || notifications.length > 0) && projectLists.length > 0 && (view === 'overview' || view === 'notifications') && (
                <section aria-label="PR Notifications" className="flex min-w-0 flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" disabled={!tracker.canMarkRead || tracker.updatingReadStatus}
                        onClick={() => void tracker.markAllNotifications(true)}>
                        Mark all as read
                      </Button>
                      <Button variant="outline" size="sm" disabled={!tracker.canMarkUnread || tracker.updatingReadStatus}
                        onClick={() => void tracker.markAllNotifications(false)}>
                        Mark all as unread
                      </Button>
                    </div>
                  </div>
                  {notifications.length === 0 && (
                    <Empty>
                      <EmptyMedia><Bell /></EmptyMedia>
                      <EmptyDescription>{waiting ? 'Loading notifications…' : 'No PR notifications.'}</EmptyDescription>
                    </Empty>
                  )}
                  {notifications.length > 0 && (
                    <ul className="min-w-0 divide-y divide-border rounded-lg border border-border bg-surface">
                      {notifications.map((item) => (
                        <li key={`${item.repository}:${item.event.key}`} className="min-w-0 p-1">
                          <Button variant={item.event.read ? 'ghost' : 'secondary'} size="sm"
                            className="grid h-auto w-full min-w-0 grid-cols-[0.375rem_minmax(0,1fr)_auto] items-start gap-2 whitespace-normal py-2 text-left"
                            onClick={() => {
                              resume.current = undefined;
                              void tracker.showNotification(item);
                            }}>
                            <span aria-hidden="true" className="mt-1 size-1.5">
                              {!item.event.read && <span className="block size-full rounded-full bg-st-working" />}
                            </span>
                            <span className="flex min-w-0 flex-col gap-0.5 wrap-anywhere">
                              <span className="font-semibold">{item.event.kind} · #{item.event.number}</span>
                              <span>{item.event.title}</span>
                              <span className="text-xs font-normal text-muted-foreground">{item.projects.map((project) => project.name).join(', ')}</span>
                            </span>
                            <span className="flex flex-col items-end gap-1 whitespace-nowrap text-[11px] font-normal text-muted-foreground">
                              <NotificationTypeBadge kind={item.event.kind} />
                              <NotificationTime at={item.event.at} />
                              {!item.event.read && <span className="sr-only">Unread</span>}
                            </span>
                          </Button>
                          {choice?.event.key === item.event.key && choice.repository === item.repository && (
                            <div role="group" aria-label="Choose a project" className="flex flex-wrap gap-2 px-6 py-2">
                              {item.projects.map((project, i) => (
                                <Button key={project.id} ref={i === 0 ? destination : undefined} variant="outline" size="xs" onClick={() => void tracker.showNotification(item, project.id)}>
                                  {project.name}
                                </Button>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
