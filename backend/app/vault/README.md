# app/vault/

Safeguards cryptographically encrypted payloads containing high-sensitivity credentials.

## Directory Responsibilities

- `vault_manager.py`: Exposes CRUD actions for secret keys.
- `encryption.py`: Resolves AES-256-GCM symmetric block cipher logic.
- `key_management.py`: Handles per-user data encryption key (DEK) creation and retrieval.
