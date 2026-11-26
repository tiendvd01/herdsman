use crate::{
    error::{AppError, AppResult},
    state::AppState,
    store,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::{BTreeMap, BTreeSet},
    sync::Arc,
    time::Duration,
};
use tauri::State;
use tokio::process::Command;

pub mod detail;

#[derive(Default)]
pub struct PullRequests(tokio::sync::Mutex<()>);

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct PullRequest {
    number: u64,
    title: String,
    state: String,
    is_draft: bool,
    review_decision: Option<String>,
    merge_state_status: String,
    base_ref_name: String,
    head_ref_name: Option<String>,
    head_ref_oid: Option<String>,
    updated_at: Option<String>,
    #[serde(default)]
    ci: Option<String>,
    #[serde(default)]
    role: String,
}

#[derive(Clone, Deserialize, Serialize)]
struct Notification {
    key: String,
    number: u64,
    title: String,
    kind: String,
    read: bool,
    at: String,
}

#[derive(Clone, Default, Deserialize, Serialize)]
struct Snapshot {
    since: String,
    pulls: BTreeMap<u64, PullRequest>,
    behind: BTreeSet<u64>,
    notifications: BTreeMap<String, Notification>,
}

fn error(code: &str, message: &str) -> AppError {
    AppError::new(code, message)
}

fn repository_name(value: &str) -> Option<String> {
    let (owner, repo) = value.split_once('/')?;
    let valid = |part: &str| {
        !part.is_empty()
            && part != "."
            && part != ".."
            && part
                .bytes()
                .all(|ch| ch.is_ascii_alphanumeric() || b"-_.".contains(&ch))
    };
    (valid(owner) && valid(repo)).then(|| value.to_ascii_lowercase())
}

fn origin_repo(origin: &str) -> Option<(&str, String)> {
    let origin = origin.trim();
    let (host, path) = if let Some(path) = origin.strip_prefix("https://github.com/") {
        ("github.com", path)
    } else if let Some(rest) = origin.strip_prefix("ssh://git@") {
        rest.split_once('/')?
    } else {
        origin.strip_prefix("git@")?.split_once(':')?
    };
    if !host.as_bytes().first()?.is_ascii_alphanumeric()
        || !host
            .bytes()
            .all(|ch| ch.is_ascii_alphanumeric() || b"-_.".contains(&ch))
    {
        return None;
    }
    let repo = repository_name(path.strip_suffix(".git").unwrap_or(path))?;
    Some((host, repo))
}

async fn is_github_host(host: &str) -> bool {
    if host.eq_ignore_ascii_case("github.com") {
        return true;
    }

    let mut ssh = Command::new("ssh");
    ssh.args(["-G", "-l", "git", "--", host]);
    let Ok(output) = command(ssh).await else {
        return false;
    };
    output.status.success()
        && String::from_utf8_lossy(&output.stdout).lines().any(|line| {
            line.strip_prefix("hostname ")
                .is_some_and(|name| name.trim().eq_ignore_ascii_case("github.com"))
        })
}

async fn command(mut command: Command) -> AppResult<std::process::Output> {
    command.kill_on_drop(true);
    tokio::time::timeout(Duration::from_secs(20), command.output())
        .await
        .map_err(|_| error("offline", "GitHub request timed out."))?
        .map_err(|_| error("unavailable", "Could not run a required command."))
}

async fn discover(path: &str) -> Option<String> {
    let mut git = Command::new("git");
    // Let Git apply includes and url.*.insteadOf before resolving any SSH alias.
    git.args(["-C", path, "remote", "get-url", "origin"]);
    let result = command(git).await.ok()?;
    if !result.status.success() {
        return None;
    }
    let (host, repo) = origin_repo(std::str::from_utf8(&result.stdout).ok()?)?;
    is_github_host(host).await.then_some(repo)
}

#[derive(Clone)]
struct GitHubCli {
    path: std::path::PathBuf,
    token: Option<Arc<str>>,
}

impl GitHubCli {
    fn command(&self) -> Command {
        let mut cmd = Command::new(&self.path);
        cmd.env("GH_PROMPT_DISABLED", "1")
            .env("GH_NO_UPDATE_NOTIFIER", "1");
        if let Some(token) = &self.token {
            cmd.env("GH_TOKEN", token.as_ref());
        }
        cmd
    }

