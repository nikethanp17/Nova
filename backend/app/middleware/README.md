# app/middleware/

Applies custom ASGI request interception logic matching cross-cutting configurations.

## Directory Responsibilities

- `auth_middleware.py`: Extracts and decodes JWT headers.
- `rate_limiter.py`: Handles token-bucket client limits prior to processing request logic.
- `request_logger.py`: Instantiates structured log events carrying generated Request IDs.
- `error_handler.py`: Standardizes all generic Python errors into standardized JSON exceptions.
