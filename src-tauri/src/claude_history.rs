//! Tìm trong transcript của Claude Code (`<config>/projects/*/<session>.jsonl`), không phải session hc của app.
use serde::Serialize;
use serde_json::{json, Value};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::time::SystemTime;

#[derive(Debug, Clone, Serialize)]
pub struct ClaudeHit {
    /// Id conversation của Claude (tên file .jsonl), dùng để resume.
    pub claude_session_id: String,
    pub cwd: Option<String>,
    pub title: Option<String>,
    pub snippet: String,
    pub updated_at: i64,
}

pub fn claude_dir() -> Option<PathBuf> {
    if let Ok(p) = std::env::var("CLAUDE_CONFIG_DIR") {
        if !p.is_empty() {
            return Some(PathBuf::from(p));
        }
    }
    std::env::var("HOME").ok().map(|h| PathBuf::from(h).join(".claude"))
}

/// Hạ chữ thường + bỏ dấu tiếng Việt, 1 ký tự → 1 ký tự (giữ nguyên vị trí để cắt snippet).
fn fold_char(c: char) -> char {
    if c.is_ascii() {
        return c.to_ascii_lowercase();
    }
    let c = c.to_lowercase().next().unwrap_or(c);
    const TABLE: [(&str, char); 7] = [
        ("àáạảãâầấậẩẫăằắặẳẵ", 'a'),
        ("èéẹẻẽêềếệểễ", 'e'),
        ("ìíịỉĩ", 'i'),
        ("òóọỏõôồốộổỗơờớợởỡ", 'o'),
        ("ùúụủũưừứựửữ", 'u'),
        ("ỳýỵỷỹ", 'y'),
        ("đ", 'd'),
    ];
    for (set, plain) in TABLE {
        if set.contains(c) {
            return plain;
        }
    }
    c
}

fn fold(s: &str) -> Vec<char> {
    s.chars().map(fold_char).collect()
}

fn find_sub(hay: &[char], needle: &[char]) -> Option<usize> {
    if needle.is_empty() || hay.len() < needle.len() {
        return None;
    }
    (0..=hay.len() - needle.len()).find(|&i| hay[i..i + needle.len()] == *needle)
}

/// Văn bản người dùng/assistant thực sự gõ; bỏ tool_result, meta, sidechain.
fn message_text(v: &Value) -> Option<String> {
    if v.get("isMeta").and_then(Value::as_bool).unwrap_or(false) || v.get("isSidechain").and_then(Value::as_bool).unwrap_or(false) {
        return None;
    }
    let content = v.get("message")?.get("content")?;
    let text = match content {
        Value::String(s) => s.clone(),
        Value::Array(a) => a
            .iter()
            .filter(|b| b.get("type").and_then(Value::as_str) == Some("text"))
            .filter_map(|b| b.get("text").and_then(Value::as_str))
            .collect::<Vec<_>>()
            .join("\n"),
        _ => return None,
    };
    let t = text.trim();
    if t.is_empty() || t.starts_with("<command-") || t.starts_with("<local-command") || t.starts_with("<system-reminder") {
        None
    } else {
        Some(text)
    }
}

fn snippet(text: &str, at: usize, len: usize) -> String {
    let chars: Vec<char> = text.chars().collect();
    let start = at.saturating_sub(40);
    let end = (at + len + 80).min(chars.len());
    let body: String = chars[start..end].iter().map(|c| if c.is_whitespace() { ' ' } else { *c }).collect();
    format!("{}{}{}", if start > 0 { "…" } else { "" }, body.trim(), if end < chars.len() { "…" } else { "" })
}

#[derive(Default)]
struct TranscriptTitle {
    custom: Option<String>,
    generated: Option<String>,
}

impl TranscriptTitle {
    fn record(&mut self, entry: &Value) {
        let (slot, field) = match entry["type"].as_str() {
            Some("custom-title") => (&mut self.custom, "customTitle"),
            Some("ai-title") => (&mut self.generated, "aiTitle"),
            _ => return,
        };
        *slot = entry[field].as_str().map(str::trim).filter(|title| !title.is_empty()).map(str::to_owned);
    }

    fn preferred(self) -> Option<String> {
        self.custom.or(self.generated)
    }
}