    async fn with_account(mut self, account: Option<&str>) -> AppResult<Self> {
        let Some(account) = account else {
            return Ok(self);
        };
        let mut cmd = self.command();
        cmd.args([
            "auth",
            "token",
            "--hostname",
            "github.com",
            "--user",
            account,
        ])
        .env_remove("GH_TOKEN")
        .env_remove("GITHUB_TOKEN");
        let output = command(cmd).await?;
        let token = std::str::from_utf8(&output.stdout)
            .unwrap_or_default()
            .trim();
        if !output.status.success() || token.is_empty() {
            return Err(error(
                "access",
                "Sign in with GitHub CLI or choose another account in Settings → GitHub.",
            ));
        }
        self.token = Some(Arc::from(token));
        Ok(self)
    }
}

async fn github_cli() -> AppResult<GitHubCli> {
    let path = tokio::task::spawn_blocking(|| crate::hc::which_in_login_shell("gh"))
        .await
        .ok()
        .flatten()
        .or_else(|| {
            std::env::split_paths(&std::env::var_os("PATH")?)
                .map(|path| path.join("gh"))
                .find(|path| path.is_file())
        })
        .ok_or_else(|| {
            error(
                "unavailable",
                "Install GitHub CLI and sign in with gh auth login.",
            )
        })?;
    Ok(GitHubCli { path, token: None })
}

#[tauri::command]
pub async fn github_accounts() -> AppResult<Vec<String>> {
    let mut cmd = github_cli().await?.command();
    cmd.args([
        "auth",
        "status",
        "--hostname",
        "github.com",
        "--json",
        "hosts",
    ])
    .env_remove("GH_TOKEN")
    .env_remove("GITHUB_TOKEN");
    let output = command(cmd).await?;
    if !output.status.success() {
        return Err(error(
            "access",
            "Could not list GitHub accounts. Check GitHub CLI and try again.",
        ));
    }
    let status: Value = serde_json::from_slice(&output.stdout)?;
    let mut accounts = status["hosts"]["github.com"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|account| account["login"].as_str().map(str::to_owned))
        .collect::<Vec<_>>();
    accounts.sort_unstable();
    accounts.dedup();
    Ok(accounts)
}

async fn api(gh: &GitHubCli, args: &[&str]) -> AppResult<Value> {
    let mut cmd = gh.command();
    cmd.args(["api", "--hostname", "github.com"]).args(args);
    let output = command(cmd).await?;
    if !output.status.success() {
        let message = String::from_utf8_lossy(&output.stderr);
        if message.contains("gh auth login")
            || message.contains("HTTP 404")
            || message.contains("HTTP 401")
            || message.contains("HTTP 403") && !message.to_lowercase().contains("rate limit")
            || message.contains("Could not resolve to a Repository")
            || message.contains("Resource not accessible")
        {
            return Err(error("access", "GitHub access is unavailable. Check your GitHub CLI sign-in and repository permissions."));
        }
        return Err(error(
            "offline",
            "Could not refresh from GitHub. Try again shortly.",
        ));
    }
    Ok(serde_json::from_slice(&output.stdout)?)
}

const PULLS_QUERY: &str = r#"
query($owner:String!, $name:String!, $endCursor:String) {
  viewer { login }
  repository(owner:$owner,name:$name) {
    pullRequests(states:OPEN,first:50,after:$endCursor) {
      pageInfo { endCursor hasNextPage }
      nodes {
        number title state isDraft reviewDecision mergeStateStatus baseRefName
        author { login }
        reviewRequests(first:100) { nodes { requestedReviewer { ... on User { login } } } }
      }
    }
  }
}"#;

const DETAILS_QUERY: &str = r#"
query($owner:String!, $name:String!, $number:Int!, $endCursor:String) {
  viewer { login }
  repository(owner:$owner,name:$name) {
    pullRequest(number:$number) {
      number title state isDraft reviewDecision mergeStateStatus baseRefName headRefName updatedAt headRefOid
      statusCheckRollup {
        state
        contexts(first:100,after:$endCursor) {
          pageInfo { endCursor hasNextPage }
          nodes {
            ... on CheckRun { id name detailsUrl status conclusion completedAt }
            ... on StatusContext { id context targetUrl state createdAt }
          }
        }
      }
    }
  }
}"#;

