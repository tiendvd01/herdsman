//! Lỗi trả về UI dạng `{code, message}` (contracts/tauri-commands.md).
use serde::Serialize;

#[derive(Debug, thiserror::Error, Serialize)]
#[error("{code}: {message}")]
pub struct AppError {
    pub code: String,
    pub message: String,
}

impl AppError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self { code: code.to_string(), message: message.into() }
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        if let rusqlite::Error::QueryReturnedNoRows = e {
            return AppError::new("not_found", "not found");
        }
        AppError::new("db", e.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::new("io", e.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::new("json", e.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
