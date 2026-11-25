use crate::{
    error::{AppError, AppResult},
    state::AppState,
    store,
};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    fs,
    io::Read,
    path::{Path, PathBuf},
    process::Command,
    sync::Arc,
};

const SHARED: &str = "shared";
const PLUGIN: &str = "project-skills";

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
struct SkillId {
    source_id: String,
    directory: String,
}

#[derive(Clone, Deserialize, Serialize)]
struct Source {
    id: String,
    path: PathBuf,
}

#[derive(Default, Deserialize, Serialize)]
struct Config {
    sources: Vec<Source>,
    enabled: Vec<SkillId>,
}

#[derive(Serialize)]
struct SourceStatus {
    #[serde(flatten)]
    source: Source,
    available: bool,
}

#[derive(Serialize)]
struct Skill {
    #[serde(flatten)]
    id: SkillId,
    name: String,
    description: String,
    path: PathBuf,
    enabled: bool,
    native: bool,
    global: bool,
    reason: Option<String>,
}

#[derive(Serialize)]
pub struct Catalog {
    sources: Vec<SourceStatus>,
    skills: Vec<Skill>,
    enabled: Vec<SkillId>,
}

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Change {
    Add {
        path: String,
    },
    Set {
        source_id: String,
        directory: String,
        enabled: bool,
    },
    Remove {
        source_id: String,
        confirmed: Vec<String>,
    },
}

fn read_config(st: &AppState, project_id: &str) -> AppResult<(store::Project, Option<String>)> {
    let db = st.db.lock();
    let project = store::project_get(&db, project_id)?;
    let raw = db
        .query_row(
            "SELECT config FROM project_skills WHERE project_id=?1",
            [project_id],
            |row| row.get(0),
        )
        .optional()?;
    Ok((project, raw))
}

fn decode(raw: Option<&str>) -> AppResult<Config> {
    Ok(raw
        .map(serde_json::from_str)
        .transpose()?
        .unwrap_or_default())
}

fn claude_home() -> Option<PathBuf> {
    std::env::var_os("CLAUDE_CONFIG_DIR")
        .map(PathBuf::from)
        .or_else(|| std::env::var_os("HOME").map(|home| PathBuf::from(home).join(".claude")))
}

fn git_path(cwd: &Path, option: &str) -> Option<PathBuf> {
    let output = Command::new("git")
        .args(["rev-parse", "--path-format=absolute", option])
        .current_dir(cwd)
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    Some(PathBuf::from(
        String::from_utf8(output.stdout)
            .ok()?
            .trim_end_matches(['\n', '\r']),
    ))
}

fn native_sources(cwd: &Path) -> Vec<Source> {
    let root = git_path(cwd, "--show-toplevel");
    let mut paths = Vec::new();
    for dir in cwd.ancestors() {
        paths.push(dir.join(".claude/skills"));
        if root.as_deref().is_none_or(|root| root == dir) {
            break;
        }
    }
    if let Some(root) = root {
        if !root.join(".claude/skills").is_dir() {
            if let Some(main) = git_path(cwd, "--git-common-dir")
                .filter(|path| path.file_name().is_some_and(|name| name == ".git"))
                .and_then(|path| path.parent().map(Path::to_owned))
                .filter(|path| *path != root)
            {
                paths.push(main.join(".claude/skills"));
            }
        }
    }
    let mut sources: Vec<_> = paths
        .into_iter()
        .map(|path| Source {
            id: format!("native:{}", path.display()),
            path,
        })
        .collect();
    if let Some(home) = claude_home() {
        sources.push(Source {
            id: "native:user".into(),
            path: home.join("skills"),
        });
    }
    sources
}

