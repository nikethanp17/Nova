"""User data schemas.

Defines Pydantic models for register requests and profile outputs.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserRegisterRequest(BaseModel):
    """User registration input validation schema."""

    email: str = Field(..., description="Unique email address.")
    username: str = Field(..., description="Unique user name handle.")
    full_name: str = Field(..., description="Full display name.")
    password: str = Field(..., min_length=8, description="User password.")


class UserResponse(BaseModel):
    """Client-facing user profile information schema."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    username: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None
