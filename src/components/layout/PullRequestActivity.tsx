import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { Check, ChevronRight, CircleAlert, CircleHelp, Clock, FileText, MessageSquareText, Minus, X, type LucideIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { errCode, errMsg, type ApiError } from '@/lib/api';
import { useUiStore } from '@/stores/useUiStore';
import type { ComponentProps, ReactNode } from 'react';

type Part<T> = { data?: T; error?: ApiError };
type CheckRun = { id: string; name?: string; context?: string; status?: string; state?: string; conclusion?: string | null; detailsUrl?: string; targetUrl?: string };
type Step = { number: number; name: string; status: string; conclusion: string | null };
type Job = Omit<Step, 'number'> & { id: number; steps?: Step[] | null };
type Workflow = Omit<Job, 'steps'> & { run_attempt: number; html_url: string; jobs: Part<Job[]> };
type Review = { id: number; body: string; submitted_at?: string; state?: string; user?: { login?: string } | null };
type Comment = { id: string; body: string; createdAt?: string; author?: { login?: string } | null };
type Thread = { id: string; path?: string; line?: number | null; originalLine?: number | null; isResolved: boolean; isOutdated: boolean; comments: Comment[] };
type Activity = {
  headSha: string;
  body: string;
  checks: Part<{ state: string | null; items: CheckRun[] }>;
  workflows: Part<Workflow[]>;
  reviews: Part<Review[]>;
  threads: Part<Thread[]>;
};

function keepWhileOffline<T>(part: Part<T>, old?: Part<T>): Part<T> {
  return part.error?.code === 'offline' ? { ...part, data: old?.data } : part;
}

export const pullRequestDetailKey = 'pull-request-detail';
const refreshInterval = 5_000;

export function usePullRequestActivity(repository: string, number: number, account: string) {
  const githubAccount = useUiStore((state) => state.githubAccount);
  const client = useQueryClient();
  const key = [pullRequestDetailKey, githubAccount, account, repository, number] as const;
  return useQuery({
    queryKey: key,
    queryFn: async ({ signal }): Promise<Part<Activity>> => {
      try {
        const fresh = await invoke<Activity>('pull_request_detail', { repository, number, githubAccount, expectedAccount: account });
        signal.throwIfAborted();
        if (!fresh) throw { code: 'unavailable', message: 'Details are unavailable.' };
        const old = client.getQueryData<Part<Activity>>(key)?.data;
        const previousCi = fresh.headSha === old?.headSha ? old : undefined;
        const workflows = keepWhileOffline(fresh.workflows, previousCi?.workflows);
        if (fresh.workflows.data) {
          workflows.data = fresh.workflows.data.map((run) => {
            const previous = previousCi?.workflows.data?.find((item) => item.id === run.id && item.run_attempt === run.run_attempt);
            return { ...run, jobs: keepWhileOffline(run.jobs, previous?.jobs) };
          });
        }
        return { data: {
          ...fresh, workflows, checks: keepWhileOffline(fresh.checks, previousCi?.checks),
          reviews: keepWhileOffline(fresh.reviews, old?.reviews), threads: keepWhileOffline(fresh.threads, old?.threads),
        } };
      } catch (error) {
        signal.throwIfAborted();
        if (errCode(error) === 'offline') throw error;
        return { error: { code: errCode(error) ?? 'unavailable', message: errMsg(error) } };
      }
    },
    staleTime: refreshInterval,
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: true,
    gcTime: 5 * 60_000,
    retry: false,
  });
}

export type ActivityQuery = ReturnType<typeof usePullRequestActivity>;

function safeUrl(value?: string) {
  if (!value) return;
  try {
    const url = new URL(value);
    if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password) return url.href;
  } catch {
    // Invalid or relative URL.
  }
}

function External({ url, children }: { url?: string; children: ReactNode }) {
  const href = safeUrl(url);
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="wrap-anywhere text-git-rename-fg underline">{children}</a> : null;
}

