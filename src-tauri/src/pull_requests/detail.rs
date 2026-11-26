use super::{
    api, error, github_cli, graphql, repository_name, same_account, verify_viewer, GitHubCli,
    DETAILS_QUERY,
};
use crate::error::{AppError, AppResult};
use serde::Serialize;
use serde_json::{json, Value};
use std::sync::Arc;

#[derive(Serialize)]
#[serde(untagged)]
enum Part<T> {
    Ready { data: T },
    Unavailable { error: AppError },
}

impl<T> From<AppResult<T>> for Part<T> {
    fn from(result: AppResult<T>) -> Self {
        match result {
            Ok(data) => Self::Ready { data },
            Err(error) => Self::Unavailable { error },
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Detail {
    head_sha: String,
    body: String,
    checks: Part<CheckSnapshot>,
    workflows: Part<Vec<Value>>,
    reviews: Part<Vec<Value>>,
    threads: Part<Vec<Value>>,
}

#[derive(Serialize)]
struct CheckSnapshot {
    state: Option<String>,
    items: Vec<Value>,
}

fn unavailable() -> AppError {
    error("unavailable", "GitHub did not return the expected details.")
}

fn array(value: &Value) -> AppResult<&Vec<Value>> {
    value.as_array().ok_or_else(unavailable)
}

async fn rest_pages(gh: &GitHubCli, endpoint: &str, key: Option<&str>) -> AppResult<Vec<Value>> {
    let pages = api(gh, &[endpoint, "--paginate", "--slurp"]).await?;
    let mut items = Vec::new();
    for page in array(&pages)? {
        items.extend(array(key.map_or(page, |key| &page[key]))?.iter().cloned());
    }
    Ok(items)
}

async fn checks(
    gh: &GitHubCli,
    repo: &str,
    number: u64,
    account: &str,
    head: &str,
) -> AppResult<CheckSnapshot> {
    let field = format!("number={number}");
    let mut result = CheckSnapshot {
        state: None,
        items: Vec::new(),
    };
    for page in graphql(gh, repo, DETAILS_QUERY, &["-F", &field]).await? {
        verify_viewer(&page, account)?;
        let pull = &page["data"]["repository"]["pullRequest"];
        if pull["headRefOid"].as_str() != Some(head) {
            return Err(error(
                "changed",
                "The PR changed while CI was loading. Refresh to see the current checks.",
            ));
        }
        let rollup = &pull["statusCheckRollup"];
        if !rollup.is_null() {
            result.state = rollup["state"].as_str().map(str::to_owned);
            result.items.extend(
                array(&rollup["contexts"]["nodes"])?
                    .iter()
                    .filter(|check| !check.is_null())
                    .cloned(),
            );
        }
    }
    Ok(result)
}

fn is_current_run(run: &Value, head: &str, number: u64) -> bool {
    run["head_sha"].as_str() == Some(head)
        && run["pull_requests"].as_array().is_none_or(|prs| {
            prs.is_empty() || prs.iter().any(|pr| pr["number"].as_u64() == Some(number))
        })
}

async fn workflow_jobs(gh: &GitHubCli, repo: &str, mut run: Value) -> Value {
    let jobs = match (run["id"].as_u64(), run["run_attempt"].as_u64()) {
        (Some(id), Some(attempt)) => {
            let endpoint =
                format!("repos/{repo}/actions/runs/{id}/attempts/{attempt}/jobs?per_page=100");
            rest_pages(gh, &endpoint, Some("jobs")).await
        }
        _ => Err(unavailable()),
    };
    run["jobs"] = json!(Part::from(jobs));
    run
}

async fn workflows(gh: &GitHubCli, repo: &str, head: &str, number: u64) -> AppResult<Vec<Value>> {
    let endpoint = format!("repos/{repo}/actions/runs?head_sha={head}&per_page=100");
    let runs = rest_pages(gh, &endpoint, Some("workflow_runs")).await?;
    let runs: Vec<_> = runs
        .into_iter()
        .filter(|run| is_current_run(run, head, number))
        .collect();
    let mut results = Vec::with_capacity(runs.len());
    for batch in runs.chunks(6) {
        let mut jobs = tokio::task::JoinSet::new();
        for (index, run) in batch.iter().cloned().enumerate() {
            let gh = gh.clone();
            let repo = repo.to_owned();
            jobs.spawn(async move { (index, workflow_jobs(&gh, &repo, run).await) });
        }
        let mut batch = Vec::new();
        while let Some(item) = jobs.join_next().await {
            batch.push(item.map_err(|_| unavailable())?);
        }
        batch.sort_by_key(|(index, _)| *index);
        results.extend(batch.into_iter().map(|(_, run)| run));
    }
    Ok(results)
}

const THREADS_QUERY: &str = r#"
query($owner:String!, $name:String!, $number:Int!, $endCursor:String) {
  viewer { login }
  repository(owner:$owner,name:$name) {
    pullRequest(number:$number) {
      reviewThreads(first:100,after:$endCursor) {
        pageInfo { endCursor hasNextPage }
        nodes {
          id path line originalLine isResolved isOutdated
          comments(first:100) {
            totalCount
            nodes { id body createdAt author { login } }
          }
        }
      }
    }
  }
}"#;

const REPLIES_QUERY: &str = r#"
query($id:ID!, $endCursor:String) {
  viewer { login }
  node(id:$id) {
    ... on PullRequestReviewThread {
      comments(first:100,after:$endCursor) {
        pageInfo { endCursor hasNextPage }
        nodes { id body createdAt author { login } }
      }
    }
  }
}"#;

async fn threads(gh: &GitHubCli, repo: &str, number: u64, account: &str) -> AppResult<Vec<Value>> {
    let field = format!("number={number}");
    let mut result = Vec::new();
    for page in graphql(gh, repo, THREADS_QUERY, &["-F", &field]).await? {
        verify_viewer(&page, account)?;
        let nodes = &page["data"]["repository"]["pullRequest"]["reviewThreads"]["nodes"];
        for thread in array(nodes)? {
            let mut thread = thread.clone();
            let mut comments = array(&thread["comments"]["nodes"])?.clone();
            if thread["comments"]["totalCount"].as_u64().unwrap_or(0) > comments.len() as u64 {
                let query = format!("query={REPLIES_QUERY}");
                let id = format!("id={}", thread["id"].as_str().ok_or_else(unavailable)?);
                let pages = api(
                    gh,
                    &["graphql", "--paginate", "--slurp", "-f", &query, "-f", &id],
                )
                .await?;
                comments.clear();
                for page in array(&pages)? {
                    verify_viewer(page, account)?;
                    comments.extend(
                        array(&page["data"]["node"]["comments"]["nodes"])?
                            .iter()
                            .cloned(),
                    );
                }
            }
            comments.retain(|comment| !comment.is_null());
            comments.sort_by(|a, b| a["createdAt"].as_str().cmp(&b["createdAt"].as_str()));
            comments.dedup_by(|a, b| a["id"] == b["id"]);
            thread["comments"] = json!(comments);
            result.push(thread);
        }
    }
    result.sort_by_key(|thread| thread["isResolved"].as_bool().unwrap_or(false));
    Ok(result)
}

async fn selected_cli(selected: Option<&str>) -> AppResult<GitHubCli> {
    let mut gh = github_cli().await?.with_account(selected).await?;
    if gh.token.is_none() {
        // Pin credentials across requests, including when the active CLI login changes.
        let token = match std::env::var("GH_TOKEN")
            .ok()
            .filter(|s| !s.is_empty())
            .or_else(|| std::env::var("GITHUB_TOKEN").ok().filter(|s| !s.is_empty()))
        {
            Some(token) => token,
            None => {
                let mut cmd = gh.command();
                cmd.args(["auth", "token", "--hostname", "github.com"]);
                let output = super::command(cmd).await?;
                if !output.status.success() {
                    return Err(error(
                        "access",
                        "Sign in with GitHub CLI to read pull request details.",
                    ));
                }
                String::from_utf8(output.stdout).map_err(|_| unavailable())?
            }
        };
        if token.trim().is_empty() {
            return Err(error(
                "access",
                "Sign in with GitHub CLI to read pull request details.",
            ));
        }
        gh.token = Some(Arc::from(token.trim()));
    }
    Ok(gh)
}

fn head_sha(pull: &Value) -> AppResult<&str> {
    pull["head"]["sha"]
        .as_str()
        .filter(|sha| sha.len() == 40 && sha.bytes().all(|byte| byte.is_ascii_hexdigit()))
        .ok_or_else(unavailable)
}

async fn read_detail(gh: &GitHubCli, repo: &str, number: u64, account: &str) -> AppResult<Detail> {
    let endpoint = format!("repos/{repo}/pulls/{number}");
    let pull = api(gh, &[&endpoint]).await?;
    let head = head_sha(&pull)?;
    let review_endpoint = format!("{endpoint}/reviews?per_page=100");
    let (checks, workflows, reviews, threads) = tokio::join!(
        checks(gh, repo, number, account, head),
        workflows(gh, repo, head, number),
        rest_pages(gh, &review_endpoint, None),
        threads(gh, repo, number, account),
    );
    // Confirm access and the head after the independent requests finish.
    let latest = api(gh, &[&endpoint]).await?;
    let latest_head = head_sha(&latest)?;
    let (checks, workflows) = if latest_head == head {
        (checks, workflows)
    } else {
        let changed = || {
            error(
                "changed",
                "The PR changed while CI was loading. Refresh to see its current progress.",
            )
        };
        (Err(changed()), Err(changed()))
    };
    Ok(Detail {
        head_sha: latest_head.to_owned(),
        body: latest["body"].as_str().unwrap_or_default().to_owned(),
        checks: checks.into(),
        workflows: workflows.into(),
        reviews: reviews
            .map(|reviews| {
                reviews
                    .into_iter()
                    .filter(|review| {
                        review["state"].as_str() != Some("PENDING")
                            && review["body"]
                                .as_str()
                                .is_some_and(|body| !body.trim().is_empty())
                    })
                    .collect()
            })
            .into(),
        threads: threads.into(),
    })
}

#[tauri::command]
pub async fn pull_request_detail(
    repository: String,
    number: u64,
    github_account: Option<String>,
    expected_account: String,
) -> AppResult<Detail> {
    let repo = repository_name(&repository)
        .filter(|_| number > 0 && number <= i32::MAX as u64)
        .ok_or_else(|| error("repository", "Invalid pull request."))?;
    let gh = selected_cli(github_account.as_deref()).await?;
    let identity = api(&gh, &["user"]).await?;
    if !same_account(&identity["login"], &expected_account) {
        return Err(error(
            "access",
            "GitHub CLI account changed. Refresh Pull Requests to continue.",
        ));
    }
    read_detail(&gh, &repo, number, &expected_account).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{fs, os::unix::fs::PermissionsExt};

    const HEAD: &str = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    #[tokio::test]
    async fn reads_current_attempt_and_paginates_review_replies() {
        let fixture = tempfile::tempdir().unwrap();
        let root = fixture.path();
        let executable = root.join("gh");
        fs::write(
            &executable,
            r#"#!/bin/sh
cd "$(dirname "$0")" || exit 1
case "$*" in
  *reviewThreads*) cat threads ;;
  *PullRequestReviewThread*) cat replies ;;
  *statusCheckRollup*) cat checks ;;
  *repos/me/repo/pulls/4/reviews*) cat reviews ;;
  *repos/me/repo/pulls/4) cat pull ;;
  *'head_sha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'*) cat runs ;;
  *repos/me/repo/actions/runs/20/attempts/2/jobs*) cat jobs ;;
  *) exit 1 ;;