async fn graphql(
    gh: &GitHubCli,
    repo: &str,
    query: &str,
    fields: &[&str],
) -> AppResult<Vec<Value>> {
    let (owner, name) = repo
        .split_once('/')
        .ok_or_else(|| error("repository", "Invalid repository."))?;
    let query = format!("query={query}");
    let owner = format!("owner={owner}");
    let name = format!("name={name}");
    let mut args = vec![
        "graphql",
        "--paginate",
        "--slurp",
        "-f",
        &query,
        "-f",
        &owner,
        "-f",
        &name,
    ];
    args.extend_from_slice(fields);
    Ok(serde_json::from_value(api(gh, &args).await?)?)
}

fn same_account(value: &Value, account: &str) -> bool {
    value
        .as_str()
        .is_some_and(|login| login.eq_ignore_ascii_case(account))
}

fn verify_viewer(page: &Value, account: &str) -> AppResult<()> {
    if !same_account(&page["data"]["viewer"]["login"], account) {
        return Err(error(
            "access",
            "GitHub CLI account changed. Refresh to continue.",
        ));
    }
    Ok(())
}

fn notify(snapshot: &mut Snapshot, pr: &PullRequest, key: String, kind: &str, at: &str) {
    snapshot
        .notifications
        .entry(key.clone())
        .or_insert_with(|| Notification {
            key,
            number: pr.number,
            title: pr.title.clone(),
            kind: kind.into(),
            read: false,
            at: at.into(),
        });
}

fn add_activity(snapshot: &mut Snapshot, pr: &PullRequest, node: &Value, account: &str) {
    let Some(at) = node["submitted_at"]
        .as_str()
        .or_else(|| node["created_at"].as_str())
    else {
        return;
    };
    if at < snapshot.since.as_str() {
        return;
    }
    let kind = match node["event"].as_str() {
        Some("commented") | Some("inline_comment") => "New comment",
        Some("reviewed")
            if node["state"]
                .as_str()
                .is_some_and(|state| state.eq_ignore_ascii_case("approved")) =>
        {
            "Approved"
        }
        Some("reviewed")
            if node["state"]
                .as_str()
                .is_some_and(|state| !state.eq_ignore_ascii_case("pending")) =>
        {
            "New review"
        }
        Some("review_requested") if same_account(&node["requested_reviewer"]["login"], account) => {
            "Review requested"
        }
        _ => return,
    };
    let Some(id) = node["node_id"]
        .as_str()
        .map(str::to_owned)
        .or_else(|| node["id"].as_u64().map(|id| id.to_string()))
    else {
        return;
    };
    notify(
        snapshot,
        pr,
        format!(
            "{}:{}:{id}",
            pr.number,
            node["event"].as_str().unwrap_or_default()
        ),
        kind,
        at,
    );
}

async fn activity(
    gh: &GitHubCli,
    repo: &str,
    pr: &PullRequest,
    snapshot: &mut Snapshot,
    account: &str,
) -> AppResult<()> {
    let timeline = format!("repos/{repo}/issues/{}/timeline?per_page=100", pr.number);
    let comments = format!(
        "repos/{repo}/pulls/{}/comments?per_page=100&since={}",
        pr.number, snapshot.since
    );
    let timeline_args = [timeline.as_str(), "--paginate", "--slurp"];
    let comment_args = [comments.as_str(), "--paginate", "--slurp"];
    let (timeline, comments) = tokio::try_join!(api(gh, &timeline_args), api(gh, &comment_args))?;
    for node in serde_json::from_value::<Vec<Vec<Value>>>(timeline)?
        .iter()
        .flatten()
    {
        add_activity(snapshot, pr, node, account);
    }
    for mut node in serde_json::from_value::<Vec<Vec<Value>>>(comments)?
        .into_iter()
        .flatten()
    {
        node["event"] = Value::String("inline_comment".into());
        add_activity(snapshot, pr, &node, account);
    }
    Ok(())
}