fn is_title_record(line: &str) -> bool {
    line.contains("\"custom-title\"") || line.contains("\"ai-title\"")
}

pub fn session_path(projects: &Path, id: &str) -> Option<PathBuf> {
    if !valid_session_id(id) {
        return None;
    }
    let filename = format!("{id}.jsonl");
    std::fs::read_dir(projects).ok()?.flatten()
        .map(|entry| entry.path().join(&filename))
        .find(|path| path.is_file())
}

fn valid_session_id(id: &str) -> bool {
    id.len() == 36 && id.bytes().all(|c| c.is_ascii_hexdigit() || c == b'-')
}

pub fn session_title(path: &Path) -> Option<String> {
    let mut title = TranscriptTitle::default();
    for line in BufReader::new(std::fs::File::open(path).ok()?).lines().map_while(Result::ok) {
        if is_title_record(&line) {
            if let Ok(entry) = serde_json::from_str::<Value>(&line) {
                title.record(&entry);
            }
        }
    }
    title.preferred()
}

fn scan_file(path: &Path, terms: &[Vec<char>], mtime: i64) -> Option<ClaudeHit> {
    read_transcript(path, terms, mtime).ok().and_then(|(hit, _)| hit)
}

fn read_transcript(path: &Path, terms: &[Vec<char>], mtime: i64) -> std::io::Result<(Option<ClaudeHit>, bool)> {
    let Some(stem) = path.file_stem() else { return Ok((None, false)) };
    let id = stem.to_string_lossy().into_owned();
    let mut cwd = None;
    let mut title = TranscriptTitle::default();
    let mut snip = None;
    let mut first_prompt = None;
    let mut has_message = false;
    let mut malformed = false;
    for line in BufReader::new(std::fs::File::open(path)?).lines() {
        let line = line?;
        let is_msg = line.contains("\"user\"") || line.contains("\"assistant\"");
        let is_title = is_title_record(&line);
        if !is_msg && !is_title {
            let trimmed = line.trim();
            malformed |= !trimmed.is_empty() && !(trimmed.starts_with('{') && trimmed.ends_with('}'));
            continue;
        }
        let Ok(v) = serde_json::from_str::<Value>(&line) else {
            malformed = true;
            continue;
        };
        if is_title {
            title.record(&v);
        }
        if !matches!(v["type"].as_str(), Some("user" | "assistant")) {
            continue;
        }
        if cwd.is_none() {
            cwd = v.get("cwd").and_then(Value::as_str).map(str::to_string);
        }
        let Some(text) = message_text(&v) else { continue };
        has_message = true;
        if first_prompt.is_none() && v["type"] == "user" {
            first_prompt = Some(text.split_whitespace().collect::<Vec<_>>().join(" ").chars().take(80).collect::<String>());
        }
        if !terms.is_empty() && snip.is_none() {
            let folded = fold(&text);
            let pos: Option<Vec<usize>> = terms.iter().map(|t| find_sub(&folded, t)).collect();
            if let Some(pos) = pos {
                let at = *pos.iter().min().unwrap_or(&0);
                snip = Some(snippet(&text, at, terms[0].len()));
            }
        }
    }
    let title = title.preferred().or(first_prompt);
    if !has_message && title.is_none() {
        return Ok((None, malformed));
    }
    if !terms.is_empty() && snip.is_none() && !title.as_deref().is_some_and(|title| {
        let folded = fold(title);
        terms.iter().all(|term| find_sub(&folded, term).is_some())
    }) {
        return Ok((None, malformed));
    }
    Ok((Some(ClaudeHit {
        claude_session_id: id,
        cwd,
        title,
        snippet: snip.unwrap_or_default(),
        updated_at: mtime,
    }), malformed))
}

pub fn details(path: &Path) -> Option<ClaudeHit> {
    let mtime = std::fs::metadata(path).and_then(|meta| meta.modified()).ok().map_or(0, timestamp_ms);
    scan_file(path, &[], mtime)
}

fn timestamp_ms(time: SystemTime) -> i64 {
    time.duration_since(SystemTime::UNIX_EPOCH).map(|elapsed| elapsed.as_millis() as i64).unwrap_or(0)
}

