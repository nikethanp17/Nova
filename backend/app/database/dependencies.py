"""Database dependencies helper redirection.

Imports dependency injections from app.dependencies.database.
"""

from app.dependencies.database import get_database, get_db_client

__all__ = ["get_database", "get_db_client"]
