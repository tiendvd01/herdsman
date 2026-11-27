use crate::error::{AppError, AppResult};
use serde::Serialize;
use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{Read, Seek, Write};
use std::path::{Component, Path, PathBuf};
use std::process::{Command, Stdio};

const MAX_BYTES: usize = 2 * 1024 * 1024;
static SAVE_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

#[derive(Serialize)]
pub struct Entry {
    name: String,
    path: String,
    directory: bool,
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    ignored: bool,
}

#[derive(Serialize)]
pub struct Document {
    pub text: String,
    pub writable: bool,
}

pub(crate) fn resolve(root: &Path, relative: &str) -> AppResult<PathBuf> {
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
    let directory = resolve(root, relative)?;
    let mut entries = read_entries(&directory, relative)?;
    if !entries.is_empty() {
        // Ignore information is optional, including outside a Git work tree.
        let _ = mark_ignored(&directory, &mut entries);
    }
    Ok(entries)
}

fn mark_ignored(directory: &Path, entries: &mut [Entry]) -> std::io::Result<()> {
    // File-backed stdin lets Git read input while its output is being collected.
    let mut input = tempfile::tempfile()?;
    for entry in entries.iter() {
        write!(input, "./{}\0", entry.name)?;
    }
    input.rewind()?;
    let output = Command::new("git")
        .args(["check-ignore", "-z", "--stdin"])
        .current_dir(directory)
        .stdin(Stdio::from(input))
        .stderr(Stdio::null())
        .output()?;
    if output.status.success() {
        let ignored: HashSet<_> = output.stdout.split(|byte| *byte == 0)
            .filter_map(|path| path.strip_prefix(b"./"))
            .collect();
        for entry in entries {
            entry.ignored = ignored.contains(entry.name.as_bytes());
        }
    }
    Ok(())
}