const markdownComponents: ComponentProps<typeof ReactMarkdown>['components'] = {
  a: ({ href, children }) => <>{safeUrl(href) ? <External url={href}>{children}</External> : children}</>,
  img: ({ alt }) => <>{alt}</>,
  table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
};

function PrMarkdown({ body }: { body: string }) {
  return (
    <div className="prose-hs min-w-0 wrap-anywhere [&_pre]:overflow-x-auto">
      <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} urlTransform={(url) => safeUrl(url) ?? ''} components={markdownComponents}>
        {body}
      </ReactMarkdown>
    </div>
  );
}

export function PullRequestStatusChip({ value, variant, icon: Icon }: { value: string; variant: ComponentProps<typeof Badge>['variant']; icon: LucideIcon }) {
  return (
    <Badge variant={variant} className="h-auto min-h-5 min-w-0 max-w-full shrink rounded-full font-sans font-medium whitespace-normal">
      <Icon aria-hidden="true" />
      <span className="min-w-0 wrap-anywhere">{value}</span>
    </Badge>
  );
}

type Chip = ComponentProps<typeof PullRequestStatusChip>;
const statuses: Record<string, Chip> = {
  success: { value: 'Passed', variant: 'success', icon: Check },
  failure: { value: 'Failed', variant: 'danger', icon: X },
  in_progress: { value: 'Running', variant: 'info', icon: Clock },
  queued: { value: 'Queued', variant: 'info', icon: Clock },
  pending: { value: 'Pending', variant: 'muted', icon: Clock },
  waiting: { value: 'Waiting', variant: 'warn', icon: Clock },
  skipped: { value: 'Skipped', variant: 'muted', icon: Minus },
  cancelled: { value: 'Cancelled', variant: 'muted', icon: Minus },
  neutral: { value: 'Neutral', variant: 'muted', icon: Minus },
  timed_out: { value: 'Timed out', variant: 'danger', icon: CircleAlert },
  action_required: { value: 'Action required', variant: 'warn', icon: CircleAlert },
  approved: { value: 'Approved', variant: 'success', icon: Check },
  changes_requested: { value: 'Changes requested', variant: 'warn', icon: CircleAlert },
  commented: { value: 'Commented', variant: 'info', icon: Minus },
  dismissed: { value: 'Dismissed', variant: 'muted', icon: Minus },
};
const unknown: Chip = { value: 'Unknown', variant: 'muted', icon: CircleHelp };

function chipFor(status?: string | null, conclusion?: string | null): Chip {
  const key = (conclusion || status)?.toLowerCase();
  if (key === 'error' || key === 'startup_failure') return statuses.failure;
  return key ? statuses[key] ?? unknown : unknown;
}

function Disclosure({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <details className="rounded-md border border-border bg-background">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-st-working/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 [[open]>&]:rotate-90" />
        {summary}
      </summary>
      <div className="flex min-w-0 flex-col gap-2 border-t border-border px-3 py-2">{children}</div>
    </details>
  );
}

function PartMessage({ error }: { error: ApiError }) {
  const message = error.code === 'access' ? 'GitHub permissions do not allow access to this section.' : error.message;
  return <Alert variant={error.code === 'offline' ? 'default' : 'destructive'}><AlertDescription>{message}</AlertDescription></Alert>;
}

function SectionMessage({ query, children }: { query: ActivityQuery; children: ReactNode }) {
  return (
    <>
      {query.isPending && <p role="status" className="text-sm text-muted-foreground">Loading details…</p>}
      {query.data?.error && <PartMessage error={query.data.error} />}
      {children}
    </>
  );
}

