# app/repositories/

Implements the **Repository Pattern** to decoupling business services from underlying database driver implementations. Services interact with interface descriptors, making database swaps or unit test mocking trivial.

## Directory Responsibilities

Every repository manages standard CRUD operations for its domain model:
- `user_repo.py`: Creates, queries, and updates user entities.
- `task_repo.py`: Persists task definitions, state changes, and output summaries.
- `memory_repo.py`: Records and recalls user memory items.
- `vault_repo.py`: Stores binary encrypted payloads (Vault Secrets).
- `document_repo.py`: Stores metadata corresponding to user document uploads.
- `agent_repo.py`: Queries configuration records for active plugins.
