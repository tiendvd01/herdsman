use crate::error::{AppError, AppResult};
use serde_json::{json, Value};
use std::{collections::HashMap, path::Path, process::Stdio, sync::Arc, time::Duration};
use tauri::Url;
use tokio::{
    io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader},
    process::{Child, ChildStdin, ChildStdout, Command},
    sync::Mutex,
    time::timeout,
};

#[derive(Default)]
pub struct EditorLsp(Mutex<HashMap<String, Arc<Mutex<Server>>>>);

struct Server {
    child: Child,
    input: ChildStdin,
    output: BufReader<ChildStdout>,
    id: u64,
    uri: Url,
    text: String,
    version: u64,
}

fn failure(message: &str) -> AppError {
    AppError::new("editor_lsp", message)
}

fn language(path: &Path) -> AppResult<&'static str> {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(str::to_ascii_lowercase)
        .as_deref()
    {
        Some("ts" | "mts" | "cts") => Ok("typescript"),
        Some("tsx") => Ok("typescriptreact"),
        Some("js" | "mjs" | "cjs") => Ok("javascript"),
        Some("jsx") => Ok("javascriptreact"),
        _ => Err(failure("Type hover is unavailable for this file type.")),
    }
}

impl EditorLsp {
    pub async fn open(
        &self,
        session: String,
        root: &Path,
        file: &Path,
        text: String,
    ) -> AppResult<()> {
        let (bin, node) = tokio::task::spawn_blocking(|| {
            let bin = crate::hc::which_in_login_shell("typescript-language-server");
            let node = crate::hc::which_in_login_shell("node");
            (bin, node)
        })
        .await
        .map_err(|_| failure("Could not locate the language server."))?;
        let mut command = Command::new(
            bin.as_deref()
                .unwrap_or(Path::new("typescript-language-server")),
        );
        if let Some(node_dir) = node.as_deref().and_then(Path::parent) {
            let path = std::env::var_os("PATH").unwrap_or_default();
            if let Ok(path) = std::env::join_paths(
                std::iter::once(node_dir.to_owned()).chain(std::env::split_paths(&path)),
            ) {
                command.env("PATH", path);
            }
        }
        let server = timeout(
            Duration::from_secs(12),
            Server::start(command, root, file, text),
        )
        .await
        .map_err(|_| failure("Language server startup timed out."))??;
        self.0
            .lock()
            .await
            .insert(session, Arc::new(Mutex::new(server)));
        Ok(())
    }

    pub async fn hover(
        &self,
        session: &str,
        text: String,
        line: u32,
        character: u32,
    ) -> AppResult<Option<String>> {
        let server =
            self.0.lock().await.get(session).cloned().ok_or_else(|| {
                failure("Language server is unavailable. Reopen the file to retry.")
            })?;
        let mut server = server.lock().await;
        let result = timeout(Duration::from_secs(4), server.hover(text, line, character))
            .await
            .unwrap_or_else(|_| Err(failure("Language server did not respond.")));
        if result.is_err() {
            self.0.lock().await.remove(session);
        }
        result
    }

    pub async fn close(&self, session: &str) {
        let server = self.0.lock().await.remove(session);
        if let Some(server) = server {
            let _ = timeout(Duration::from_millis(700), async {
                let mut server = server.lock().await;
                let _ = server.request("shutdown", Value::Null).await;
                let _ = server.notify("exit", Value::Null).await;
                let _ = server.child.wait().await;
            })
            .await;
        }
    }
}