pub fn import_messages(path: &Path, mut out: impl Write) -> std::io::Result<()> {
    let mut seq = 0;
    for line in BufReader::new(std::fs::File::open(path)?).lines() {
        let Ok(entry) = serde_json::from_str::<Value>(&line?) else { continue };
        let Some(text) = message_text(&entry) else { continue };
        let mut event = match entry["type"].as_str() {
            Some("user") => json!({"type": "user_message", "text": text, "source": "app"}),
            Some("assistant") => json!({"type": "assistant_message", "message_id": entry["message"]["id"],
                "blocks": [{"kind": "text", "text": text}]}),
            _ => continue,
        };
        seq += 1;
        event["seq"] = json!(seq);
        event["ts"] = json!(entry["timestamp"].as_str()
            .and_then(|ts| chrono::DateTime::parse_from_rfc3339(ts).ok())
            .map(|ts| ts.timestamp_millis()).unwrap_or_default());
        serde_json::to_writer(&mut out, &event)?;
        writeln!(out)?;
    }
    Ok(())
}

pub fn search(query: &str, limit: usize, include: impl Fn(&ClaudeHit) -> bool) -> (Vec<ClaudeHit>, bool) {
    let Some(root) = claude_dir().map(|d| d.join("projects")) else { return (vec![], false) };
    search_in(&root, query, limit, include)
}

pub(crate) fn search_in(root: &Path, query: &str, limit: usize, include: impl Fn(&ClaudeHit) -> bool) -> (Vec<ClaudeHit>, bool) {
    let terms: Vec<Vec<char>> = query.split_whitespace().map(fold).collect();
    collect_hits(root, limit, include, |path, mtime| read_transcript(path, &terms, mtime))
}

pub fn browse(
    root: &Path, cwd_for_directory: impl Fn(&str) -> Option<String>, include: impl Fn(&ClaudeHit) -> bool,
) -> (Vec<ClaudeHit>, bool) {
    collect_hits(root, usize::MAX, include, |path, mtime| {
        let hit = path.file_stem().and_then(|stem| stem.to_str()).filter(|id| valid_session_id(id))
            .map(|id| ClaudeHit {
                claude_session_id: id.to_owned(),
                cwd: path.parent().and_then(Path::file_name).and_then(|name| name.to_str()).and_then(&cwd_for_directory),
                title: None,
                snippet: String::new(),
                updated_at: mtime,
            });
        Ok((hit, false))
    })
}

