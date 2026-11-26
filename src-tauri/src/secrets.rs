//! spec 071: secret values (MCP env and headers) live in the Keychain, never in SQLite or logs.
use crate::error::{AppError, AppResult};
use parking_lot::Mutex;
use std::collections::HashMap;

const SERVICE: &str = "app.herdsman.mcp";

pub trait SecretStore: Send + Sync {
    fn get(&self, account: &str) -> AppResult<Option<String>>;
    fn set(&self, account: &str, value: &str) -> AppResult<()>;
    fn delete(&self, account: &str) -> AppResult<()>;
}

pub struct Keychain;

fn keychain_error(_: keyring::Error) -> AppError {
    AppError::new("keychain", "Could not access the Keychain")
}

impl SecretStore for Keychain {
    fn get(&self, account: &str) -> AppResult<Option<String>> {
        match keyring::Entry::new(SERVICE, account).and_then(|entry| entry.get_password()) {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(error) => Err(keychain_error(error)),
        }
    }

    fn set(&self, account: &str, value: &str) -> AppResult<()> {
        keyring::Entry::new(SERVICE, account)
            .and_then(|entry| entry.set_password(value))
            .map_err(keychain_error)
    }

    fn delete(&self, account: &str) -> AppResult<()> {
        match keyring::Entry::new(SERVICE, account).and_then(|entry| entry.delete_credential()) {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => Err(keychain_error(error)),
        }
    }
}

/// In-memory store for tests and for `AppState::new` (never touches the real Keychain).
#[derive(Default)]
pub struct MemorySecrets(Mutex<HashMap<String, String>>);

impl MemorySecrets {
    pub fn len(&self) -> usize {
        self.0.lock().len()
    }
}

impl SecretStore for MemorySecrets {
    fn get(&self, account: &str) -> AppResult<Option<String>> {
        Ok(self.0.lock().get(account).cloned())
    }

    fn set(&self, account: &str, value: &str) -> AppResult<()> {
        self.0.lock().insert(account.into(), value.into());
        Ok(())
    }

    fn delete(&self, account: &str) -> AppResult<()> {
        self.0.lock().remove(account);
        Ok(())
    }
}
