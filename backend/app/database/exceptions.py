"""Database exception classes.

Defines repository and persistence error classifications wrapping raw driver
errors.
"""

from typing import Any

from app.core.exceptions import NovaException


class DatabaseError(NovaException):
    """Base exception for all database and persistence operations."""

    def __init__(
        self,
        message: str = "Database operation failed",
        error_code: str = "DATABASE_ERROR",
        details: Any = None,
    ) -> None:
        """Initialize base DatabaseError with a 500 status code."""
        super().__init__(
            status_code=500,
            error_code=error_code,
            message=message,
            details=details,
        )


class DatabaseConnectionError(DatabaseError):
    """Exception raised when database client is unreachable or down."""

    def __init__(
        self,
        message: str = "Database connection is unavailable",
        details: Any = None,
    ) -> None:
        """Initialize DatabaseConnectionError."""
        super().__init__(
            message=message,
            error_code="DATABASE_CONNECTION_ERROR",
            details=details,
        )


class DuplicateKeyError(DatabaseError):
    """Exception raised when a unique constraint index violation occurs."""

    def __init__(
        self,
        message: str = "Resource already exists",
        details: Any = None,
    ) -> None:
        """Initialize DuplicateKeyError with a 409 conflict status code."""
        super().__init__(
            message=message,
            error_code="DUPLICATE_KEY_ERROR",
            details=details,
        )
        self.status_code = 409
