"""Authentication and DI utility functions.

Defines FastAPI dependencies for verifying authorization headers and injecting services.
"""

from typing import Any

from fastapi import Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import AuthenticationException
from app.core.jwt import decode_token
from app.dependencies.database import get_database
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.user_service import UserService

security_scheme = HTTPBearer()


# ---------------------------------------------------------------------------
# Repository & Service Factories
# ---------------------------------------------------------------------------


def get_user_repository(
    db: AsyncIOMotorDatabase[Any] = Depends(get_database),
) -> UserRepository:
    """Dependency injector yielding UserRepository.

    Args:
        db: Injected database connection context.

    Returns:
        UserRepository: Instantiated repository.
    """
    return UserRepository(db)


def get_refresh_token_repository(
    db: AsyncIOMotorDatabase[Any] = Depends(get_database),
) -> RefreshTokenRepository:
    """Dependency injector yielding RefreshTokenRepository.

    Args:
        db: Injected database connection context.

    Returns:
        RefreshTokenRepository: Instantiated repository.
    """
    return RefreshTokenRepository(db)


def get_user_service(
    user_repo: UserRepository = Depends(get_user_repository),
) -> UserService:
    """Dependency injector yielding UserService.

    Args:
        user_repo: Injected UserRepository instance.

    Returns:
        UserService: Instantiated service.
    """
    return UserService(user_repo)


def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repository),
    token_repo: RefreshTokenRepository = Depends(get_refresh_token_repository),
) -> AuthService:
    """Dependency injector yielding AuthService.

    Args:
        user_repo: Injected UserRepository instance.
        token_repo: Injected RefreshTokenRepository instance.

    Returns:
        AuthService: Instantiated service.
    """
    return AuthService(user_repo, token_repo)


# ---------------------------------------------------------------------------
# Security Dependencies
# ---------------------------------------------------------------------------


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    """Authenticate and extract the active user from the HTTP Bearer header.

    Args:
        credentials: Captured HTTP Bearer headers.
        user_repo: Injected UserRepository instance.

    Raises:
        AuthenticationException: If the token is invalid, expired, or user not found.

    Returns:
        User: Instantiated active user record.
    """
    token = credentials.credentials
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise AuthenticationException(
            message="Invalid token type provided",
            error_code="INVALID_TOKEN_TYPE",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationException(
            message="Subject claim missing from token",
            error_code="INVALID_SUBJECT",
        )

    user = await user_repo.find_by_id(user_id)
    if user is None:
        raise AuthenticationException(
            message="User not found or has been deleted",
            error_code="USER_NOT_FOUND",
        )

    return user


async def get_current_active_user(
    user: User = Depends(get_current_user),
) -> User:
    """Verify that the authenticated user is active.

    Args:
        user: Authenticated user model.

    Raises:
        AuthenticationException: If user account is deactivated.

    Returns:
        User: Validated active user.
    """
    if not user.is_active:
        raise AuthenticationException(
            message="User account has been deactivated",
            error_code="ACCOUNT_INACTIVE",
        )
    return user
