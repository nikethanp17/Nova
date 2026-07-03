"""Common schemas mapping shared payloads across domains."""

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Encapsulates structured error parameters."""

    code: str
    message: str


class ResponseEnvelope[T](BaseModel):
    """Standardized API response wrapper."""

    success: bool
    data: T | None = None
    message: str | None = None
    error: ErrorDetail | None = None
