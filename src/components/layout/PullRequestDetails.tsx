import { forwardRef, type ComponentProps } from 'react';
import { Activity, ArrowDownToLine, ArrowLeft, ChevronRight, GitBranch, Check, CircleAlert, CircleHelp, Clock, ExternalLink, GitPullRequest, GitPullRequestDraft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PullRequestActivityFeedback, PullRequestCi, PullRequestDescription, PullRequestReview, PullRequestStatusChip, usePullRequestActivity } from './PullRequestActivity';

export interface PullRequest {
  number: number;
  title: string;
  role: 'authored' | 'requested';
  isDraft: boolean;
  reviewDecision: string | null;
  ci: string | null;
  mergeStateStatus: string;
  baseRefName: string;
  headRefName?: string | null;
  headRefOid?: string | null;
  updatedAt?: string | null;
}

type Status = ComponentProps<typeof PullRequestStatusChip>;

const unknown: Status = { value: 'Unknown', variant: 'muted', icon: CircleHelp };
const failed: Status = { value: 'Failed', variant: 'danger', icon: X };
const ciStatus: Record<string, Status> = {
  SUCCESS: { value: 'Passed', variant: 'success', icon: Check },
  FAILURE: failed,
  ERROR: failed,
  PENDING: { value: 'Running', variant: 'info', icon: Clock },
  EXPECTED: { value: 'Pending', variant: 'info', icon: Clock },
};

const reviewStatus: Record<string, Status> = {
  APPROVED: { value: 'Approved', variant: 'success', icon: Check },
  CHANGES_REQUESTED: { value: 'Changes requested', variant: 'warn', icon: CircleAlert },
  REVIEW_REQUIRED: { value: 'Review required', variant: 'info', icon: Clock },
};

export function pullRequestProgress(pr: PullRequest) {
  const state: Status = pr.isDraft
    ? { value: 'Draft', variant: 'muted', icon: GitPullRequestDraft }
    : { value: 'Open', variant: 'success', icon: GitPullRequest };
  const base: Status = pr.mergeStateStatus === 'BEHIND'
    ? { value: `Update from ${pr.baseRefName || 'base branch'}`, variant: 'warn', icon: ArrowDownToLine }
    : pr.mergeStateStatus === 'DIRTY'
      ? { value: 'Merge conflict', variant: 'danger', icon: CircleAlert }
      : pr.mergeStateStatus === 'UNKNOWN' ? unknown : { value: 'No update reported', variant: 'muted', icon: Check };
  return [
    { label: 'Status', ...state },
    { label: 'CI', ...(ciStatus[pr.ci ?? ''] ?? unknown) },
    { label: 'Review', ...(reviewStatus[pr.reviewDecision ?? ''] ?? unknown) },
    { label: 'Base branch', ...base },
  ];
}

const updatedFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

export function PullRequestUpdated({ updatedAt }: { updatedAt?: string | null }) {
  if (!updatedAt) return null;
  const date = new Date(updatedAt);
  if (!Number.isFinite(date.getTime())) return null;
  return <time dateTime={updatedAt}>Updated {updatedFormatter.format(date)}</time>;
}

export const PullRequestDetails = forwardRef<HTMLHeadingElement, {
  pull: PullRequest;
  repository: string;
  account: string;
  summaryUpdatedAt: number;
  onBack: () => void;
  onOpen: () => void;
}>(function PullRequestDetails({ pull, repository, account, summaryUpdatedAt, onBack, onOpen }, ref) {
  const activity = usePullRequestActivity(repository, pull.number, account);
  const current = activity.data?.data;
  const previousCommit = Boolean(current && pull.headRefOid && current.headSha !== pull.headRefOid && summaryUpdatedAt > activity.dataUpdatedAt);
  const ci = current?.checks.data && !previousCommit ? current.checks.data.state
    : current && pull.headRefOid && current.headSha !== pull.headRefOid ? null : pull.ci;
  return (
    <article aria-labelledby="pull-request-detail-title" className="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-4">
      <header className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-linear-to-br from-st-working/10 to-surface p-4">
        <p className="wrap-anywhere text-xs font-semibold text-git-rename-fg">{repository} · #{pull.number}</p>
        <h2 id="pull-request-detail-title" ref={ref} tabIndex={-1} className="wrap-anywhere text-xl leading-tight font-semibold outline-none">{pull.title}</h2>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex min-w-0 items-start gap-1.5 wrap-anywhere rounded-md bg-background px-2 py-1 text-foreground"><GitBranch aria-hidden="true" className="size-3.5 shrink-0" />{pull.headRefName || 'Unknown'} → {pull.baseRefName || 'Unknown'}</span>
          <span className="py-1"><PullRequestUpdated updatedAt={pull.updatedAt} /></span>
        </p>
      </header>
      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft data-icon="inline-start" />Back to list</Button>
        <Button variant="outline" size="sm" onClick={onOpen}>Open on GitHub<ExternalLink data-icon="inline-end" /></Button>
      </div>
      <section aria-label="Progress" className="min-w-0 rounded-lg border border-border bg-surface">
        <h3 className="flex items-center gap-2 px-4 py-3 text-sm font-semibold"><Activity aria-hidden="true" className="size-4 text-git-rename-fg" />Progress</h3>
        <ol className="flex min-w-0 flex-col px-4 pb-3">
          {pullRequestProgress({ ...pull, ci }).map(({ label, ...status }) => (
            <li key={label} className="relative flex min-w-0 flex-col gap-2 border-l border-border py-2 pl-4">
              <span aria-hidden="true" className="absolute top-4 left-0 size-2 -translate-x-1/2 rounded-full bg-st-working ring-2 ring-surface" />
              {label === 'CI' ? (
                <details className="min-w-0 rounded-md border border-border bg-background">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-st-working/5 [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-git-rename-fg [[open]>&]:rotate-90" />
                    <span className="font-medium">CI</span>
                    <PullRequestStatusChip {...status} />
                  </summary>
                  <div className="flex min-w-0 flex-col gap-2 border-t border-border p-3">
                    <PullRequestCi query={activity} previousCommit={previousCommit} />
                  </div>
                </details>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{label}</span>
                  <PullRequestStatusChip {...status} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>
      <PullRequestActivityFeedback query={activity} />
      <PullRequestReview query={activity} />
      <PullRequestDescription query={activity} />
    </article>
  );
});
