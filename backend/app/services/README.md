# app/services/

Houses business logic operations executing functional use cases of the platform. Services depend entirely on abstraction interfaces (e.g. database repositories) injected dynamically at runtime.

## Directory Responsibilities

- `auth_service.py`: signup, credential checks, token creation, refresh-rotations.
- `user_service.py`: core profile changes and preference controls.
- `task_service.py`: submits instruction workflows, invokes agents, tracks lifecycle.
- `memory_service.py`: orchestrates episodic context recall and retention logic.
- `vault_service.py`: mediates per-user master key decryption and stores secrets.
- `document_service.py`: processes and stores documents inside object storage.
- `notification_service.py`: broadcasts real-time events to user connections.
- `scheduler_service.py`: routes delayed background actions using APScheduler.
