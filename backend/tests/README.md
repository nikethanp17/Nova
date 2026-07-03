# tests/

Contains the test suite for checking functional and structural stability of backend systems.

## Directory Responsibilities

- **`unit/`**: Isolated unit tests targeting individual services, components, and functions. All dependencies are mocked.
- **`integration/`**: System integration tests verifying component cooperation (e.g. database client persistence, API endpoints).
- `conftest.py`: Defines shared pytest fixtures (client adapters, dependency overrides, fake configurations).
