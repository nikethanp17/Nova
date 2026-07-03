"""User domain model.

Defines the database entity representations and serialization mappings for users.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class User(BaseModel):
    """User database representation model."""

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    id: str | None = Field(default=None, alias="id")
    email: str
    username: str
    full_name: str
    password_hash: str
    role: str = "user"
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: datetime | None = None
