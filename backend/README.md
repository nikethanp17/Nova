# NOVA Backend

> AI-Powered Personal Operations System — Backend Service

## Architecture

The backend follows a **layered hexagonal architecture** (Ports & Adapters) built as a **production-grade modular monolith**.

```
Request → CORS → Rate Limiter → Request Logger → [Auth] → Route Handler → Response
```

### Layer Responsibilities

| Layer | Directory | Purpose |
|---|---|---|
| **Presentation** | `app/api/` | REST endpoints, WebSocket handlers, Pydantic schemas |
| **Application** | `app/services/` | Business logic, use cases |
| **Domain** | `app/agents/`, `app/memory/`, `app/vault/`, `app/browser/` | Core domain modules |
| **Infrastructure** | `app/database/`, `app/repositories/` | Data access, external services |
| **Cross-cutting** | `app/core/`, `app/middleware/`, `app/utils/` | Config, logging, security, middleware |

### Folder Structure

```
backend/
├── app/
│   ├── api/                    # REST endpoints + schemas
│   │   ├── v1/                 # Versioned API routes
│   │   ├── schemas/            # Pydantic request/response models
│   │   └── websocket/          # WebSocket handlers
│   ├── core/                   # Config, logging, exceptions, security
│   ├── database/               # MongoDB connection + migrations
│   ├── repositories/           # Data access layer (repository pattern)
│   ├── services/               # Business logic (use cases)
│   ├── agents/                 # AI agent orchestration
│   │   └── plugins/            # Pluggable agent implementations
│   ├── browser/                # Playwright browser automation
│   ├── memory/                 # AI memory module
│   ├── vault/                  # Encrypted secret vault
│   ├── utils/                  # Shared utilities
│   ├── middleware/             # Custom ASGI middleware
│   └── main.py                 # FastAPI app factory
├── tests/                      # Test suite
│   ├── unit/
│   └── integration/
├── docker/                     # Docker configuration
├── docs/                       # Backend documentation
├── pyproject.toml              # Dependencies + tool config
├── Makefile                    # Dev commands
├── .env.example                # Environment variable template
└── README.md                   # This file
```

## Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) — Python package manager

## Quick Start

```bash
# 1. Install dependencies
make install

# 2. Create environment file
cp .env.example .env

# 3. Start development server
make dev

# 4. Verify
curl http://localhost:8000/
curl http://localhost:8000/health
```

## Development Commands

| Command | Description |
|---|---|
| `make install` | Install all dependencies with uv |
| `make dev` | Start dev server with hot reload |
| `make serve` | Start production server (4 workers) |
| `make lint` | Run Ruff linter |
| `make format` | Run Ruff formatter |
| `make type-check` | Run mypy type checker |
| `make check` | Run all code quality checks |
| `make test` | Run all tests |
| `make test-unit` | Run unit tests only |
| `make docker-build` | Build Docker image |
| `make docker-up` | Start Docker containers |
| `make docker-down` | Stop Docker containers |
| `make clean` | Remove caches and generated files |

## API Endpoints

All business endpoints are served under `/api/v1/`.

| Method | Path | Description |
|---|---|---|
| `GET /` | Root info | Returns app name, version, status |
| `GET /health` | Health check | Returns health status, version, environment |
| `GET /api/v1/...` | Versioned API | All business endpoints (auth, tasks, etc.) |

## Tech Stack

- **Framework:** FastAPI
- **Language:** Python 3.13
- **Package Manager:** uv
- **Validation:** Pydantic v2
- **Linting:** Ruff
- **Type Checking:** mypy
- **Testing:** pytest + pytest-asyncio
- **Containerization:** Docker

## Design Principles

1. **Type hints everywhere** — all functions, parameters, and return types are annotated
2. **Dependency injection** — all services injected via FastAPI `Depends()`
3. **Repository pattern** — service layer never accesses the database directly
4. **Standard response envelope** — all endpoints return a consistent JSON structure
5. **Structured logging** — JSON logs with request IDs
6. **Zero hard-coded secrets** — all config via environment variables