fn frontmatter(path: &Path) -> AppResult<(serde_yaml::Mapping, String)> {
    if !path.is_file() {
        return Err(AppError::new(
            "skill_definition",
            "Missing or unreadable SKILL.md",
        ));
    }
    let mut text = String::new();
    fs::File::open(path)?
        .take(1024 * 1024 + 1)
        .read_to_string(&mut text)?;
    if text.len() > 1024 * 1024 {
        return Err(AppError::new(
            "skill_definition",
            "Skill definition exceeds 1 MiB",
        ));
    }
    let mut lines = text.split_inclusive('\n');
    if lines.next().is_none_or(|line| line.trim_end() != "---") {
        return Err(AppError::new("skill_definition", "Missing frontmatter"));
    }
    let mut yaml = String::new();
    while let Some(line) = lines.next() {
        if line.trim_end() == "---" {
            let fields = serde_yaml::from_str(&yaml)
                .map_err(|_| AppError::new("skill_definition", "Invalid frontmatter"))?;
            return Ok((fields, lines.collect()));
        }
        yaml.push_str(line);
    }
    Err(AppError::new("skill_definition", "Unclosed frontmatter"))
}

fn valid_name(name: &str) -> bool {
    !name.is_empty()
        && name
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || b"-_.".contains(&c))
}

fn scan(source: &Source, native: bool) -> (bool, Vec<Skill>) {
    let Ok(entries) = fs::read_dir(&source.path) else {
        return (false, Vec::new());
    };
    let mut skills = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        let Ok(directory) = entry.file_name().into_string() else {
            continue;
        };
        if directory.starts_with('.') || !path.is_dir() {
            continue;
        }
        let mut skill = Skill {
            id: SkillId {
                source_id: source.id.clone(),
                directory: directory.clone(),
            },
            name: directory.clone(),
            description: String::new(),
            path,
            enabled: false,
            native,
            global: source.id == "native:user",
            reason: None,
        };
        match frontmatter(&skill.path.join("SKILL.md")) {
            Ok((fields, _)) => {
                if let Some(name) = fields.get("name").and_then(serde_yaml::Value::as_str) {
                    skill.name = name.to_owned();
                }
                if let Some(description) = fields
                    .get("description")
                    .and_then(serde_yaml::Value::as_str)
                {
                    skill.description = description.trim().to_owned();
                }
                if !valid_name(&skill.name) || !valid_name(&directory) {
                    skill.reason = Some("Invalid skill name".into());
                } else if skill.description.is_empty() && !native {
                    skill.reason = Some("Missing skill description".into());
                }
            }
            Err(error) if !native || !skill.path.join("SKILL.md").is_file() => {
                skill.reason = Some(if error.code == "io" {
                    "Cannot read SKILL.md".into()
                } else {
                    error.message
                });
            }
            Err(_) => {}
        }
        if !native || skill.reason.is_none() {
            skills.push(skill);
        }
    }
    skills.sort_by(|a, b| a.id.directory.cmp(&b.id.directory));
    (true, skills)
}

fn catalog(data: &Path, cwd: &Path, config: &Config, settings: bool) -> Catalog {
    let shared = Source {
        id: SHARED.into(),
        path: data.join("skills"),
    };
    let native: Vec<_> = native_sources(cwd)
        .iter()
        .flat_map(|source| scan(source, true).1)
        .collect();
    let mut sources = Vec::new();
    let mut skills = Vec::new();
    let mut names = HashSet::new();
    let mut reserved = HashSet::new();
    for native_skill in &native {
        if !settings || native_skill.global {
            reserved.insert(native_skill.name.as_str());
            reserved.insert(native_skill.id.directory.as_str());
        }
    }
    for source in std::iter::once(&shared).chain(&config.sources) {
        let (available, rows) = scan(source, false);
        sources.push(SourceStatus {
            source: source.clone(),
            available,
        });
        for mut skill in rows {
            skill.enabled = config.enabled.contains(&skill.id);
            let name_seen = !names.insert(skill.name.clone());
            let alias_seen =
                skill.name != skill.id.directory && !names.insert(skill.id.directory.clone());
            if skill.reason.is_none() {
                if reserved.contains(skill.name.as_str())
                    || reserved.contains(skill.id.directory.as_str())
                {
                    skill.reason = Some("A Claude skill already uses this name".into());
                } else if name_seen || alias_seen {
                    skill.reason = Some("An earlier source uses this name".into());
                }
            }
            skills.push(skill);
        }
    }
    for id in &config.enabled {
        if !skills.iter().any(|skill| skill.id == *id) {
            if let Some(source) = sources
                .iter()
                .find(|source| source.source.id == id.source_id)
            {
                skills.push(Skill {
                    id: id.clone(),
                    name: id.directory.clone(),
                    description: String::new(),
                    path: source.source.path.join(&id.directory),
                    enabled: true,
                    native: false,
                    global: false,
                    reason: Some("Skill source or folder is unavailable".into()),
                });
            }
        }
    }
    skills.extend(native);
    Catalog {
        sources,
        skills,
        enabled: config.enabled.clone(),
    }
}

