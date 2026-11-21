//! Client cho hc (herdr-core) qua CLI `hc … --json` (contracts/hc-integration.md).
//! Mọi tiến trình agent/task chạy trong terminal của hc, không phải tiến trình con của app.
use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct HcStatus {
    pub state: String,
    #[serde(default)]
    pub kind: Option<String>,
    #[serde(default)]
    pub progress: Option<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Terminal {
    pub address: String,
    #[serde(default)]
    pub argv: Vec<String>,
    #[serde(default)]
    pub cwd: String,
    pub state: String,
    #[serde(default)]
    pub status: Option<HcStatus>,
    #[serde(default)]
    pub exit_code: Option<i32>,
    #[serde(default)]
    pub labels: HashMap<String, String>,
    #[serde(default)]
    pub parent: Option<String>,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub created_ms: Option<u64>,
    #[serde(default)]
    pub reason: Option<String>,
}

impl Terminal {
    pub fn label(&self, k: &str) -> Option<&str> {
        self.labels.get(k).map(|s| s.as_str())
    }
}

#[derive(Clone)]
pub struct Hc {
    pub bin: PathBuf,
}

/// Tìm `hc`: biến môi trường, các vị trí cài đặt thường gặp, rồi PATH.
pub fn find_hc() -> Option<PathBuf> {
    if let Ok(p) = std::env::var("HERDSMAN_HC") {
        return Some(PathBuf::from(p));
    }
    let home = std::env::var("HOME").unwrap_or_default();
    for c in [format!("{home}/.local/bin/hc"), "/opt/homebrew/bin/hc".into(), "/usr/local/bin/hc".into()] {
        if Path::new(&c).exists() {
            return Some(PathBuf::from(c));
        }
    }
    which_in_login_shell("hc")
}

/// `command -v <prog>` trong login shell của người dùng (app mở từ Finder không có PATH của shell).
pub fn which_in_login_shell(prog: &str) -> Option<PathBuf> {
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".into());
    let out = std::process::Command::new(shell).args(["-lc", &format!("command -v {prog}")]).output().ok()?;
    let s = String::from_utf8_lossy(&out.stdout).lines().last()?.trim().to_string();
    if s.starts_with('/') && Path::new(&s).exists() {
        Some(PathBuf::from(s))
    } else {
        None
    }
}

impl Hc {
    async fn call(&self, args: &[String]) -> AppResult<Value> {
        // `--json` đứng ngay sau subcommand: phần sau `--` là argv của chương trình chạy trong terminal.
        let mut full: Vec<&str> = Vec::with_capacity(args.len() + 1);
        if let Some((sub, rest)) = args.split_first() {
            full.push(sub);
            full.push("--json");
            full.extend(rest.iter().map(|s| s.as_str()));
        }
        let out = Command::new(&self.bin)
            .args(&full)
            .output()
            .await
            .map_err(|e| AppError::new("hc_unavailable", format!("could not run hc: {e}")))?;
        let text = String::from_utf8_lossy(&out.stdout);
        let v: Value = serde_json::from_str(text.trim()).unwrap_or(Value::Null);
        if let Some(err) = v.get("error") {
            let kind = err.get("kind").and_then(|k| k.as_str()).unwrap_or("hc_error");
            let msg = err.get("message").and_then(|k| k.as_str()).unwrap_or("hc error");
            return Err(AppError::new(&format!("hc_{kind}"), msg.to_string()));
        }
        if !out.status.success() && v.is_null() {
            return Err(AppError::new("hc_error", String::from_utf8_lossy(&out.stderr).to_string()));
        }
        Ok(v)
    }

    pub async fn version(&self) -> AppResult<String> {
        let out = Command::new(&self.bin).arg("--version").output().await?;
        Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
    }

    pub async fn server_ok(&self) -> bool {
        self.call(&["server".into(), "status".into()]).await.is_ok()
    }

    /// `hc run --bg`: chạy một chương trình sống độc lập với app.
    pub async fn run(&self, argv: &[String], cwd: &str, labels: &[(&str, String)]) -> AppResult<Terminal> {
        let mut args: Vec<String> = vec!["run".into(), "--bg".into(), "--no-parent".into(), "--outlive-parent".into(), "--no-notify".into()];
        args.push("--cwd".into());
        args.push(cwd.into());
        for (k, v) in labels {
            args.push("--label".into());
            args.push(format!("{k}={v}"));
        }
        args.push("--".into());
        args.extend(argv.iter().cloned());
        let v = self.call(&args).await?;
        Ok(serde_json::from_value(v)?)
    }

    /// Danh sách terminal đầy đủ (labels, parent, status). `hc ls --json` chỉ trả dạng rút gọn,
    /// nên lấy snapshot đầu tiên của `hc events` (gồm cả terminal đã kết thúc) rồi lọc.
    pub async fn list(&self, labels: &[(&str, &str)], all: bool) -> AppResult<Vec<Terminal>> {
        let mut args: Vec<String> = vec!["events".into(), "--json".into()];
        for (k, v) in labels {
            args.push("--label".into());
            args.push(format!("{k}={v}"));
        }
        let mut child = Command::new(&self.bin)
            .args(&args)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::null())
            .kill_on_drop(true)
            .spawn()
            .map_err(|e| AppError::new("hc_unavailable", format!("could not run hc: {e}")))?;
        let stdout = child.stdout.take().ok_or_else(|| AppError::new("hc_events", "could not read stdout"))?;
        let mut lines = BufReader::new(stdout).lines();
        let first = tokio::time::timeout(std::time::Duration::from_secs(10), lines.next_line())
            .await
            .map_err(|_| AppError::new("hc_timeout", "hc returned no snapshot"))??;
        let _ = child.kill().await;
        let v: Value = serde_json::from_str(first.as_deref().unwrap_or("{}"))?;
        if let Some(err) = v.get("error") {
            return Err(AppError::new("hc_error", err.to_string()));
        }
        let terms: Vec<Terminal> = serde_json::from_value(v.get("terminals").cloned().unwrap_or(Value::Array(vec![])))?;
        Ok(terms.into_iter().filter(|t| all || t.state == "live").collect())
    }

    pub async fn get(&self, t: &str) -> AppResult<Terminal> {
        let v = self.call(&["get".into(), t.into()]).await?;
        Ok(serde_json::from_value(v)?)
    }

    pub async fn kill(&self, t: &str) -> AppResult<()> {
        self.call(&["kill".into(), t.into()]).await.map(|_| ())
    }

    pub async fn rm(&self, t: &str) -> AppResult<()> {
        self.call(&["rm".into(), t.into()]).await.map(|_| ())
    }

    pub async fn label(&self, t: &str, labels: &[(&str, &str)]) -> AppResult<()> {
        let mut args: Vec<String> = vec!["label".into(), t.into()];
        for (k, v) in labels {
            args.push(format!("{k}={v}"));
        }
        self.call(&args).await.map(|_| ())
    }

    pub async fn read(&self, t: &str, lines: u32) -> AppResult<String> {
        let v = self.call(&["read".into(), t.into(), "--lines".into(), lines.to_string()]).await;
        match v {
            Ok(v) => Ok(v.get("text").and_then(|t| t.as_str()).unwrap_or_default().to_string()),
            Err(e) => Err(e),
        }
    }

    /// Theo dõi `hc events` (lọc label). Gọi `on_event(type, terminal)` cho mỗi sự kiện; trả về khi stream kết thúc.
    pub async fn follow_events<F>(&self, label: (&str, &str), mut on_event: F) -> AppResult<()>
    where
        F: FnMut(&str, Option<&str>, &Value),
    {
        let mut child = Command::new(&self.bin)
            .args(["events", "--json", "--label", &format!("{}={}", label.0, label.1)])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::null())
            .kill_on_drop(true)
            .spawn()?;
        let stdout = child.stdout.take().ok_or_else(|| AppError::new("hc_events", "could not read stdout"))?;
        let mut lines = BufReader::new(stdout).lines();
        while let Some(line) = lines.next_line().await? {
            let Ok(v) = serde_json::from_str::<Value>(&line) else { continue };
            if v.get("terminals").is_some() {
                on_event("snapshot", None, &v);
                continue;
            }
            let params = v.get("params").cloned().unwrap_or(Value::Null);
            let ty = params.get("type").and_then(|t| t.as_str()).unwrap_or("");
            let term = params.get("terminal").and_then(|t| t.as_str());
            on_event(ty, term, &params);
        }
        let _ = child.wait().await;
        Ok(())
    }
}