fn read_entries(directory: &Path, relative: &str) -> AppResult<Vec<Entry>> {
    let mut entries = Vec::new();
    for entry in fs::read_dir(directory)? {
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
            ignored: false,
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

pub fn search(root: &Path, query: &str) -> AppResult<Vec<Entry>> {
    let query = query.trim().to_lowercase();
    if query.is_empty() {
        return Ok(Vec::new());
    }

    let mut matches = Vec::new();
    let mut directories = vec![String::new()];
    while let Some(directory) = directories.pop() {
        for entry in read_entries(&resolve(root, &directory)?, &directory)? {
            if entry.directory {
                directories.push(entry.path);
            } else if entry.path.to_lowercase().contains(&query) {
                matches.push(entry);
            }
        }
    }
    matches.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(matches)
}

pub fn search_absolute(path: &Path) -> AppResult<Vec<Entry>> {
    if !path.is_absolute() {
        return Err(AppError::new("invalid_path", "Enter an absolute path."));
    }
    let (folder, mut entries) = match fs::metadata(path) {
        Ok(metadata) if metadata.is_file() => {
            return Ok(vec![Entry {
                name: path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into_owned(),
                path: path.to_string_lossy().into_owned(),
                directory: false,
                ignored: false,
            }]);
        }
        Ok(metadata) if metadata.is_dir() => (path, read_entries(&resolve(path, "")?, "")?),
        Ok(_) => return Ok(Vec::new()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            let Some((parent, name)) = path.parent().zip(path.file_name()) else {
                return Ok(Vec::new());
            };
            if !parent.is_dir() {
                return Ok(Vec::new());
            }
            (parent, search(parent, &name.to_string_lossy())?)
        }
        Err(error) => return Err(error.into()),
    };
    entries.retain(|entry| !entry.directory);
    for entry in &mut entries {
        entry.path = folder.join(&entry.path).to_string_lossy().into_owned();
    }
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
    read_document(&resolve(root, relative)?)
}

fn read_document(path: &Path) -> AppResult<Document> {
    let file = open_file(path)?;
    let writable = !file.metadata()?.permissions().readonly()
        && fs::OpenOptions::new().write(true).open(path).is_ok();
    Ok(Document {
        text: read_text(&file)?,
        writable,
    })
}

pub(crate) fn resolve_workspace(root: &Path, path: &Path) -> AppResult<(PathBuf, String)> {
    let root = root.canonicalize()?;
    let path = root.join(path).canonicalize()?;
    let relative = path
        .strip_prefix(&root)
        .map_err(|_| AppError::new("outside_workspace", "The file is outside this workspace."))?;
    let relative = relative
        .to_str()
        .ok_or_else(|| AppError::new("invalid_path", "Choose a UTF-8 file path."))?;
    let path = resolve(&root, relative)?;
    let relative = relative.to_owned();
    Ok((path, relative))
}

pub fn workspace_file_exists(root: &Path, path: &Path) -> bool {
    resolve_workspace(root, path).is_ok_and(|(path, _)| path.is_file())
}

pub fn read_workspace(root: &Path, path: &Path, is_worktree: bool) -> AppResult<(String, Document)> {
    let (path, relative) = resolve_workspace(root, path)?;
    if !is_worktree {
        let document = read_document(&path)?;
        return Ok((relative, document));
    }
    let document = read_absolute(&path)?;
    let tab_path = path.to_str()
        .ok_or_else(|| AppError::new("invalid_path", "Choose a UTF-8 file path."))?;
    Ok((tab_path.to_owned(), document))
}

pub fn read_absolute(path: &Path) -> AppResult<Document> {
    if !path.is_absolute() {
        return Err(AppError::new(
            "invalid_path",
            "Enter an absolute file path.",
        ));
    }
    Ok(Document {
        text: read_text(&open_file(path)?)?,
        writable: false,
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

pub fn write_markdown_copy(source: &Path, destination: &Path, text: &str) -> AppResult<()> {
    let (Some(parent), Some(name)) = (destination.parent(), destination.file_name()) else {
        return Err(AppError::new("invalid_path", "Choose a file to download to."));
    };
    let parent = parent.canonicalize()?;
    let destination = parent.join(name);
    let source_path = source.canonicalize().or_else(|error| {
        if error.kind() != std::io::ErrorKind::NotFound {
            return Err(error);
        }
        // A source deleted while its tab is open can still be exported.
        Ok::<_, std::io::Error>(source.to_path_buf())
    })?;
    let existing = match destination.symlink_metadata() {
        Ok(metadata) => Some(metadata),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => None,
        Err(error) => return Err(error.into()),
    };
    #[cfg(unix)]
    if let (Some(destination_meta), Ok(source_meta)) = (&existing, source_path.metadata()) {
        use std::os::unix::fs::MetadataExt;
        if (destination_meta.dev(), destination_meta.ino()) == (source_meta.dev(), source_meta.ino()) {
            return Err(AppError::new("source_file", "Choose a destination other than the source file."));
        }
    }
    if source_path == destination {
        return Err(AppError::new("source_file", "Choose a destination other than the source file."));
    }
    let mut staged = tempfile::NamedTempFile::new_in(parent)?;
    staged.write_all(text.as_bytes())?;
    if let Some(metadata) = existing {
        if !metadata.is_file() {
            return Err(AppError::new("unsupported_file", "Choose a regular destination file."));
        }
        fs::OpenOptions::new().write(true).open(&destination)?;
        staged.as_file().set_permissions(metadata.permissions())?;
        staged.as_file().sync_all()?;
        staged.persist(destination).map_err(|error| error.error)?;
    } else {
        staged.as_file().sync_all()?;
        staged.persist_noclobber(destination).map_err(|error| error.error)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lists_git_ignored_entries_without_filtering_them_from_search() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path();
        let git = |args: &[&str]| {
            assert!(Command::new("git").args(args).current_dir(root).status().unwrap().success());
        };
        git(&["init", "-q"]);
        fs::write(root.join("tracked.log"), "").unwrap();
        git(&["add", "--", "tracked.log"]);
        fs::write(root.join(".gitignore"), "cache/\n*.log\n").unwrap();
        fs::create_dir(root.join("cache")).unwrap();
        fs::create_dir(root.join("nested")).unwrap();
        fs::write(root.join("cache/output.txt"), "").unwrap();
        fs::write(root.join("nested/.gitignore"), "*.tmp\n!keep.tmp\n").unwrap();
        for path in ["plain.txt", ":local\nfile.log", "nested/drop.tmp", "nested/keep.tmp"] {
            fs::write(root.join(path), "").unwrap();
        }

        let ignored = |folder| {
            list(root, folder).unwrap().into_iter()
                .filter(|entry| entry.ignored).map(|entry| entry.name).collect::<Vec<_>>()
        };
        assert_eq!(ignored(""), ["cache", ":local\nfile.log"]);
        assert_eq!(ignored("cache"), ["output.txt"]);
        assert_eq!(ignored("nested"), ["drop.tmp"]);
        let matches = search(root, "output").unwrap();
        assert_eq!(matches.len(), 1);
        assert!(!matches[0].ignored);

        fs::write(root.join(".gitignore"), "cache/\n").unwrap();
        assert_eq!(ignored(""), ["cache"]);
    }

    #[test]
    fn reads_workspace_files_with_the_correct_tab_paths() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().join("workspace");
        fs::create_dir(&root).unwrap();
        fs::write(root.join("draft note.md"), "workspace content").unwrap();
        fs::write(dir.path().join("draft note.md"), "other content").unwrap();

        let (path, document) = read_workspace(&root, Path::new("./draft note.md"), false).unwrap();
        assert_eq!(path, "draft note.md");
        assert_eq!(document.text, "workspace content");
        let (path, document) = read_workspace(&root, &root.join("draft note.md"), true).unwrap();
        assert_eq!(
            path,
            root.canonicalize().unwrap().join("draft note.md").to_str().unwrap()
        );
        assert!(!document.writable);
    }

    #[test]
    fn rejects_workspace_reads_of_outside_or_unsupported_files() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().join("workspace");
        fs::create_dir(&root).unwrap();
        fs::write(dir.path().join("outside.txt"), "outside").unwrap();
        fs::write(root.join("binary.dat"), b"a\0b").unwrap();
        for reference in ["../outside.txt", "missing.txt", ".", "binary.dat"] {
            assert!(read_workspace(&root, Path::new(reference), false).is_err(), "{reference}");
            assert_eq!(workspace_file_exists(&root, Path::new(reference)), reference == "binary.dat");
        }
        assert!(read_workspace(&root, &dir.path().join("outside.txt"), false).is_err());
        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(dir.path().join("outside.txt"), root.join("alias.txt")).unwrap();
            assert!(read_workspace(&root, Path::new("alias.txt"), false).is_err());
            assert!(!workspace_file_exists(&root, Path::new("alias.txt")));
        }
    }

    #[test]
    fn downloads_exact_markdown_without_replacing_source() {
        let dir = tempfile::tempdir().unwrap();
        let source = dir.path().join("README.md");
        let copy = dir.path().join("copy.md");
        fs::write(&source, "original").unwrap();

        write_markdown_copy(&source, &copy, "# Draft\r\n").unwrap();
        assert_eq!(fs::read(&copy).unwrap(), b"# Draft\r\n");
        write_markdown_copy(&source, &copy, "").unwrap();
        assert_eq!(fs::read(&copy).unwrap(), b"");
        assert!(write_markdown_copy(&source, &source, "changed").is_err());
        #[cfg(unix)]
        {
            let alias = dir.path().join("alias.md");
            fs::hard_link(&source, &alias).unwrap();
            assert!(write_markdown_copy(&source, &alias, "changed").is_err());
            fs::remove_file(&alias).unwrap();
            std::os::unix::fs::symlink(&source, &alias).unwrap();
            assert!(write_markdown_copy(&source, &alias, "changed").is_err());
        }
        assert_eq!(fs::read_to_string(&source).unwrap(), "original");
    }

    #[test]
    fn reads_explicit_absolute_files_without_enabling_writes() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("external file.txt");
        fs::write(&path, "external content").unwrap();
        let document = read_absolute(&path).unwrap();
        assert_eq!(document.text, "external content");
        assert!(!document.writable);
        assert!(read_absolute(Path::new("external file.txt")).is_err());
        assert!(read_absolute(dir.path()).is_err());
    }

    #[test]
    fn searches_within_an_absolute_folder() {
        let dir = tempfile::tempdir().unwrap();
        let folder = dir.path().join("Other Folder");
        fs::create_dir_all(folder.join("nested")).unwrap();
        fs::write(folder.join("notes.txt"), "").unwrap();
        fs::write(folder.join("nested/Report.md"), "").unwrap();
        fs::write(dir.path().join("Report.md"), "").unwrap();

        let results = search_absolute(&folder).unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].name, "notes.txt");
        let results = search_absolute(&folder.join("report")).unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(Path::new(&results[0].path), folder.join("nested/Report.md"));
        let results = search_absolute(&folder.join("notes.txt")).unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(Path::new(&results[0].path), folder.join("notes.txt"));
        assert!(search_absolute(&folder.join("missing")).unwrap().is_empty());
    }

    #[test]
    fn searches_nested_files_by_path_with_tree_visibility() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path();
        for folder in ["src/components", "tests", ".git"] {
            fs::create_dir_all(root.join(folder)).unwrap();
            fs::write(root.join(folder).join("Index.ts"), "").unwrap();
        }
        #[cfg(unix)]
        std::os::unix::fs::symlink(root.join("src"), root.join("linked")).unwrap();

        let paths = |query| {
            search(root, query)
                .unwrap()
                .into_iter()
                .map(|entry| entry.path)
                .collect::<Vec<_>>()
        };
        assert_eq!(
            paths(" INDEX "),
            ["src/components/Index.ts", "tests/Index.ts"]
        );
        assert_eq!(paths("COMPONENTS/index"), ["src/components/Index.ts"]);
        assert!(paths("linked").is_empty());
        assert!(paths("  ").is_empty());
        assert!(paths("missing").is_empty());
    }

    #[test]
    fn browses_searches_and_reads_a_hidden_project_directory() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path();
        let relative = ".claude/skills/example.md";
        fs::create_dir_all(root.join(".claude/skills")).unwrap();
        fs::write(root.join(relative), "example").unwrap();

        assert!(list(root, "").unwrap().iter().any(|entry| entry.name == ".claude" && entry.directory));
        assert_eq!(list(root, ".claude/skills").unwrap()[0].path, relative);
        assert_eq!(search(root, "example").unwrap()[0].path, relative);
        assert_eq!(read(root, relative).unwrap().text, "example");
        assert_eq!(read_workspace(root, &root.join(relative), true).unwrap().1.text, "example");
    }

    #[test]
    #[ignore = "run explicitly to measure filesystem search on a seeded project"]
    fn search_latency_on_5000_files() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path();
        for folder in 0..100 {
            let path = root.join(format!("folder-{folder:03}"));
            fs::create_dir(&path).unwrap();
            for file in 0..50 {
                fs::write(path.join(format!("file-{file:02}.txt")), "").unwrap();
            }
        }

        let mut timings = Vec::new();
        for index in 0..30 {
            let query = match index % 3 {
                0 => format!("file-{index:02}.txt"),
                1 => format!("folder-{index:03}/file"),
                _ => "missing".to_string(),
            };
            let start = std::time::Instant::now();
            let matches = search(root, &query).unwrap();
            timings.push(start.elapsed());
            assert_eq!(matches.len(), [100, 50, 0][index % 3]);
        }
        timings.sort_unstable();
        eprintln!("Filesystem search p95 over 30 queries: {:?}", timings[28]);
    }

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