async fn remote_snapshot(
    gh: &GitHubCli,
    repo: &str,
    account: &str,
    mut snapshot: Snapshot,
    now: &str,
) -> AppResult<Snapshot> {
    let initial = snapshot.since.is_empty();
    let mut roles = BTreeMap::new();
    for page in graphql(gh, repo, PULLS_QUERY, &[]).await? {
        verify_viewer(&page, account)?;
        let list = &page["data"]["repository"]["pullRequests"]["nodes"];
        for node in serde_json::from_value::<Vec<Value>>(list.clone())? {
            let Some(number) = node["number"].as_u64() else {
                continue;
            };
            if same_account(&node["author"]["login"], account) {
                roles.insert(number, "authored");
            } else if node["reviewRequests"]["nodes"]
                .as_array()
                .is_some_and(|nodes| {
                    nodes.iter().any(|request| {
                        same_account(&request["requestedReviewer"]["login"], account)
                    })
                })
            {
                roles.insert(number, "requested");
            }
        }
    }
    let tracked: BTreeSet<u64> = roles.keys().chain(snapshot.pulls.keys()).copied().collect();
    let mut pulls = BTreeMap::new();
    for number in tracked {
        let field = format!("number={number}");
        let pages = graphql(gh, repo, DETAILS_QUERY, &["-F", &field]).await?;
        let Some(first) = pages.first() else {
            continue;
        };
        let data = &first["data"]["repository"]["pullRequest"];
        if data.is_null() {
            continue;
        }
        for page in &pages {
            verify_viewer(page, account)?;
        }
        let mut pr: PullRequest = serde_json::from_value(data.clone())?;
        pr.role = roles.get(&number).copied().unwrap_or_default().into();
        pr.ci = data["statusCheckRollup"]["state"]
            .as_str()
            .map(str::to_owned);
        if !initial {
            activity(gh, repo, &pr, &mut snapshot, account).await?;
        }
        for page in &pages {
            let nodes = &page["data"]["repository"]["pullRequest"]["statusCheckRollup"]["contexts"]
                ["nodes"];
            for check in nodes.as_array().into_iter().flatten() {
                let failed = matches!(
                    check["conclusion"]
                        .as_str()
                        .or_else(|| check["state"].as_str()),
                    Some("FAILURE" | "ERROR" | "TIMED_OUT" | "STARTUP_FAILURE" | "ACTION_REQUIRED")
                );
                let completed = check["completedAt"]
                    .as_str()
                    .or_else(|| check["createdAt"].as_str());
                if !initial && failed && completed.is_some_and(|at| at >= snapshot.since.as_str()) {
                    if let Some(id) = check["id"].as_str() {
                        notify(
                            &mut snapshot,
                            &pr,
                            format!("{number}:check:{id}"),
                            "CI failed",
                            completed.unwrap_or(now),
                        );
                    }
                }
            }
        }
        if pr.merge_state_status == "BEHIND" {
            if snapshot.behind.insert(number) && snapshot.pulls.contains_key(&number) {
                notify(
                    &mut snapshot,
                    &pr,
                    format!("{number}:behind:{now}"),
                    "Base branch update required",
                    now,
                );
            }
        } else if pr.merge_state_status != "UNKNOWN" {
            snapshot.behind.remove(&number);
        }
        if !pr.role.is_empty() && pr.state == "OPEN" {
            pulls.insert(number, pr);
        } else {
            snapshot.behind.remove(&number);
        }
    }
    snapshot.pulls = pulls;
    snapshot.since = now.into();
    Ok(snapshot)
}

fn snapshot_key(account: &str, repo: &str) -> String {
    format!("pull_requests:{account}:{repo}")
}

fn cached(st: &AppState, key: &str) -> AppResult<Option<Snapshot>> {
    store::setting_get(&st.db.lock(), key)?
        .map(|raw| serde_json::from_str(&raw).map_err(Into::into))
        .transpose()
}

fn now() -> String {
    chrono::DateTime::from_timestamp_millis(store::now_ms())
        .expect("system time within supported range")
        .format("%Y-%m-%dT%H:%M:%SZ")
        .to_string()
}