#[tauri::command]
pub async fn project_skill_catalog(
    st: tauri::State<'_, Arc<AppState>>,
    project_id: String,
) -> AppResult<Catalog> {
    let (project, raw) = read_config(&st, &project_id)?;
    let data = st.data_dir.clone();
    blocking(move || {
        fs::create_dir_all(data.join("skills"))?;
        Ok(catalog(
            &data,
            Path::new(&project.path),
            &decode(raw.as_deref())?,
            true,
        ))
    })
    .await
}

async fn blocking<T: Send + 'static>(
    run: impl FnOnce() -> AppResult<T> + Send + 'static,
) -> AppResult<T> {
    tokio::task::spawn_blocking(run)
        .await
        .map_err(|_| AppError::new("project_skills", "Could not read project skills"))?
}

#[tauri::command]
pub async fn project_skill_change(
    st: tauri::State<'_, Arc<AppState>>,
    project_id: String,
    change: Change,
) -> AppResult<()> {
    let (project, raw) = read_config(&st, &project_id)?;
    let config = decode(raw.as_deref())?;
    let data = st.data_dir.clone();
    let updated =
        blocking(move || apply_change(config, change, &data, Path::new(&project.path))).await?;
    let next = serde_json::to_string(&updated)?;
    save_config(&st.db.lock(), &project_id, raw.as_deref(), &next)
}

fn save_config(
    db: &rusqlite::Connection,
    project_id: &str,
    previous: Option<&str>,
    next: &str,
) -> AppResult<()> {
    let changed = db.execute(
        "INSERT INTO project_skills(project_id, config)
         SELECT ?1, ?2 WHERE ?3 IS NULL OR EXISTS (SELECT 1 FROM project_skills WHERE project_id=?1)
         ON CONFLICT(project_id) DO UPDATE SET config=excluded.config WHERE project_skills.config=?3",
        params![project_id, next, previous],
    )?;
    if changed == 0 {
        return Err(AppError::new(
            "skills_changed",
            "Settings changed. Refresh and try again.",
        ));
    }
    Ok(())
}

