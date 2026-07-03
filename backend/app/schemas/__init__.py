"""Schemas Package.

Provides Pydantic schemas validating API request bodies and wrapping JSON payloads.
"""

from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.common import ErrorDetail, ResponseEnvelope
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.schemas.user import UserRegisterRequest, UserResponse

__all__ = [
    "ErrorDetail",
    "LoginRequest",
    "RefreshRequest",
    "ResponseEnvelope",
    "TaskCreate",
    "TaskResponse",
    "TaskUpdate",
    "TokenResponse",
    "UserRegisterRequest",
    "UserResponse",
]
