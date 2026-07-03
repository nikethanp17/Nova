"""Database client helper module.

Exposes helper methods for repositories to interact with MongoDB without direct
involvement in the lifecycle setup.
"""

from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Private reference to the active AsyncIOMotorClient instance
_mongo_client: AsyncIOMotorClient[Any] | None = None


def set_mongo_client(client: AsyncIOMotorClient[Any]) -> None:
    """Set the global AsyncIOMotorClient instance.

    Args:
        client: The instantiated AsyncIOMotorClient.
    """
    global _mongo_client
    _mongo_client = client


def get_mongo_client() -> AsyncIOMotorClient[Any] | None:
    """Retrieve the global AsyncIOMotorClient instance.

    Returns:
        AsyncIOMotorClient | None: The active client instance or None.
    """
    return _mongo_client


def get_db() -> AsyncIOMotorDatabase[Any]:
    """Retrieve the active AsyncIOMotorDatabase instance using environment settings.

    Raises:
        RuntimeError: If the database client has not been initialized.

    Returns:
        AsyncIOMotorDatabase: The active database connection instance.
    """
    client = get_mongo_client()
    if client is None:
        raise RuntimeError("MongoDB client has not been initialized.")
    settings = get_settings()
    return client[settings.MONGODB_DATABASE]


async def check_connectivity() -> bool:
    """Check connection status by running a ping command.

    Returns:
        bool: True if connected and responsive, False otherwise.
    """
    client = get_mongo_client()
    if client is None:
        return False
    try:
        # Execute admin command to ping the server
        await client.admin.command("ping")
        return True
    except Exception as e:
        logger.error(f"MongoDB connection ping verification failed: {e}")
        return False