#[tauri::command]
pub async fn pull_requests_refresh(
    st: State<'_, Arc<AppState>>,
    tracker: State<'_, PullRequests>,
    github_account: Option<String>,
) -> AppResult<Value> {
    let _guard = tracker.0.lock().await;
    let projects = store::project_list(&st.db.lock())?;
    if projects.is_empty() {
        return Ok(serde_json::json!({"projects": {}, "notifications": []}));
    }
    let mut groups = BTreeMap::<String, Vec<_>>::new();
    let mut results = serde_json::Map::new();
    for project in projects {
        if let Some(repo) = discover(&project.path).await {
            groups.entry(repo).or_default().push(project);
        } else {
            results.insert(
                project.id,
                serde_json::json!({
                    "error": "This project needs a GitHub origin.", "pulls": []
                }),
            );
        }
    }
    if groups.is_empty() {
        return Ok(serde_json::json!({"projects": results, "notifications": []}));
    }
    let gh = github_cli()
        .await?
        .with_account(github_account.as_deref())
        .await?;
    let identity = api(&gh, &["user"]).await?;
    let account = identity["login"]
        .as_str()
        .ok_or_else(|| error("access", "Sign in with gh auth login."))?
        .to_ascii_lowercase();
    if github_account
        .as_deref()
        .is_some_and(|selected| !account.eq_ignore_ascii_case(selected))
    {
        return Err(error(
            "access",
            "GitHub CLI returned a different account. Check Settings → GitHub.",
        ));
    }
    let mut jobs = tokio::task::JoinSet::new();
    for (repo, projects) in groups {
        let gh = gh.clone();
        let account = account.clone();
        let st = Arc::clone(&st);
        jobs.spawn(async move {
            let key = snapshot_key(&account, &repo);
            let old = cached(&st, &key)?;
            let refresh = remote_snapshot(
                &gh,
                &repo,
                &account,
                old.clone().unwrap_or_default(),
                &now(),
            )
            .await;
            let (snapshot, issue) = match refresh {
                Ok(snapshot) => {
                    store::setting_set(&st.db.lock(), &key, &serde_json::to_string(&snapshot)?)?;
                    (Some(snapshot), None)
                }
                Err(issue) if issue.code == "offline" => (old, Some(issue.message)),
                Err(issue) => (None, Some(issue.message)),
            };
            Ok::<_, AppError>((repo, projects, snapshot, issue))
        });
    }
    let mut notifications = Vec::new();
    while let Some(result) = jobs.join_next().await {
        let (repo, projects, snapshot, issue) =
            result.map_err(|_| error("unavailable", "Could not refresh Pull Requests."))??;
        let pulls: Vec<_> = snapshot
            .iter()
            .flat_map(|state| state.pulls.values())
            .collect();
        for project in &projects {
            results.insert(
                project.id.clone(),
                serde_json::json!({"repository": repo, "error": issue, "stale": issue.is_some() && snapshot.is_some(), "pulls": pulls}),
            );
        }
        let destinations: Vec<_> = projects
            .iter()
            .map(|p| serde_json::json!({"id": p.id, "name": p.name}))
            .collect();
        for notification in snapshot
            .iter()
            .flat_map(|state| state.notifications.values())
        {
            notifications.push(serde_json::json!({"repository": repo, "event": notification, "projects": destinations}));
        }
    }
    let changed_account = match api(&gh, &["user"]).await {
        Ok(identity) => !same_account(&identity["login"], &account),
        Err(issue) if issue.code == "offline" => false,
        Err(issue) => return Err(issue),
    };
    if changed_account {
        return Err(error(
            "access",
            "GitHub CLI account changed. Refresh to continue.",
        ));
    }
    notifications.sort_by(|a, b| {
        b["event"]["at"]
            .as_str()
            .cmp(&a["event"]["at"].as_str())
            .then_with(|| a["event"]["key"].as_str().cmp(&b["event"]["key"].as_str()))
    });
    Ok(serde_json::json!({"account": account, "projects": results, "notifications": notifications}))
}

