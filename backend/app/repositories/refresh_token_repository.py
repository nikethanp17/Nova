"""Refresh token repository implementation.

Coordinates database persistence logic targeting the refresh_tokens collection.
"""

from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.refresh_token import RefreshToken
from app.repositories.base import MongoRepository


class RefreshTokenRepository(MongoRepository[RefreshToken]):
    """Refresh token database repository operations."""

    def __init__(self, db: AsyncIOMotorDatabase[Any]) -> None:
        """Initialize RefreshTokenRepository matching the refresh_tokens collection.

        Args:
            db: The active database connection client.
        """
        super().__init__(db, "refresh_tokens", RefreshToken)

    async def find_by_jti(self, jti: str) -> RefreshToken | None:
        """Locate a token record matching the JTI.

        Args:
            jti: String identifier of the token.

        Returns:
            RefreshToken | None: The found RefreshToken model or None.
        """
        document = await self.collection.find_one({"jti": jti})
        return self._to_entity(document) if document else None

    async def revoke_by_jti(self, jti: str) -> bool:
        """Revoke a token record matching the JTI.

        Args:
            jti: String identifier of the token.

        Returns:
            bool: True if matched and revoked, False otherwise.
        """
        result = await self.collection.update_one(
            {"jti": jti}, {"$set": {"is_revoked": True}}
        )
        return result.modified_count > 0

    async def create_token(self, token: RefreshToken) -> str:
        """Create a token record.

        Args:
            token: The RefreshToken model instance.

        Returns:
            str: Generated unique string identifier.
        """
        token_data = token.model_dump(by_alias=True, exclude={"id"})
        inserted_id = await self.insert(token_data)
        return inserted_id