esac
"#,
        )
        .unwrap();
        fs::set_permissions(&executable, fs::Permissions::from_mode(0o700)).unwrap();
        let write = |file: &str, data: Value| fs::write(root.join(file), data.to_string()).unwrap();
        write(
            "pull",
            json!({"head":{"sha":HEAD},"body":"# PR description"}),
        );
        write(
            "checks",
            json!([{"data":{"viewer":{"login":"dev"},"repository":{"pullRequest":{
                "headRefOid":HEAD, "statusCheckRollup":{"state":"PENDING","contexts":{"nodes":[{"id":"check","context":"Lint","state":"SUCCESS"}]}}
            }}}}]),
        );
        write(
            "reviews",
            json!([[{"id":1,"body":"Review summary","state":"APPROVED"},{"id":2,"body":"Draft","state":"PENDING"}]]),
        );
        write(
            "threads",
            json!([{"data":{"viewer":{"login":"dev"},"repository":{"pullRequest":{"reviewThreads":{"nodes":[
                {"id":"resolved","isResolved":true,"comments":{"totalCount":0,"nodes":[]}},
                {"id":"open","isResolved":false,"comments":{"totalCount":2,"nodes":[{"id":"first","createdAt":"2026-11-26T02:03:00Z"}]}}
            ]}}}}}]),
        );
        write(
            "replies",
            json!([
                {"data":{"viewer":{"login":"dev"},"node":{"comments":{"nodes":[{"id":"first","createdAt":"2026-11-26T02:03:00Z"}]}}}},
                {"data":{"viewer":{"login":"dev"},"node":{"comments":{"nodes":[{"id":"second","createdAt":"2026-11-26T02:04:00Z"}]}}}}
            ]),
        );
        write(
            "runs",
            json!([{"workflow_runs":[
                {"id":20,"run_attempt":2,"head_sha":HEAD,"pull_requests":[{"number":4}]},
                {"id":21,"run_attempt":1,"head_sha":"older","pull_requests":[{"number":4}]},
                {"id":22,"run_attempt":1,"head_sha":HEAD,"pull_requests":[{"number":5}]}
            ]}]),
        );
        write(
            "jobs",
            json!([{"jobs":[{"id":10,"steps":[{"number":1,"name":"Unit tests","status":"in_progress"}]}]},
                             {"jobs":[{"id":11,"steps":[{"number":1,"name":"Integration tests","status":"in_progress"}]}]}]),
        );
        let gh = GitHubCli {
            path: executable,
            token: None,
        };
        let detail = json!(read_detail(&gh, "me/repo", 4, "dev").await.unwrap());
        assert_eq!(detail["headSha"], HEAD);
        assert_eq!(detail["checks"]["data"]["items"][0]["context"], "Lint");
        assert_eq!(detail["workflows"]["data"].as_array().unwrap().len(), 1);
        assert_eq!(detail["workflows"]["data"][0]["run_attempt"], 2);
        let jobs = &detail["workflows"]["data"][0]["jobs"]["data"];
        assert_eq!(jobs[0]["steps"][0]["name"], "Unit tests");
        assert_eq!(jobs[1]["steps"][0]["name"], "Integration tests");
        assert_eq!(detail["threads"]["data"][0]["comments"][1]["id"], "second");
        assert_eq!(detail["threads"]["data"][1]["id"], "resolved");
        assert_eq!(detail["reviews"]["data"].as_array().unwrap().len(), 1);
    }
}
