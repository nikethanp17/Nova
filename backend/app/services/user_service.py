"""User application service.

Coordinates registration validations and profile queries.
"""

from datetime import UTC, datetime

from app.core.exceptions import ConflictException
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRegisterRequest


class UserService:
    """Operations managing User profiles and checks."""

    def __init__(self, user_repository: UserRepository) -> None:
        """Initialize the UserService.

        Args:
            user_repository: Injected UserRepository instance.
        """
        self.user_repo = user_repository

    async def register_user(self, request: UserRegisterRequest) -> User:
        """Process user registration logic.

        Validates uniqueness of email/username and encrypts password.

        Args:
            request: Registration payload.

        Raises:
            ConflictException: If email or username is already taken.

        Returns:
            User: Created User instance.
        """
        # Validate unique email
        existing_email = await self.user_repo.find_by_email(request.email)
        if existing_email is not None:
            raise ConflictException(
                message="Email address is already registered",
                error_code="EMAIL_ALREADY_TAKEN",
            )

        # Validate unique username
        existing_username = await self.user_repo.find_by_username(request.username)
        if existing_username is not None:
            raise ConflictException(
                message="Username is already taken",
                error_code="USERNAME_ALREADY_TAKEN",
            )

        hashed = hash_password(request.password)

        new_user = User(
            email=request.email,
            username=request.username,
            full_name=request.full_name,
            password_hash=hashed,
            role="user",
            is_active=True,
            is_verified=False,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        user_id = await self.user_repo.create_user(new_user)
        new_user.id = user_id

        return new_user

    async def get_user_by_id(self, user_id: str) -> User | None:
        """Retrieve a user by unique identifier.

        Args:
            user_id: Unique string key.

        Returns:
            User | None: The found user model or None.
        """
        return await self.user_repo.find_by_id(user_id)