fn apply_change(mut config: Config, change: Change, data: &Path, cwd: &Path) -> AppResult<Config> {
    match change {
        Change::Add { path } => {
            let path = path.trim();
            let expanded = if let Some(rest) = path.strip_prefix("~/") {
                std::env::var_os("HOME")
                    .map(|home| PathBuf::from(home).join(rest))
                    .ok_or_else(|| AppError::new("skill_source", "Home directory is unavailable"))?
            } else {
                PathBuf::from(path)
            };
            if !expanded.is_absolute() {
                return Err(AppError::new(
                    "skill_source",
                    "Enter an absolute folder path",
                ));
            }
            let path = expanded
                .canonicalize()
                .map_err(|_| AppError::new("skill_source", "Skill folder is unavailable"))?;
            fs::read_dir(&path)
                .map_err(|_| AppError::new("skill_source", "Skill folder cannot be read"))?;
            let shared = data
                .join("skills")
                .canonicalize()
                .unwrap_or_else(|_| data.join("skills"));
            if path == shared || config.sources.iter().any(|source| source.path == path) {
                return Err(AppError::new(
                    "skill_source",
                    "This folder is already a source",
                ));
            }
            config.sources.push(Source {
                id: store::new_id(),
                path,
            });
        }
        Change::Set {
            source_id,
            directory,
            enabled,
        } => {
            let id = SkillId {
                source_id,
                directory,
            };
            if enabled {
                let valid = catalog(data, cwd, &config, true)
                    .skills
                    .into_iter()
                    .any(|skill| skill.id == id && !skill.native && skill.reason.is_none());
                if !valid {
                    return Err(AppError::new(
                        "skill_unavailable",
                        "This skill cannot be enabled",
                    ));
                }
                if !config.enabled.contains(&id) {
                    config.enabled.push(id);
                }
            } else {
                config.enabled.retain(|entry| *entry != id);
            }
        }
        Change::Remove {
            source_id,
            mut confirmed,
        } => {
            let mut current: Vec<_> = config
                .enabled
                .iter()
                .filter(|id| id.source_id == source_id)
                .map(|id| id.directory.clone())
                .collect();
            current.sort();
            confirmed.sort();
            if current != confirmed {
                return Err(AppError::new(
                    "skills_changed",
                    "Enabled skills changed. Review the source again.",
                ));
            }
            if !config.sources.iter().any(|source| source.id == source_id) {
                return Err(AppError::new("skill_source", "Source was already removed"));
            }
            config.sources.retain(|source| source.id != source_id);
            config.enabled.retain(|id| id.source_id != source_id);
        }
    }
    Ok(config)
}

pub fn plugin_path(session_dir: &Path) -> PathBuf {
    session_dir.join(PLUGIN)
}

pub async fn prepare(st: &AppState, workspace: &store::Workspace, sid: &str) -> Vec<String> {
    let result = read_config(st, &workspace.project_id).and_then(|(_, raw)| decode(raw.as_deref()));
    let data = st.data_dir.clone();
    let cwd = PathBuf::from(&workspace.work_dir);
    let session = st.session_dir(sid);
    match blocking(move || stage(&data, &cwd, &session, &result?)).await {
        Ok(warnings) => warnings,
        Err(error) => vec![format!(
            "Could not attach project skills: {}",
            error.message
        )],
    }
}

fn stage(data: &Path, cwd: &Path, session: &Path, config: &Config) -> AppResult<Vec<String>> {
    if config.enabled.is_empty() {
        return Ok(Vec::new());
    }
    fs::create_dir_all(session)?;
    let staging = tempfile::tempdir_in(session)?;
    let root = staging.path();
    fs::create_dir(root.join(".claude-plugin"))?;
    fs::write(
        root.join(".claude-plugin/plugin.json"),
        r#"{"name":"herdsman-project","description":"Skills enabled for this Herdsman session"}"#,
    )?;
    let skills_dir = root.join("skills");
    fs::create_dir(&skills_dir)?;
    let rows = catalog(data, cwd, config, false).skills;
    let mut warnings = Vec::new();
    let mut copied = 0;
    for id in &config.enabled {
        let Some(skill) = rows.iter().find(|skill| skill.id == *id) else {
            warnings.push(format!("{}: skill source is unavailable", id.directory));
            continue;
        };
        if let Some(reason) = &skill.reason {
            warnings.push(format!("{}: {reason}", skill.name));
            continue;
        }
        let target = skills_dir.join(&id.directory);
        let staged = (|| -> AppResult<()> {
            let source = skill.path.canonicalize()?;
            copy_resources(&source, &source, &target, &mut HashSet::new())?;
            let definition = target.join("SKILL.md");
            let (mut fields, body) = frontmatter(&definition)?;
            fields.remove("allowed-tools");
            fields.remove("hooks");
            let yaml = serde_yaml::to_string(&fields).map_err(|_| {
                AppError::new("skill_definition", "Could not package skill definition")
            })?;
            fs::write(definition, format!("---\n{yaml}---\n{body}"))?;
            Ok(())
        })();
        match staged {
            Ok(()) => copied += 1,
            Err(error) => {
                if target.exists() {
                    fs::remove_dir_all(&target)?;
                }
                warnings.push(format!("{}: {}", skill.name, error.message));
            }
        }
    }
    if copied > 0 {
        fs::rename(root, plugin_path(session))?;
    }
    Ok(warnings)
}