export function PullRequestActivityFeedback({ query }: { query: ActivityQuery }) {
  return (
    <>
      {query.isError && (
        <Alert>
          <AlertDescription>{query.data?.data ? 'Showing last known details. ' : ''}{errMsg(query.error)}</AlertDescription>
        </Alert>
      )}
      {query.isError || query.data?.error || query.data?.data ? (
        <div>
          <Button variant="outline" size="xs" onClick={() => void query.refetch()} disabled={query.isFetching}>
            {query.isFetching ? 'Refreshing details…' : 'Refresh details'}
          </Button>
        </div>
      ) : null}
    </>
  );
}

function jobSteps(job: Job) {
  return [...(job.steps ?? [])].sort((a, b) => a.number - b.number);
}

function JobProgress({ job }: { job: Job }) {
  const steps = jobSteps(job);
  const current = steps.findIndex((step) => step.status === 'in_progress');
  return (
    <Disclosure summary={
      <>
        <span className="min-w-0 wrap-anywhere font-medium">{job.name}</span>
        <PullRequestStatusChip {...chipFor(job.status, job.conclusion)} />
        {current >= 0 && <span className="min-w-0 wrap-anywhere text-muted-foreground">{steps[current].name} ({current + 1}/{steps.length})</span>}
      </>
    }>
      {steps.length === 0 && <p className="text-xs text-muted-foreground">Step details have not been reported.</p>}
      <ol className="flex flex-col gap-1">
        {steps.map((step) => (
          <li key={step.number} className="flex min-w-0 flex-wrap items-center gap-2 text-xs" aria-current={step.status === 'in_progress' ? 'step' : undefined}>
            <span className="min-w-0 wrap-anywhere">{step.name}</span>
            <PullRequestStatusChip {...chipFor(step.status, step.conclusion)} />
          </li>
        ))}
      </ol>
    </Disclosure>
  );
}

export function PullRequestCi({ query, previousCommit }: { query: ActivityQuery; previousCommit: boolean }) {
  const activity = query.data?.data;
  const checks = activity?.checks.data?.items ?? [];
  const workflows = activity?.workflows.data ?? [];
  return (
    <SectionMessage query={query}>
      {previousCommit && <p className="text-sm text-warn-fg">The CI details below are for a previous commit.</p>}
      {activity?.checks.error && <PartMessage error={activity.checks.error} />}
      {activity?.workflows.error && <PartMessage error={activity.workflows.error} />}
      {(activity?.checks.error && checks.length > 0 || activity?.workflows.error && workflows.length > 0) && (
        <p className="text-xs text-muted-foreground">Some CI details are from the last successful refresh.</p>
      )}
      {activity && !activity.checks.error && !activity.workflows.error && checks.length === 0 && workflows.length === 0 && (
        <p className="text-sm text-muted-foreground">No CI has been reported for this commit.</p>
      )}
      {(checks.length > 0 || workflows.length > 0) && <p className="text-xs text-muted-foreground">Commit {activity?.headSha.slice(0, 7)}</p>}
      {workflows.map((run) => (
        <Disclosure key={`${activity?.headSha}:${run.id}:${run.run_attempt}`} summary={
          <>
            <span className="min-w-0 wrap-anywhere font-medium">{run.name}</span>
            <Badge variant="muted">Attempt {run.run_attempt}</Badge>
            <PullRequestStatusChip {...chipFor(run.status, run.conclusion)} />
          </>
        }>
          <External url={run.html_url}>Open workflow run</External>
          {run.jobs.error && <PartMessage error={run.jobs.error} />}
          {run.jobs.error && run.jobs.data && <p className="text-xs text-muted-foreground">Showing last known jobs.</p>}
          {!run.jobs.error && !run.jobs.data?.length && <p className="text-xs text-muted-foreground">Jobs have not been reported for this attempt.</p>}
          {run.jobs.data?.map((job) => <JobProgress key={job.id} job={job} />)}
        </Disclosure>
      ))}
      {checks.length > 0 && (
        <Disclosure summary={<span>Checks ({checks.length})</span>}>
          {checks.map((check) => (
            <div key={check.id} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="min-w-0 wrap-anywhere">{check.name || check.context || 'Unnamed check'}</span>
              <PullRequestStatusChip {...chipFor(check.status || check.state, check.conclusion)} />
              <External url={check.detailsUrl || check.targetUrl}>Open check</External>
            </div>
          ))}
        </Disclosure>
      )}
    </SectionMessage>
  );
}

