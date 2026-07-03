"""Authentication validation schemas.

Defines schemas for login, token refresh, and session token outputs.
"""

from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """User credentials login input validation schema."""

    email: str = Field(..., description="Unique email address of the user.")
    password: str = Field(..., description="Plaintext password.")


class RefreshRequest(BaseModel):
    """Token rotation refresh input validation schema."""

    refresh_token: str = Field(..., description="Active JWT Refresh Token.")


class TokenResponse(BaseModel):
    """Structured response containing authorization tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int = Field(..., description="Access token lifetime in seconds.")
    user: UserResponse
