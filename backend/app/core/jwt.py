"""JWT utility functions.

Encapsulates token creation, parsing, validation, and claims structures.
"""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from app.core.config import get_settings
from app.core.exceptions import AuthenticationException


def create_access_token(user_id: str, role: str) -> tuple[str, str]:
    """Generate a JWT Access Token.

    Args:
        user_id: String ID of the subject user.
        role: Security role assigned to the user.

    Returns:
        tuple[str, str]: (access_token_string, jti_string)
    """
    settings = get_settings()
    jti = str(uuid.uuid4())
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "jti": jti,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "role": role,
    }

    token = jwt.encode(
        payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return token, jti


def create_refresh_token(user_id: str) -> tuple[str, str]:
    """Generate a JWT Refresh Token.

    Args:
        user_id: String ID of the subject user.

    Returns:
        tuple[str, str]: (refresh_token_string, jti_string)
    """
    settings = get_settings()
    jti = str(uuid.uuid4())
    now = datetime.now(UTC)
    expire = now + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": user_id,
        "jti": jti,
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    token = jwt.encode(
        payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return token, jti


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT token payload.

    Args:
        token: The signed JWT token string.

    Raises:
        AuthenticationException: If token has expired or is cryptographically invalid.

    Returns:
        dict[str, Any]: Parsed token payload claims mapping.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError as e:
        raise AuthenticationException(
            message="Token signature has expired",
            error_code="TOKEN_EXPIRED",
        ) from e
    except jwt.InvalidTokenError as e:
        raise AuthenticationException(
            message="Invalid authentication credentials signature",
            error_code="INVALID_TOKEN",
        ) from e