function Metadata({ author, date }: { author?: string; date?: string }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="min-w-0 wrap-anywhere">{author || 'Unknown author'}</span>
      {date && <time dateTime={date}>{new Date(date).toLocaleString('en')}</time>}
    </div>
  );
}

export function PullRequestReview({ query }: { query: ActivityQuery }) {
  const activity = query.data?.data;
  const threads = activity?.threads.data ?? [];
  const reviews = activity?.reviews.data ?? [];
  return (
    <section aria-labelledby="pr-review-title" className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <h3 id="pr-review-title" className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText aria-hidden="true" className="size-4 text-warn-fg" />Review Comments</h3>
      <SectionMessage query={query}>
        {activity?.threads.error && <PartMessage error={activity.threads.error} />}
        {activity?.reviews.error && <PartMessage error={activity.reviews.error} />}
        {(activity?.threads.error && threads.length > 0 || activity?.reviews.error && reviews.length > 0) && (
          <p className="text-xs text-muted-foreground">Some review comments are from the last successful refresh.</p>
        )}
        {activity && !activity.threads.error && !activity.reviews.error && threads.length === 0 && reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">No review comments yet.</p>
        )}
        {threads.map((thread) => {
          const line = thread.line ?? thread.originalLine;
          return (
            <Disclosure key={thread.id} summary={
              <>
                <span className="min-w-0 wrap-anywhere font-medium">{thread.path || 'Review thread'}{line ? `:${line}` : ''}</span>
                <Badge variant={thread.isResolved ? 'success' : 'warn'}>{thread.isResolved ? 'Resolved' : 'Unresolved'}</Badge>
                {thread.isOutdated && <Badge variant="muted">Outdated</Badge>}
                <span className="text-muted-foreground">{thread.comments.length} {thread.comments.length === 1 ? 'comment' : 'comments'}</span>
              </>
            }>
              {thread.comments.length === 0 && <p className="text-xs text-muted-foreground">No comments are available for this thread.</p>}
              {thread.comments.map((comment) => (
                <article key={comment.id} className="flex min-w-0 flex-col gap-1 border-l-2 border-st-working/30 pl-3">
                  <Metadata author={comment.author?.login} date={comment.createdAt} />
                  <PrMarkdown body={comment.body} />
                </article>
              ))}
            </Disclosure>
          );
        })}
        {reviews.length > 0 && <h4 className="text-xs font-semibold text-muted-foreground">Review summaries</h4>}
        {reviews.map((review) => (
          <article key={review.id} className="flex min-w-0 flex-col gap-2 rounded-md border border-border bg-background p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Metadata author={review.user?.login} date={review.submitted_at} />
              {review.state && <PullRequestStatusChip {...chipFor(review.state)} />}
            </div>
            <PrMarkdown body={review.body} />
          </article>
        ))}
      </SectionMessage>
    </section>
  );
}

export function PullRequestDescription({ query }: { query: ActivityQuery }) {
  const activity = query.data?.data;
  return (
    <section aria-labelledby="pr-description-title" className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <h3 id="pr-description-title" className="flex items-center gap-2 text-sm font-semibold"><FileText aria-hidden="true" className="size-4 text-git-rename-fg" />Description</h3>
      <SectionMessage query={query}>
        {activity && (activity.body.trim()
          ? <PrMarkdown body={activity.body} />
          : <p className="text-sm text-muted-foreground">This pull request has no description.</p>)}
      </SectionMessage>
    </section>
  );
}
