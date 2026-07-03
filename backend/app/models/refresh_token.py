"""Refresh token database model.

Defines the database entity representation for managing active refresh tokens
and enforcing rotation/revocation rules.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RefreshToken(BaseModel):
    """Refresh token database representation model."""

    model_config = ConfigDict(
        populate_by_name=True,
    )

    id: str | None = Field(default=None, alias="id")
    jti: str
    user_id: str
    expires_at: datetime
    is_revoked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
