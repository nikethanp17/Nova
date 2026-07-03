# app/api/schemas/

Defines standard request/response data shapes for client validation using Pydantic v2.

## Directory Responsibilities

- **`auth.py`**: Login request, register request, token response, OAuth callback payload models.
- **`user.py`**: Profile detail, profile patch, user preferences schemas.
- **`task.py`**: Task submission config, task execution status, timeline logs.
- **`document.py`**: Upload metadata, document detail schemas.
- **`memory.py`**: Memory creation, search results, memory item detail structures.
- **`vault.py`**: Secret registration, masked secret summaries.
- **`agent.py`**: Config inputs, metadata, status payloads.