impl Server {
    async fn start(
        mut command: Command,
        root: &Path,
        file: &Path,
        text: String,
    ) -> AppResult<Self> {
        let root_uri =
            Url::from_directory_path(root).map_err(|_| failure("Invalid workspace path."))?;
        let uri = Url::from_file_path(file).map_err(|_| failure("Invalid editor file path."))?;
        let language = language(file)?;
        let mut child = command
            .arg("--stdio")
            .current_dir(root)
            .kill_on_drop(true)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|_| {
                failure("Install TypeScript and typescript-language-server to enable type hover.")
            })?;
        let input = child
            .stdin
            .take()
            .ok_or_else(|| failure("Language server input is unavailable."))?;
        let output = BufReader::new(
            child
                .stdout
                .take()
                .ok_or_else(|| failure("Language server output is unavailable."))?,
        );
        let mut server = Self {
            child,
            input,
            output,
            id: 0,
            uri,
            text,
            version: 1,
        };
        let initialized = server.request("initialize", json!({
            "processId": std::process::id(),
            "rootUri": root_uri.as_str(),
            "workspaceFolders": [{"uri": root_uri.as_str(), "name": root.file_name().and_then(|name| name.to_str()).unwrap_or("Workspace")}],
            "capabilities": {
                "general": {"positionEncodings": ["utf-16"]},
                "textDocument": {"hover": {"contentFormat": ["plaintext", "markdown"]}}
            },
            "initializationOptions": {
                "disableAutomaticTypingAcquisition": true,
                "tsserver": {"useSyntaxServer": "never"}
            }
        })).await?;
        if !initialized
            .pointer("/capabilities/hoverProvider")
            .is_some_and(|value| *value != Value::Bool(false) && !value.is_null())
        {
            return Err(failure("Language server does not provide type hover."));
        }
        server.notify("initialized", json!({})).await?;
        server.notify("textDocument/didOpen", json!({
            "textDocument": {"uri": server.uri.as_str(), "languageId": language, "version": server.version, "text": server.text}
        })).await?;
        Ok(server)
    }

    async fn hover(
        &mut self,
        text: String,
        line: u32,
        character: u32,
    ) -> AppResult<Option<String>> {
        if text != self.text {
            self.version += 1;
            self.notify(
                "textDocument/didChange",
                json!({
                    "textDocument": {"uri": self.uri.as_str(), "version": self.version},
                    "contentChanges": [{"text": text}]
                }),
            )
            .await?;
            self.text = text;
        }
        let response = self.request("textDocument/hover", json!({
            "textDocument": {"uri": self.uri.as_str()}, "position": {"line": line, "character": character}
        })).await?;
        let contents = &response["contents"];
        let items = contents
            .as_array()
            .map(Vec::as_slice)
            .unwrap_or_else(|| std::slice::from_ref(contents));
        let summary = items
            .iter()
            .filter_map(|item| item.as_str().or_else(|| item["value"].as_str()))
            .collect::<Vec<_>>()
            .join("\n\n");
        Ok((!summary.trim().is_empty()).then_some(summary))
    }

    async fn write(&mut self, message: Value) -> AppResult<()> {
        let body = serde_json::to_vec(&message)?;
        self.input
            .write_all(format!("Content-Length: {}\r\n\r\n", body.len()).as_bytes())
            .await?;
        self.input.write_all(&body).await?;
        self.input.flush().await?;
        Ok(())
    }

    async fn notify(&mut self, method: &str, params: Value) -> AppResult<()> {
        self.write(json!({"jsonrpc": "2.0", "method": method, "params": params}))
            .await
    }

    async fn request(&mut self, method: &str, params: Value) -> AppResult<Value> {
        self.id += 1;
        let id = self.id;
        self.write(json!({"jsonrpc": "2.0", "id": id, "method": method, "params": params}))
            .await?;
        loop {
            let response = read_message(&mut self.output).await?;
            if response.get("method").is_some() {
                if let Some(request_id) = response.get("id") {
                    self.write(json!({"jsonrpc": "2.0", "id": request_id, "error": {
                        "code": -32601, "message": "Unsupported client request"
                    }}))
                    .await?;
                }
            } else if response["id"].as_u64() == Some(id) {
                if response.get("error").is_some() {
                    return Err(failure("Language server could not complete the request."));
                }
                return Ok(response["result"].clone());
            }
        }
    }
}

async fn read_message(reader: &mut (impl AsyncBufReadExt + Unpin)) -> AppResult<Value> {
    let mut length = None;
    loop {
        let mut line = String::new();
        if reader.read_line(&mut line).await? == 0 {
            return Err(failure("Language server disconnected."));
        }
        if line == "\r\n" {
            break;
        }
        if let Some((key, value)) = line.split_once(':') {
            if key.eq_ignore_ascii_case("Content-Length") {
                length = value.trim().parse::<usize>().ok();
            }
        }
    }
    let length = length
        .filter(|length| *length <= 8 * 1024 * 1024)
        .ok_or_else(|| failure("Invalid language server message."))?;
    let mut bytes = vec![0; length];
    reader.read_exact(&mut bytes).await?;
    Ok(serde_json::from_slice(&bytes)?)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn parses_lsp_frames_with_utf8_content() {
        let body = json!({"jsonrpc": "2.0", "id": 1, "result": "Kiểu dữ liệu"}).to_string();
        let frame = format!("Content-Length: {}\r\nContent-Type: application/vscode-jsonrpc; charset=utf-8\r\n\r\n{body}", body.len());
        assert_eq!(
            read_message(&mut frame.as_bytes()).await.unwrap()["result"],
            "Kiểu dữ liệu"
        );
        assert!(read_message(&mut &b"Content-Length: 999999999\r\n\r\n"[..])
            .await
            .is_err());
    }

    #[tokio::test]
    #[ignore = "requires HERDSMAN_LSP_TEST_BIN pointing to typescript-language-server"]
    async fn real_language_server_resolves_imports_and_unsaved_drafts() {
        let bin = std::env::var_os("HERDSMAN_LSP_TEST_BIN").expect("language server binary");
        let project = tempfile::tempdir().unwrap();
        let root = project.path().canonicalize().unwrap();
        let file = root.join("index.ts");
        let text = "import { make } from './lib';\nlet value = make('test');\n";
        std::fs::write(&file, text).unwrap();
        std::fs::write(
            root.join("lib.ts"),
            "export function make(input: string): boolean { return !!input }\n",
        )
        .unwrap();
        std::fs::write(root.join("tsconfig.json"), "{}").unwrap();
        let mut server = timeout(
            Duration::from_secs(12),
            Server::start(Command::new(bin), &root, &file, text.into()),
        )
        .await
        .unwrap()
        .unwrap();

        let description = timeout(Duration::from_secs(8), server.hover(text.into(), 1, 12))
            .await
            .unwrap()
            .unwrap()
            .unwrap();
        assert!(
            description.contains("make(input: string): boolean"),
            "{description}"
        );
        let draft = "import { make } from './lib';\nlet value = 12;\n";
        let description = timeout(Duration::from_secs(4), server.hover(draft.into(), 1, 4))
            .await
            .unwrap()
            .unwrap()
            .unwrap();
        assert!(description.contains("value: number"), "{description}");
        assert_eq!(std::fs::read_to_string(&file).unwrap(), text);

        server.request("shutdown", Value::Null).await.unwrap();
        server.notify("exit", Value::Null).await.unwrap();
        assert!(timeout(Duration::from_secs(4), server.child.wait())
            .await
            .unwrap()
            .unwrap()
            .success());
    }
}
