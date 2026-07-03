"""Authentication application service.

Coordinates session establishment, refresh token rotations, and token revocations.
"""

from datetime import UTC, datetime, timedelta

from app.core.config import get_settings
from app.core.exceptions import AuthenticationException
from app.core.jwt import create_access_token, create_refresh_token, decode_token
from app.core.security import verify_password
from app.models.refresh_token import RefreshToken
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserResponse


class AuthService:
    """Operations managing session state validation."""

    def __init__(
        self,
        user_repository: UserRepository,
        refresh_token_repository: RefreshTokenRepository,
    ) -> None:
        """Initialize the AuthService.

        Args:
            user_repository: Injected UserRepository instance.
            refresh_token_repository: Injected RefreshTokenRepository instance.
        """
        self.user_repo = user_repository
        self.token_repo = refresh_token_repository

    async def authenticate_user(self, request: LoginRequest) -> TokenResponse:
        """Authenticate user credentials and establish a new token session.

        Args:
            request: Credentials payload.

        Raises:
            AuthenticationException: If credentials do not match.

        Returns:
            TokenResponse: Session tokens payload.
        """
        user = await self.user_repo.find_by_email(request.email)
        if user is None or not verify_password(request.password, user.password_hash):
            raise AuthenticationException(
                message="Invalid email or password credentials",
                error_code="INVALID_CREDENTIALS",
            )

        if not user.is_active:
            raise AuthenticationException(
                message="User account has been deactivated",
                error_code="ACCOUNT_INACTIVE",
            )

        # Update last login timestamp
        now = datetime.now(UTC)
        await self.user_repo.update(user.id or "", {"last_login_at": now})
        user.last_login_at = now

        # Generate tokens via core/jwt
        access_tok, _ = create_access_token(user.id or "", user.role)
        refresh_tok, refresh_jti = create_refresh_token(user.id or "")

        # Persist refresh token in db for revocation checks
        settings = get_settings()
        expire_at = now + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        db_token = RefreshToken(
            jti=refresh_jti,
            user_id=user.id or "",
            expires_at=expire_at,
            is_revoked=False,
            created_at=now,
        )
        await self.token_repo.create_token(db_token)

        return TokenResponse(
            access_token=access_tok,
            refresh_token=refresh_tok,
            token_type="Bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )

    async def rotate_tokens(self, refresh_token: str) -> TokenResponse:
        """Rotate an active Refresh Token, returning a new token pair.

        Enforces refresh token rotation (RTR) rules and revokes compromised tokens.

        Args:
            refresh_token: Signed raw refresh token string.

        Raises:
            AuthenticationException: If token is revoked, expired, or invalid.

        Returns:
            TokenResponse: Newly rotated session tokens.
        """
        # Decode token and validate signatures/expiry
        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise AuthenticationException(
                message="Invalid token type provided",
                error_code="INVALID_TOKEN_TYPE",
            )

        jti = payload.get("jti", "")
        user_id = payload.get("sub", "")

        # Query token registry
        token_record = await self.token_repo.find_by_jti(jti)
        if token_record is None or token_record.is_revoked:
            # Breach detection: revoke all active tokens for this user
            if token_record and token_record.is_revoked:
                # Revoke everything to mitigate compromise
                await self.token_repo.collection.update_many(
                    {"user_id": user_id}, {"$set": {"is_revoked": True}}
                )
            raise AuthenticationException(
                message="Refresh token has been revoked or is invalid",
                error_code="TOKEN_REVOKED",
            )

        # Retrieve user profile
        user = await self.user_repo.find_by_id(user_id)
        if user is None or not user.is_active:
            raise AuthenticationException(
                message="User associated with token is inactive or not found",
                error_code="USER_INACTIVE",
            )

        # Mark current JTI as revoked (used)
        await self.token_repo.revoke_by_jti(jti)

        # Generate new token pair
        now = datetime.now(UTC)
        new_access_tok, _ = create_access_token(user.id or "", user.role)
        new_refresh_tok, new_jti = create_refresh_token(user.id or "")

        # Persist new token in registry
        settings = get_settings()
        expire_at = now + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        db_token = RefreshToken(
            jti=new_jti,
            user_id=user.id or "",
            expires_at=expire_at,
            is_revoked=False,
            created_at=now,
        )
        await self.token_repo.create_token(db_token)

        return TokenResponse(
            access_token=new_access_tok,
            refresh_token=new_refresh_tok,
            token_type="Bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )

    async def invalidate_session(self, refresh_token: str) -> None:
        """Revoke a refresh token string, logging the user out.

        Args:
            refresh_token: Signed raw refresh token string.
        """
        try:
            payload = decode_token(refresh_token)
            jti = payload.get("jti", "")
            if jti:
                await self.token_repo.revoke_by_jti(jti)
        except AuthenticationException:
            # If the token is already expired, ignore as session is dead
            pass
