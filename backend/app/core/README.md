# app/core/

Contains cross-cutting baseline configurations and utilities utilized by every layer of the backend application.

## Directory Responsibilities

- `config.py`: Environment-specific settings loading utilizing Pydantic Settings (supporting `development`, `testing`, and `production`).
- `security.py`: Cryptographic helpers, token sign/verify operations, and passwords encryption.
- `logging.py`: Structured JSON logger config injecting context-aware parameters (e.g. Request IDs).
- `exceptions.py`: Centralized HTTP mapping models derived from custom root domain exceptions.
