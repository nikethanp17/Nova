"""Database connection lifecycle manager.

Handles database startup connection configuration and shutdown cleanup operations
without blocking application startup.
"""

from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings
from app.core.logging import get_logger
from app.database.client import check_connectivity, get_mongo_client, set_mongo_client

logger = get_logger(__name__)


async def connect_to_mongo() -> None:
    """Initialize the MongoDB client connection.

    Attempts to connect to MongoDB based on configuration. Logs status
    but does not raise or block application startup if the database is offline.
    """
    settings = get_settings()
    logger.info("Initializing MongoDB connection client...")

    try:
        # Create the AsyncIOMotorClient connection instance
        client: AsyncIOMotorClient[Any] = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=2000,  # 2 second timeout for faster fallback
        )
        set_mongo_client(client)

        # Attempt to verify connectivity immediately
        connected = await check_connectivity()
        if connected:
            logger.info("MongoDB client established and verified successfully.")
        else:
            logger.warning(
                "MongoDB client created, but database is unreachable. "
                "The application will continue starting up."
            )
    except Exception as e:
        logger.error(
            f"Failed to initialize MongoDB client: {e}. "
            "Startup sequence will proceed without a database connection."
        )


async def close_mongo_connection() -> None:
    """Close the MongoDB client connection safely during application teardown."""
    client = get_mongo_client()
    if client is not None:
        logger.info("Closing MongoDB connection client...")
        try:
            client.close()
            logger.info("MongoDB connection client safely terminated.")
        except Exception as e:
            logger.error(f"Error occurred while closing MongoDB connection client: {e}")
