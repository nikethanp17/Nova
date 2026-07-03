"""Authentication endpoints.

Provides routes for user registration, login, token refresh, and logout.
"""

from fastapi import APIRouter, Depends, status

from app.dependencies.auth import get_auth_service, get_user_service
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse
from app.schemas.common import ResponseEnvelope
from app.schemas.user import UserRegisterRequest, UserResponse
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=ResponseEnvelope[UserResponse],
    status_code=status.HTTP_201_CREATED,
)
async def register(
    request: UserRegisterRequest,
    user_service: UserService = Depends(get_user_service),
) -> ResponseEnvelope[UserResponse]:
    """Register a new user account."""
    user = await user_service.register_user(request)
    return ResponseEnvelope(
        success=True,
        data=UserResponse.model_validate(user),
        message="User account registered successfully.",
    )


@router.post(
    "/login",
    response_model=ResponseEnvelope[TokenResponse],
    status_code=status.HTTP_200_OK,
)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> ResponseEnvelope[TokenResponse]:
    """Authenticate credentials and return a token session."""
    tokens = await auth_service.authenticate_user(request)
    return ResponseEnvelope(
        success=True,
        data=tokens,
        message="Authentication successful.",
    )


@router.post(
    "/refresh",
    response_model=ResponseEnvelope[TokenResponse],
    status_code=status.HTTP_200_OK,
)
async def refresh(
    request: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> ResponseEnvelope[TokenResponse]:
    """Rotate an active refresh token, returning a new token pair."""
    tokens = await auth_service.rotate_tokens(request.refresh_token)
    return ResponseEnvelope(
        success=True,
        data=tokens,
        message="Token rotated successfully.",
    )


@router.post(
    "/logout",
    response_model=ResponseEnvelope[None],
    status_code=status.HTTP_200_OK,
)
async def logout(
    request: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> ResponseEnvelope[None]:
    """Invalidate an active refresh token session, logging out the user."""
    await auth_service.invalidate_session(request.refresh_token)
    return ResponseEnvelope(
        success=True,
        data=None,
        message="Logout successful. Session invalidated.",
    )
