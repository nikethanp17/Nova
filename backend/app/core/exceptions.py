"""Custom exceptions hierarchy.

Defines all domain exceptions and HTTP-mappable errors used throughout the
NOVA backend.
"""

from typing import Any


class NovaException(Exception):
    """Base exception for all errors raised within the NOVA application."""

    def __init__(
        self,
        status_code: int,
        error_code: str,
        message: str,
        details: Any = None,
    ) -> None:
        """Initialize the custom exception.

        Args:
            status_code: The target HTTP status code to return.
            error_code: An internal machine-readable error string identifier.
            message: User-facing descriptive message.
            details: Optional raw payload containing error contexts or traces.
        """
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.details = details


class NotFoundException(NovaException):
    """Exception raised when a requested resource is not found."""

    def __init__(
        self,
        message: str = "Resource not found",
        error_code: str = "RESOURCE_NOT_FOUND",
        details: Any = None,
    ) -> None:
        """Initialize NotFoundException with a default 404 status code."""
        super().__init__(
            status_code=404,
            error_code=error_code,
            message=message,
            details=details,
        )


class ValidationException(NovaException):
    """Exception raised when request payload or data schema validation fails."""

    def __init__(
        self,
        message: str = "Validation failed",
        error_code: str = "VALIDATION_FAILED",
        details: Any = None,
    ) -> None:
        """Initialize ValidationException with a default 422 status code."""
        super().__init__(
            status_code=422,
            error_code=error_code,
            message=message,
            details=details,
        )


class ConflictException(NovaException):
    """Exception raised when a resource conflict occurs (e.g. duplicate key)."""

    def __init__(
        self,
        message: str = "Conflict detected",
        error_code: str = "CONFLICT",
        details: Any = None,
    ) -> None:
        """Initialize ConflictException with a default 409 status code."""
        super().__init__(
            status_code=409,
            error_code=error_code,
            message=message,
            details=details,
        )


class AuthenticationException(NovaException):
    """Exception raised when authentication fails or is missing."""

    def __init__(
        self,
        message: str = "Could not authenticate user",
        error_code: str = "UNAUTHORIZED",
        details: Any = None,
    ) -> None:
        """Initialize AuthenticationException with a default 401 status code."""
        super().__init__(
            status_code=401,
            error_code=error_code,
            message=message,
            details=details,
        )


class RateLimitException(NovaException):
    """Exception raised when rate limit thresholds are exceeded."""

    def __init__(
        self,
        message: str = "Rate limit exceeded. Please try again later.",
        error_code: str = "RATE_LIMIT_EXCEEDED",
        details: Any = None,
    ) -> None:
        """Initialize RateLimitException with a default 429 status code."""
        super().__init__(
            status_code=429,
            error_code=error_code,
            message=message,
            details=details,
        )


class InternalException(NovaException):
    """Exception raised when unhandled backend exceptions occur."""

    def __init__(
        self,
        message: str = "An unexpected error occurred",
        error_code: str = "INTERNAL_SERVER_ERROR",
        details: Any = None,
    ) -> None:
        """Initialize InternalException with a default 500 status code."""
        super().__init__(
            status_code=500,
            error_code=error_code,
            message=message,
            details=details,
        )
