"""Database dependency injection modules.

Provides connection clients and active database handlers for FastAPI routes and
application services.
"""

from collections.abc import AsyncIterator
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.database.client import get_db, get_mongo_client
from app.database.exceptions import DatabaseConnectionError


async def get_db_client() -> AsyncIterator[AsyncIOMotorClient[Any]]:
    """Dependency injector yielding the active AsyncIOMotorClient.

    Raises:
        DatabaseConnectionError: If the MongoDB client is not initialized.

    Yields:
        AsyncIOMotorClient: The active database connection client.
    """
    client = get_mongo_client()
    if client is None:
        raise DatabaseConnectionError("MongoDB client has not been initialized.")
    yield client


async def get_database() -> AsyncIterator[AsyncIOMotorDatabase[Any]]:
    """Dependency injector yielding the active AsyncIOMotorDatabase.

    Raises:
        DatabaseConnectionError: If the MongoDB client is not initialized.

    Yields:
        AsyncIOMotorDatabase: The active connection database context.
    """
    try:
        db = get_db()
        yield db
    except RuntimeError as e:
        raise DatabaseConnectionError(str(e)) from e