fn copy_resources(
    root: &Path,
    from: &Path,
    to: &Path,
    ancestors: &mut HashSet<PathBuf>,
) -> AppResult<()> {
    let from = from.canonicalize()?;
    if !from.starts_with(root) || ancestors.contains(&from) {
        return Err(AppError::new(
            "skill_resource",
            "Resource link leaves the skill or forms a cycle",
        ));
    }
    let metadata = fs::metadata(&from)?;
    if metadata.is_dir() {
        fs::create_dir(to)?;
        ancestors.insert(from.clone());
        for entry in fs::read_dir(&from)? {
            let entry = entry?;
            copy_resources(root, &entry.path(), &to.join(entry.file_name()), ancestors)?;
        }
        ancestors.remove(&from);
    } else if metadata.is_file() {
        fs::copy(from, to)?;
    } else {
        return Err(AppError::new(
            "skill_resource",
            "Unsupported skill resource",
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn write_skill(root: &Path, directory: &str, body: &str) -> PathBuf {
        let folder = root.join(directory);
        fs::create_dir_all(&folder).unwrap();
        fs::write(
            folder.join("SKILL.md"),
            format!("---\nname: {directory}\ndescription: >\n  Fixture description\nallowed-tools: Bash\n---\n{body}"),
        ).unwrap();
        folder
    }

    #[test]
    fn launch_uses_project_selection_and_native_cwd() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path();
        let managed = root.join("managed");
        let folder = write_skill(&managed, "herdsman-test-greeting", "PROJECT_A");
        fs::write(folder.join("example.md"), "A supporting resource").unwrap();
        let native_cwd = root.join("native-cwd");
        write_skill(
            &native_cwd.join(".claude/skills"),
            "herdsman-test-greeting",
            "NATIVE",
        );

        let id = SkillId {
            source_id: "a-source".into(),
            directory: "herdsman-test-greeting".into(),
        };
        let config = Config {
            sources: vec![Source {
                id: id.source_id.clone(),
                path: managed,
            }],
            enabled: vec![id.clone()],
        };
        let a = root.join("session-a");
        assert!(stage(root, root, &a, &config).unwrap().is_empty());
        let staged = plugin_path(&a).join("skills").join(&id.directory);
        let (fields, body) = frontmatter(&staged.join("SKILL.md")).unwrap();
        assert!(!fields.contains_key("allowed-tools"));
        assert!(frontmatter(&folder.join("SKILL.md"))
            .unwrap()
            .0
            .contains_key("allowed-tools"));
        assert_eq!(body, "PROJECT_A");
        assert_eq!(
            fs::read_to_string(staged.join("example.md")).unwrap(),
            "A supporting resource"
        );

        let b = root.join("session-b");
        assert!(stage(root, root, &b, &Config::default())
            .unwrap()
            .is_empty());
        assert!(!plugin_path(&b).exists());

        let collision = root.join("session-native");
        let warnings = stage(root, &native_cwd, &collision, &config).unwrap();
        assert_eq!(warnings.len(), 1);
        assert!(warnings[0].contains("already uses this name"));
        assert!(!plugin_path(&collision).exists());

        fs::rename(&folder, root.join("unavailable")).unwrap();
        let missing = root.join("session-missing");
        assert_eq!(stage(root, root, &missing, &config).unwrap().len(), 1);
        assert!(
            staged.is_dir(),
            "a previously launched session keeps its copy"
        );
    }

    #[test]
    fn configuration_survives_reopen_and_rejects_stale_saves() {
        let temp = tempfile::tempdir().unwrap();
        let path = temp.path().join("herdsman.db");
        let mut db = store::open(&path).unwrap();
        let a = store::project_add(&db, "A", "/a").unwrap();
        let b = store::project_add(&db, "B", "/b").unwrap();
        let original = r#"{"sources":[],"enabled":[{"source_id":"shared","directory":"fixture"}]}"#;
        let empty = r#"{"sources":[],"enabled":[]}"#;
        save_config(&db, &a.id, None, original).unwrap();
        save_config(&db, &b.id, None, empty).unwrap();
        assert!(save_config(&db, &a.id, None, empty).is_err());
        assert!(save_config(&db, &a.id, Some(empty), empty).is_err());
        {
            let interrupted = db.transaction().unwrap();
            save_config(&interrupted, &a.id, Some(original), empty).unwrap();
        }
        drop(db);
        let db = store::open(&path).unwrap();
        let load = |id: &str| -> String {
            db.query_row(
                "SELECT config FROM project_skills WHERE project_id=?1",
                [id],
                |row| row.get(0),
            )
            .unwrap()
        };
        assert_eq!(load(&a.id), original);
        assert_eq!(load(&b.id), empty);
        save_config(&db, &a.id, Some(original), empty).unwrap();
        assert_eq!(load(&a.id), empty);
    }

    #[test]
    fn uses_native_checkout_rules_in_linked_worktrees() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().canonicalize().unwrap();
        let main = root.join("main");
        let worktree = root.join("worktree");
        fs::create_dir(&main).unwrap();
        let git = |args: &[&str]| {
            let output = Command::new("git")
                .args(args)
                .current_dir(&main)
                .output()
                .unwrap();
            assert!(
                output.status.success(),
                "{}",
                String::from_utf8_lossy(&output.stderr)
            );
        };
        git(&["init", "-q"]);
        git(&[
            "-c",
            "user.name=Fixture",
            "-c",
            "user.email=fixture@example.test",
            "-c",
            "commit.gpgsign=false",
            "commit",
            "--allow-empty",
            "-qm",
            "Fixture",
        ]);
        git(&["worktree", "add", "--detach", worktree.to_str().unwrap()]);
        let main_skills = main.join(".claude/skills");
        write_skill(&main_skills, "herdsman-worktree-fixture", "NATIVE");
        assert!(native_sources(&worktree)
            .iter()
            .any(|source| source.path == main_skills));
        fs::create_dir_all(worktree.join(".claude/skills")).unwrap();
        assert!(!native_sources(&worktree)
            .iter()
            .any(|source| source.path == main_skills));
    }

    #[test]
    fn source_removal_requires_current_selection_and_keeps_files() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path();
        let source = root.join("source");
        let skill = write_skill(&source, "herdsman-test-removal", "FIXTURE");
        let mut config = apply_change(
            Config::default(),
            Change::Add {
                path: source.display().to_string(),
            },
            root,
            root,
        )
        .unwrap();
        let id = config.sources[0].id.clone();
        config = apply_change(
            config,
            Change::Set {
                source_id: id.clone(),
                directory: "herdsman-test-removal".into(),
                enabled: true,
            },
            root,
            root,
        )
        .unwrap();
        let raw = serde_json::to_string(&config).unwrap();
        assert!(apply_change(
            decode(Some(&raw)).unwrap(),
            Change::Remove {
                source_id: id.clone(),
                confirmed: vec![]
            },
            root,
            root
        )
        .is_err());
        let updated = apply_change(
            config,
            Change::Remove {
                source_id: id,
                confirmed: vec!["herdsman-test-removal".into()],
            },
            root,
            root,
        )
        .unwrap();
        assert!(updated.sources.is_empty());
        assert!(updated.enabled.is_empty());
        assert!(skill.join("SKILL.md").is_file());
    }
}
