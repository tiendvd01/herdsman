use crate::error::{AppError, AppResult};
use serde::Serialize;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Component, Path, PathBuf};

const MAX_BYTES: usize = 2 * 1024 * 1024;
static SAVE_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

#[derive(Serialize)]
pub struct Entry {
    name: String,
    path: String,
    directory: bool,
}

#[derive(Serialize)]
pub struct Document {
    pub text: String,
    pub writable: bool,
}

fn resolve(root: &Path, relative: &str) -> AppResult<PathBuf> {
    let mut path = root.canonicalize()?;
    for component in Path::new(relative).components() {
        let Component::Normal(name) = component else {
            return Err(AppError::new(
                "invalid_path",
                "Choose a path inside the project.",
            ));
        };
        if name == ".git" {
            return Err(AppError::new(
                "invalid_path",
                "Git metadata is unavailable in Files.",
            ));
        }
        path.push(name);
        if path.symlink_metadata()?.is_symlink() {
            return Err(AppError::new(
                "invalid_path",
                "Symbolic links are unavailable in Files.",
            ));
        }
    }
    Ok(path)
}

pub fn list(root: &Path, relative: &str) -> AppResult<Vec<Entry>> {
    let mut entries = Vec::new();
    for entry in fs::read_dir(resolve(root, relative)?)? {
        let entry = entry?;
        let kind = entry.file_type()?;
        let Some(name) = entry.file_name().into_string().ok() else {
            continue;
        };
        if name == ".git" || !(kind.is_dir() || kind.is_file()) {
            continue;
        }
        let path = if relative.is_empty() {
            name.clone()
        } else {
            format!("{relative}/{name}")
        };
        entries.push(Entry {
            name,
            path,
            directory: kind.is_dir(),
        });
    }
    entries.sort_by(|a, b| {
        b.directory
            .cmp(&a.directory)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
            .then_with(|| a.name.cmp(&b.name))
    });
    Ok(entries)
}

fn read_text(file: &File) -> AppResult<String> {
    let mut bytes = Vec::new();
    file.take((MAX_BYTES + 1) as u64).read_to_end(&mut bytes)?;
    if bytes.len() > MAX_BYTES {
        return Err(AppError::new(
            "unsupported_file",
            "Files larger than 2 MiB cannot be opened.",
        ));
    }
    if bytes.contains(&0) {
        return Err(AppError::new(
            "unsupported_file",
            "This file is not supported UTF-8 text.",
        ));
    }
    String::from_utf8(bytes)
        .map_err(|_| AppError::new("unsupported_file", "This file is not supported UTF-8 text."))
}

fn open_file(path: &Path) -> AppResult<File> {
    if !path.is_file() {
        return Err(AppError::new("unsupported_file", "Choose a regular file."));
    }
    Ok(File::open(path)?)
}

pub fn read(root: &Path, relative: &str) -> AppResult<Document> {
    let path = resolve(root, relative)?;
    let file = open_file(&path)?;
    let writable = !file.metadata()?.permissions().readonly()
        && fs::OpenOptions::new().write(true).open(&path).is_ok();
    Ok(Document {
        text: read_text(&file)?,
        writable,
    })
}

pub fn save(root: &Path, relative: &str, baseline: &str, text: &str) -> AppResult<()> {
    if text.len() > MAX_BYTES || text.contains('\0') {
        return Err(AppError::new(
            "unsupported_file",
            "Save requires UTF-8 text under 2 MiB.",
        ));
    }
    let _guard = SAVE_LOCK.lock().unwrap_or_else(|err| err.into_inner());
    let path = resolve(root, relative)?;
    let original = open_file(&path)?;
    let permissions = original.metadata()?.permissions();
    if permissions.readonly() {
        return Err(AppError::new("read_only", "This file is read-only."));
    }
    fs::OpenOptions::new().write(true).open(&path)?;
    let parent = path
        .parent()
        .ok_or_else(|| AppError::new("invalid_path", "Choose a project file."))?;
    let mut staged = tempfile::NamedTempFile::new_in(parent)?;
    staged.write_all(text.as_bytes())?;
    staged.as_file().set_permissions(permissions)?;
    staged.as_file().sync_all()?;
    if read_text(&open_file(&resolve(root, relative)?)?)? != baseline {
        return Err(AppError::new(
            "file_conflict",
            "This file changed on disk. Your edits are still in this tab.",
        ));
    }
    staged
        .persist(path)
        .map_err(|error| AppError::from(error.error))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn saves_only_when_baseline_matches() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path();
        fs::write(root.join("note.txt"), "before\r\n").unwrap();
        let document = read(root, "note.txt").unwrap();
        save(root, "note.txt", &document.text, "after\r\n").unwrap();
        assert_eq!(
            save(root, "note.txt", &document.text, "stale")
                .unwrap_err()
                .code,
            "file_conflict"
        );
        assert_eq!(
            fs::read_to_string(root.join("note.txt")).unwrap(),
            "after\r\n"
        );
        assert!(read(root, "../note.txt").is_err());
    }
}
