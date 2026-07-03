"""Schemas Package.

Provides Pydantic schemas validating API request bodies and wrapping JSON payloads.
"""

from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.common import ErrorDetail, ResponseEnvelope
from app.schemas.user import UserRegisterRequest, UserResponse

__all__ = [
    "ErrorDetail",
    "LoginRequest",
    "RefreshRequest",
    "ResponseEnvelope",
    "TokenResponse",
    "UserRegisterRequest",
    "UserResponse",
]
