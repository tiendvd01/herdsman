//! Tìm trong transcript của Claude Code (`<config>/projects/*/<session>.jsonl`), không phải session hc của app.
use serde::Serialize;
use serde_json::Value;
use std::io::{BufRead, BufReader};
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
    if id.len() != 36 || !id.bytes().all(|c| c.is_ascii_hexdigit() || c == b'-') {
        return None;
    }
    let filename = format!("{id}.jsonl");
    std::fs::read_dir(projects).ok()?.flatten()
        .map(|entry| entry.path().join(&filename))
        .find(|path| path.is_file())
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
    let id = path.file_stem()?.to_string_lossy().into_owned();
    let mut cwd = None;
    let mut title = TranscriptTitle::default();
    let mut snip = None;
    for line in BufReader::new(std::fs::File::open(path).ok()?).lines().map_while(Result::ok) {
        let is_msg = line.contains("\"type\":\"user\"") || line.contains("\"type\":\"assistant\"");
        let is_title = is_title_record(&line);
        if !is_msg && !is_title {
            continue;
        }
        let Ok(v) = serde_json::from_str::<Value>(&line) else { continue };
        if is_title {
            title.record(&v);
        }
        if !is_msg {
            continue;
        }
        if cwd.is_none() {
            cwd = v.get("cwd").and_then(Value::as_str).map(str::to_string);
        }
        let Some(text) = message_text(&v) else { continue };
        if snip.is_none() {
            let folded = fold(&text);
            let pos: Option<Vec<usize>> = terms.iter().map(|t| find_sub(&folded, t)).collect();
            if let Some(pos) = pos {
                let at = *pos.iter().min().unwrap_or(&0);
                snip = Some(snippet(&text, at, terms[0].len()));
            }
        }
    }
    let title = title.preferred();
    if snip.is_none() && !title.as_deref().is_some_and(|title| {
        let folded = fold(title);
        terms.iter().all(|term| find_sub(&folded, term).is_some())
    }) {
        return None;
    }
    Some(ClaudeHit {
        claude_session_id: id,
        cwd,
        title,
        snippet: snip.unwrap_or_default(),
        updated_at: mtime,
    })
}

pub fn search(query: &str, limit: usize, include: impl Fn(&ClaudeHit) -> bool) -> Vec<ClaudeHit> {
    let terms: Vec<Vec<char>> = query.split_whitespace().map(fold).collect();
    let Some(root) = claude_dir().map(|d| d.join("projects")) else { return vec![] };
    if terms.is_empty() {
        return vec![];
    }
    let mut files: Vec<(PathBuf, i64)> = vec![];
    for dir in std::fs::read_dir(&root).into_iter().flatten().flatten() {
        for f in std::fs::read_dir(dir.path()).into_iter().flatten().flatten() {
            let p = f.path();
            if p.extension().and_then(|e| e.to_str()) != Some("jsonl") {
                continue;
            }
            let m = f
                .metadata()
                .and_then(|m| m.modified())
                .ok()
                .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
                .map(|d| d.as_millis() as i64)
                .unwrap_or(0);
            files.push((p, m));
        }
    }
    files.sort_by(|a, b| b.1.cmp(&a.1));
    let mut out = vec![];
    for (p, m) in files {
        if let Some(h) = scan_file(&p, &terms, m).filter(&include) {
            out.push(h);
            if out.len() >= limit {
                break;
            }
        }
    }
    out
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
}