fn collect_hits(
    root: &Path, limit: usize, include: impl Fn(&ClaudeHit) -> bool,
    read_hit: impl Fn(&Path, i64) -> std::io::Result<(Option<ClaudeHit>, bool)>,
) -> (Vec<ClaudeHit>, bool) {
    let dirs = match std::fs::read_dir(root) {
        Ok(dirs) => dirs,
        Err(error) => return (vec![], error.kind() != std::io::ErrorKind::NotFound),
    };
    let mut failed = false;
    let mut files = Vec::new();
    for dir in dirs {
        let entries = dir.and_then(|dir| {
            if dir.file_type()?.is_dir() {
                std::fs::read_dir(dir.path()).map(Some)
            } else {
                Ok(None)
            }
        });
        match entries {
            Ok(Some(entries)) => {
                for file in entries {
                    let Ok(file) = file else { failed = true; continue };
                    let path = file.path();
                    if path.extension().and_then(|ext| ext.to_str()) != Some("jsonl") {
                        continue;
                    }
                    let modified = file.metadata().and_then(|meta| meta.modified());
                    if modified.is_err() {
                        failed = true;
                    }
                    let mtime = modified.ok().map_or(0, timestamp_ms);
                    files.push((path, mtime));
                }
            }
            Ok(None) => {}
            Err(_) => failed = true,
        }
    }
    files.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
    let mut hits = Vec::new();
    for (path, mtime) in files {
        match read_hit(&path, mtime) {
            Ok((hit, malformed)) => {
                failed |= malformed;
                if let Some(hit) = hit.filter(&include) {
                    hits.push(hit);
                    if hits.len() >= limit {
                        break;
                    }
                }
            }
            Err(_) => failed = true,
        }
    }
    (hits, failed)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn folds_vietnamese_and_finds_in_transcript() {
        let dir = tempfile::tempdir().unwrap();
        let p = dir.path().join("abc-123.jsonl");
        std::fs::write(
            &p,
            concat!(
                "{\"type\":\"ai-title\",\"aiTitle\":\"Tiêu đề\"}\n",
                "{\"type\":\"user\",\"cwd\":\"/x\",\"message\":{\"role\":\"user\",\"content\":\"Sửa lỗi đăng nhập OAuth\"}}\n",
                "{\"type\":\"user\",\"isMeta\":true,\"message\":{\"role\":\"user\",\"content\":\"dang nhap meta\"}}\n",
            ),
        )
        .unwrap();
        let terms: Vec<Vec<char>> = ["dang", "nhap"].iter().map(|t| fold(t)).collect();
        let h = scan_file(&p, &terms, 1).unwrap();
        assert_eq!(h.claude_session_id, "abc-123");
        assert_eq!(h.cwd.as_deref(), Some("/x"));
        assert_eq!(h.title.as_deref(), Some("Tiêu đề"));
        assert!(h.snippet.contains("đăng nhập"));
        assert!(scan_file(&p, &[fold("zzz")], 1).is_none());
    }
    #[test]
    fn searching_keeps_readable_results_alongside_a_broken_transcript() {
        let root = tempfile::tempdir().unwrap();
        let project = root.path().join("project");
        std::fs::create_dir(&project).unwrap();
        std::fs::write(project.join("broken.jsonl"), b"truncated transcript").unwrap();
        std::fs::write(project.join("readable.jsonl"), br#"{"type": "assistant","message":{"content":"A saved reply"}}"#).unwrap();
        let (hits, partial) = search_in(root.path(), "saved reply", usize::MAX, |_| true);
        assert!(partial);
        assert_eq!(hits.len(), 1);
        assert!(hits[0].snippet.contains("A saved reply"));
        assert_eq!(hits[0].cwd, None);
    }

    #[test]
    fn browsing_lists_transcripts_without_parsing_them() {
        let root = tempfile::tempdir().unwrap();
        let project = root.path().join("-fixture");
        std::fs::create_dir(&project).unwrap();
        let id = "01234567-89ab-cdef-0123-456789abcdef";
        std::fs::write(project.join(format!("{id}.jsonl")), [0xff]).unwrap();

        let (hits, partial) = browse(root.path(), |directory| {
            (directory == "-fixture").then(|| "/fixture".to_owned())
        }, |hit| hit.cwd.as_deref() == Some("/fixture"));
        assert!(!partial);
        assert_eq!(hits.len(), 1);
        assert_eq!(hits[0].claude_session_id, id);
        assert_eq!(hits[0].title, None);
        assert!(hits[0].snippet.is_empty());
    }

    #[test]
    fn untitled_cli_session_can_be_browsed_and_replayed() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("session.jsonl");
        std::fs::write(&path, concat!(
            "{\"type\":\"user\",\"cwd\":\"/project\",\"isMeta\":true,\"message\":{\"content\":\"Internal message\"}}\n",
            "{\"type\":\"user\",\"cwd\":\"/project\",\"timestamp\":\"2026-11-25T12:00:00Z\",\"message\":{\"content\":\"Fix the login\"}}\n",
            "{\"type\":\"assistant\",\"message\":{\"id\":\"msg_1\",\"content\":[{\"type\":\"text\",\"text\":\"Fixed\"}]}}\n",
        )).unwrap();
        let hit = details(&path).unwrap();
        assert_eq!(hit.cwd.as_deref(), Some("/project"));
        assert_eq!(hit.title.as_deref(), Some("Fix the login"));

        let mut output = Vec::new();
        import_messages(&path, &mut output).unwrap();
        let events: Vec<Value> = std::str::from_utf8(&output).unwrap().lines()
            .map(|line| serde_json::from_str(line).unwrap()).collect();
        assert_eq!(events.len(), 2);
        assert_eq!(events[0]["text"], "Fix the login");
        assert_eq!(events[0]["ts"], 1795608000000_i64);
        assert_eq!(events[1]["blocks"][0]["text"], "Fixed");
        assert_eq!(events[1]["seq"], 2);
    }

}
