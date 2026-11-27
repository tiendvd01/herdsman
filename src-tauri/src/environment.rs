use crate::error::{AppError, AppResult};
use crate::hc::Terminal;
use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Environment {
    #[default]
    Production,
    Development,
}

impl Environment {
    pub(crate) const fn current() -> Self {
        if tauri::is_dev() {
            Self::Development
        } else {
            Self::Production
        }
    }

    pub(crate) const fn name(self) -> &'static str {
        match self {
            Self::Production => "Production",
            Self::Development => "Development",
        }
    }

    const fn identifier(self) -> &'static str {
        match self {
            Self::Production => "app.herdsman",
            Self::Development => "app.herdsman.dev",
        }
    }

    pub(crate) const fn hc_label(self) -> (&'static str, &'static str) {
        match self {
            Self::Production => ("herdsman.app", "1"),
            Self::Development => ("herdsman.app", "development"),
        }
    }

    pub(crate) fn owns(self, terminal: &Terminal) -> bool {
        let (key, value) = self.hc_label();
        terminal.label(key) == Some(value)
    }

    pub(crate) const fn keychain_service(self) -> &'static str {
        match self {
            Self::Production => "app.herdsman.mcp",
            Self::Development => "app.herdsman.dev.mcp",
        }
    }

    pub(crate) fn validate_identifier(self, identifier: &str) -> AppResult<()> {
        if identifier != self.identifier() {
            return Err(AppError::new(
                "app_identity",
                format!(
                    "Expected identifier {}. Launch development with pnpm tauri dev.",
                    self.identifier()
                ),
            ));
        }
        Ok(())
    }

    pub(crate) fn open_data_dir(
        self,
        base: &Path,
        production_override: Option<PathBuf>,
    ) -> AppResult<PathBuf> {
        let production =
            production_override.unwrap_or_else(|| base.join(Self::Production.identifier()));
        let development = base.join(Self::Development.identifier());
        let (current, other) = match self {
            Self::Production => (production, development),
            Self::Development => (development, production),
        };
        let resolved =
            |path: &Path| std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
        if resolved(&current) == resolved(&other)
            || (self == Self::Development
                && resolved(&current) == resolved(&base.join(Self::Production.identifier())))
        {
            return Err(AppError::new(
                "app_data",
                "Development and production data directories overlap.",
            ));
        }
        if self == Self::Development {
            for name in [
                "",
                "sock",
                "sessions",
                "herdsman.db",
                "herdsman.db-wal",
                "herdsman.db-shm",
                "themes",
                "worktrees",
            ] {
                let path = if name.is_empty() {
                    current.clone()
                } else {
                    current.join(name)
                };
                match std::fs::symlink_metadata(&path) {
                    Ok(metadata) if metadata.file_type().is_symlink() => {
                        return Err(AppError::new(
                            "app_data",
                            "Development data must use its own files and directories.",
                        ));
                    }
                    Ok(_) => {}
                    Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
                    Err(error) => return Err(error.into()),
                }
            }
        }
        std::fs::create_dir_all(current.join("sock"))?;
        Ok(current)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::store;

    #[test]
    fn development_starts_empty_and_production_reopens_legacy_data() {
        let root = tempfile::tempdir().unwrap();
        let production = root.path().join("app.herdsman");
        let db = store::open(&production.join("herdsman.db")).unwrap();
        store::project_add(&db, "Existing project", "/tmp/legacy-herdsman-project").unwrap();
        store::setting_set(&db, "theme", "dark").unwrap();
        drop(db);

        let dev = Environment::Development
            .open_data_dir(root.path(), None)
            .unwrap();
        let dev_db = store::open(&dev.join("herdsman.db")).unwrap();
        assert!(store::project_list(&dev_db).unwrap().is_empty());
        store::setting_set(&dev_db, "theme", "light").unwrap();

        for _ in 0..2 {
            let dir = Environment::Production
                .open_data_dir(root.path(), None)
                .unwrap();
            let db = store::open(&dir.join("herdsman.db")).unwrap();
            assert_eq!(
                store::project_list(&db).unwrap()[0].name,
                "Existing project"
            );
            assert_eq!(store::project_list(&db).unwrap().len(), 1);
            assert_eq!(
                store::setting_get(&db, "theme").unwrap().as_deref(),
                Some("dark")
            );
        }
        assert_eq!(
            Environment::Production.keychain_service(),
            "app.herdsman.mcp"
        );
        assert_ne!(
            Environment::Development.keychain_service(),
            Environment::Production.keychain_service()
        );
    }

    #[test]
    fn development_startup_fails_before_opening_production_storage() {
        let root = tempfile::tempdir().unwrap();
        let production = root.path().join("app.herdsman");
        assert!(Environment::Development
            .validate_identifier("app.herdsman")
            .is_err());
        assert!(Environment::Production
            .validate_identifier("app.herdsman.dev")
            .is_err());
        assert!(!production.exists());

        let dev = root.path().join("app.herdsman.dev");
        std::fs::write(&dev, "unavailable").unwrap();
        assert!(Environment::Development
            .open_data_dir(root.path(), None)
            .is_err());
        assert!(!production.exists());
    }

    #[test]
    fn development_ignores_inherited_production_override_and_rejects_aliases() {
        let root = tempfile::tempdir().unwrap();
        let production = root.path().join("custom");
        std::fs::create_dir(&production).unwrap();
        let dev = Environment::Development
            .open_data_dir(root.path(), Some(production.clone()))
            .unwrap();
        assert_eq!(dev, root.path().join("app.herdsman.dev"));
        assert!(!production.join("sock").exists());
        std::os::unix::fs::symlink(&production, dev.join("herdsman.db")).unwrap();
        assert!(Environment::Development
            .open_data_dir(root.path(), Some(production))
            .is_err());
        assert!(Environment::Production
            .open_data_dir(root.path(), Some(dev))
            .is_err());
    }
}
