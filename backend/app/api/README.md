# app/api/

This directory represents the **Presentation Layer** of the application. It exposes endpoints, parses client data, initiates schema-validation, and returns unified REST responses and WebSocket events.

## Directory Responsibilities

- **`v1/`**: Contains version-controlled endpoint routes.
- **`schemas/`**: Pydantic v2 schemas mapping input and output data payloads.
- **`websocket/`**: Dedicated sub-handlers for high-frequency duplex operations (e.g. streaming task logs).
- **`dependencies.py`**: Shared FastAPI dependency injection utilities.