#[tauri::command]
pub async fn pull_requests_read(
    st: State<'_, Arc<AppState>>,
    tracker: State<'_, PullRequests>,
    account: String,
    repository: String,
    event_key: String,
) -> AppResult<()> {
    let _guard = tracker.0.lock().await;
    let key = snapshot_key(&account, &repository);
    if let Some(mut snapshot) = cached(&st, &key)? {
        if let Some(notification) = snapshot.notifications.get_mut(&event_key) {
            notification.read = true;
            store::setting_set(&st.db.lock(), &key, &serde_json::to_string(&snapshot)?)?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn pull_request_open(repository: String, number: u64) -> AppResult<()> {
    let repo = repository_name(&repository)
        .filter(|_| number > 0)
        .ok_or_else(|| error("repository", "Invalid pull request link."))?;
    let launcher = if cfg!(target_os = "macos") {
        "open"
    } else {
        "xdg-open"
    };
    let mut cmd = Command::new(launcher);
    cmd.arg(format!("https://github.com/{repo}/pull/{number}"));
    if command(cmd).await?.status.success() {
        Ok(())
    } else {
        Err(error(
            "unavailable",
            "Could not open the pull request in your browser.",
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::path::Path;

    #[test]
    fn validates_origins_and_browser_paths() {
        assert_eq!(
            origin_repo("git@github.com:Org/Repo.git"),
            Some(("github.com", "org/repo".into()))
        );
        assert_eq!(
            origin_repo("https://github.com/Org/Repo.git"),
            Some(("github.com", "org/repo".into()))
        );
        for origin in [
            "git@github-soratech:Org/Repo.git",
            "ssh://git@github-soratech/Org/Repo.git",
        ] {
            assert_eq!(
                origin_repo(origin),
                Some(("github-soratech", "org/repo".into()))
            );
        }
        for invalid in [
            "git@-G:Org/Repo",
            "git@github.com;command:Org/Repo",
            "https://github.com.evil/Org/Repo",
            "https://github.com/Org/..",
            "https://github.com/user@evil/Repo",
            "https://github.com/Org/Repo?query",
            "https://github.com/Org/Repo/extra",
        ] {
            assert_eq!(origin_repo(invalid), None);
        }
        assert_ne!(snapshot_key("a", "org/repo"), snapshot_key("b", "org/repo"));
    }

    #[tokio::test]
    async fn discovers_origin_after_git_config_rewrite() {
        let repo = tempfile::tempdir().unwrap();
        async fn git(path: &Path, args: &[&str]) {
            let mut git = Command::new("git");
            git.arg("-C").arg(path).args(args);
            assert!(command(git).await.unwrap().status.success());
        }

        git(repo.path(), &["init", "--quiet"]).await;
        git(
            repo.path(),
            &[
                "remote",
                "add",
                "origin",
                "git@herdsman-config-test:Org/Repo.git",
            ],
        )
        .await;
        git(
            repo.path(),
            &[
                "config",
                "--local",
                "url.https://github.com/.insteadOf",
                "git@herdsman-config-test:",
            ],
        )
        .await;

        assert_eq!(
            discover(repo.path().to_str().unwrap()).await.as_deref(),
            Some("org/repo")
        );
    }

    #[test]
    fn activity_deduplicates_after_reopening_and_preserves_read_status() {
        let mut snapshot = Snapshot {
            since: "2026-11-26T00:00:00Z".into(),
            ..Default::default()
        };
        let pr: PullRequest = serde_json::from_value(json!({
            "number": 1, "title": "Change", "state": "OPEN", "isDraft": false,
            "reviewDecision": null, "mergeStateStatus": "CLEAN", "baseRefName": "main"
        }))
        .unwrap();
        assert!(pr.head_ref_name.is_none());
        assert!(pr.updated_at.is_none());
        let at = "2026-11-26T00:00:01Z";
        let events = [
            json!({"event": "commented", "id": 1, "created_at": at}),
            json!({"event": "inline_comment", "id": 1, "created_at": at}),
            json!({"event": "reviewed", "id": 2, "state": "approved", "submitted_at": at}),
            json!({"event": "reviewed", "id": 3, "state": "changes_requested", "submitted_at": at}),
            json!({"event": "review_requested", "id": 4, "requested_reviewer": {"login": "ME"}, "created_at": at}),
            json!({"event": "review_requested", "id": 5, "requested_reviewer": {"login": "other"}, "created_at": at}),
            json!({"event": "commented", "id": 6, "created_at": "2026-11-25T00:00:00Z"}),
        ];
        for event in &events {
            add_activity(&mut snapshot, &pr, event, "me");
        }
        let key = "1:reviewed:2";
        assert_eq!(snapshot.notifications.len(), 5);
        assert_eq!(snapshot.notifications[key].kind, "Approved");
        snapshot.notifications.get_mut(key).unwrap().read = true;
        let file = tempfile::tempdir().unwrap();
        let path = file.path().join("herdsman.sqlite");
        let key_name = snapshot_key("me", "org/repo");
        {
            let db = store::open(&path).unwrap();
            store::setting_set(&db, &key_name, &serde_json::to_string(&snapshot).unwrap()).unwrap();
        }
        let db = store::open(&path).unwrap();
        let mut reopened: Snapshot =
            serde_json::from_str(&store::setting_get(&db, &key_name).unwrap().unwrap()).unwrap();
        for event in &events {
            add_activity(&mut reopened, &pr, event, "me");
        }
        assert_eq!(reopened.notifications.len(), 5);
        assert!(reopened.notifications[key].read);
        add_activity(
            &mut reopened,
            &pr,
            &json!({"event": "review_requested", "id": 7, "requested_reviewer": {"login": "ME"}, "created_at": at}),
            "me",
        );
        assert_eq!(reopened.notifications.len(), 6);
    }

    #[tokio::test]
    async fn refresh_recovers_changes_after_a_failed_poll_and_removes_completed_reviews() {
        use std::{fs, os::unix::fs::PermissionsExt};

        let fixture = tempfile::tempdir().unwrap();
        let dir = fixture.path();
        let gh = dir.join("gh");
        fs::write(
            &gh,
            r#"#!/bin/sh
cd "$(dirname "$0")" || exit 1
case "$*" in
  "auth token --hostname github.com --user me") printf "test-token" ;;
  *pullRequests*) test "$GH_TOKEN" = "test-token" && cat pulls ;;
  *statusCheckRollup*) cat detail ;;
  */timeline*) cat timeline ;;
  */comments*) cat comments ;;
  *) exit 1 ;;
esac
"#,
        )
        .unwrap();
        fs::set_permissions(&gh, fs::Permissions::from_mode(0o700)).unwrap();
        let gh = GitHubCli {
            path: gh,
            token: None,
        };
        let gh = gh.with_account(Some("me")).await.unwrap();
        let write =
            |name: &str, value: Value| fs::write(dir.join(name), value.to_string()).unwrap();
        let list = |requested| {
            let reviewers = if requested {
                vec![json!({"requestedReviewer":{"login":"me"}})]
            } else {
                vec![]
            };
            json!([{"data":{"viewer":{"login":"me"},"repository":{"pullRequests":{"nodes":[
                {"number":1,"author":{"login":"other"},"reviewRequests":{"nodes":reviewers}}
            ]}}}}])
        };
        let detail = |behind, failed| {
            json!([{"data":{"viewer":{"login":"me"},"repository":{"pullRequest":{
                "number":1,"title":"Change","state":"OPEN","isDraft":false,
                "reviewDecision":null,"baseRefName":"main","headRefName":"feature/work","updatedAt":"2026-11-26T00:00:00Z",
                "mergeStateStatus":if behind {"BEHIND"} else {"CLEAN"},
                "statusCheckRollup":{"state":if failed {"FAILURE"} else {"PENDING"},"contexts":{"nodes":[
                    {"id":"check-1","conclusion":if failed {"FAILURE"} else {"PENDING"},"completedAt":"2026-11-26T00:00:10Z"}
                ]}}
            }}}}])
        };
        write("pulls", list(true));
        write("detail", detail(false, false));
        let baseline = remote_snapshot(
            &gh,
            "org/repo",
            "me",
            Snapshot::default(),
            "2026-11-26T00:00:00Z",
        )
        .await
        .unwrap();
        assert_eq!(baseline.pulls[&1].role, "requested");
        assert_eq!(
            baseline.pulls[&1].head_ref_name.as_deref(),
            Some("feature/work")
        );
        assert_eq!(
            baseline.pulls[&1].updated_at.as_deref(),
            Some("2026-11-26T00:00:00Z")
        );
        assert!(baseline.notifications.is_empty());
        assert!(remote_snapshot(
            &gh,
            "org/repo",
            "me",
            baseline.clone(),
            "2026-11-26T00:00:05Z"
        )
        .await
        .is_err());

        write("detail", detail(true, true));
        write(
            "timeline",
            json!([[{"event":"reviewed","id":7,"state":"approved","submitted_at":"2026-11-26T00:00:04Z"}]]),
        );
        write("comments", json!([[]]));
        let resumed = remote_snapshot(&gh, "org/repo", "me", baseline, "2026-11-26T00:01:00Z")
            .await
            .unwrap();
        let kinds: BTreeSet<_> = resumed
            .notifications
            .values()
            .map(|item| item.kind.as_str())
            .collect();
        assert_eq!(
            kinds,
            BTreeSet::from(["Approved", "Base branch update required", "CI failed"])
        );

        write("pulls", list(false));
        let complete = remote_snapshot(&gh, "org/repo", "me", resumed, "2026-11-26T00:02:00Z")
            .await
            .unwrap();
        assert!(complete.pulls.is_empty());
        assert_eq!(complete.notifications.len(), 3);
    }
}
