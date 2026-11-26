use super::St;
use crate::error::AppResult;
use crate::hc::Terminal;
use crate::store;
use serde::Serialize;
use std::path::Path;

#[tauri::command]
pub async fn terminal_read(st: St<'_>, terminal: String, lines: Option<u32>) -> AppResult<String> {
    st.hc()?.read(&terminal, lines.unwrap_or(2000)).await
}

#[derive(Serialize)]
#[derive(Debug)]
pub struct AgentNode {
    pub terminal: String,
    pub title: String,
    pub state: String,
    pub status: Option<String>,
    pub kind: Option<String>,
    pub progress: Option<u8>,
    pub children: Vec<AgentNode>,
}

pub fn build_tree(addr: &str, all: &[Terminal], depth: u8) -> Option<AgentNode> {
    let t = all.iter().find(|t| t.address == addr)?;
    let children = if depth > 6 {
        vec![]
    } else {
        all.iter().filter(|c| c.parent.as_deref() == Some(addr)).filter_map(|c| build_tree(&c.address, all, depth + 1)).collect()
    };
    let title = t
        .name
        .clone()
        .or_else(|| t.title.clone().filter(|s| !s.is_empty()))
        .unwrap_or_else(|| t.argv.iter().map(|a| Path::new(a).file_name().map(|f| f.to_string_lossy().to_string()).unwrap_or_default()).take(3).collect::<Vec<_>>().join(" "));
    Some(AgentNode {
        terminal: t.address.clone(),
        title,
        state: t.state.clone(),
        status: t.status.as_ref().map(|s| s.state.clone()),
        kind: t.status.as_ref().and_then(|s| s.kind.clone()),
        progress: t.status.as_ref().and_then(|s| s.progress),
        children,
    })
}

/// FR-025: cây agent cha → con dựng từ `parent` của terminal hc.
#[tauri::command]
pub async fn agent_tree(st: St<'_>, session_id: String) -> AppResult<Option<AgentNode>> {
    let s = store::session_get(&st.db.lock(), &session_id)?;
    let Some(root) = s.hc_terminal else { return Ok(None) };
    let all = st.hc()?.list(&[], true).await?;
    Ok(build_tree(&root, &all, 0))
}
