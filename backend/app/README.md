# app/

This directory contains the main application code of the NOVA backend monolith.

## Directory Responsibilities

- **`api/`**: Presentation layer containing REST routes, WebSocket handlers, and request/response validation schemas.
- **`core/`**: Infrastructure cross-cutting concerns including configurations, exceptions, structured logging, and security.
- **`database/`**: Relational/document persistence setup (MongoDB connection, index managers, migrations).
- **`repositories/`**: Database access interface layer (Repository Pattern) isolating database drivers from core business logic.
- **`services/`**: Application services orchestrating business logic and workflows.
- **`agents/`**: LangGraph/LangChain orchestrator and dynamic plugin subsystem for AI agents.
- **`browser/`**: Browser automation interface using Playwright.
- **`memory/`**: Persistent episodic, semantic, and procedural user memory layer.
- **`vault/`**: Cryptographically isolated credentials and secrets storage.
- **`middleware/`**: Custom ASGI web request controllers (e.g. rate-limiting, request ID injection, logging).
- **`utils/`**: General helper modules (in-process events, validation utilities).
