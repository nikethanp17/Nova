"""User repository implementation.

Coordinates direct database queries targeting the users collection.
"""

from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.user import User
from app.repositories.base import MongoRepository


class UserRepository(MongoRepository[User]):
    """User database repository operations."""

    def __init__(self, db: AsyncIOMotorDatabase[Any]) -> None:
        """Initialize UserRepository matching the users collection.

        Args:
            db: The active database connection client.
        """
        super().__init__(db, "users", User)

    async def find_by_email(self, email: str) -> User | None:
        """Locate a user record matching the email.

        Args:
            email: Search email string.

        Returns:
            User | None: The found user model or None.
        """
        document = await self.collection.find_one({"email": email.lower()})
        return self._to_entity(document) if document else None

    async def find_by_username(self, username: str) -> User | None:
        """Locate a user record matching the username.

        Args:
            username: Search username string.

        Returns:
            User | None: The found user model or None.
        """
        document = await self.collection.find_one({"username": username.lower()})
        return self._to_entity(document) if document else None

    async def create_user(self, user: User) -> str:
        """Create a user record.

        Args:
            user: The User model instance.

        Returns:
            str: Generated unique string identifier.
        """
        # Exclude None id if exists during creation to let mongo auto-generate
        user_data = user.model_dump(by_alias=True, exclude={"id"})
        user_data["email"] = user_data["email"].lower()
        user_data["username"] = user_data["username"].lower()
        inserted_id = await self.insert(user_data)
        return inserted_id
