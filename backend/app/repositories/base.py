"""Repository pattern base models.

Defines the repository interfaces and concrete abstract implementations for
MongoDB collections.
"""

from abc import ABC, abstractmethod
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


class BaseRepository[T](ABC):
    """Abstract base repository contract declaring core CRUD operations."""

    @abstractmethod
    async def find_by_id(self, entity_id: str) -> T | None:
        """Find an entity by its unique ID string.

        Args:
            entity_id: The ID string.

        Returns:
            T | None: The found entity, or None.
        """
        pass

    @abstractmethod
    async def find_one(self, filters: dict[str, Any]) -> T | None:
        """Find a single entity matching query filters.

        Args:
            filters: Key-value search maps.

        Returns:
            T | None: The found entity, or None.
        """
        pass

    @abstractmethod
    async def find_many(
        self,
        filters: dict[str, Any],
        skip: int = 0,
        limit: int = 100,
    ) -> list[T]:
        """Find multiple entities matching query filters.

        Args:
            filters: Key-value search maps.
            skip: Count of items to skip.
            limit: Maximum items to return.

        Returns:
            list[T]: Matching items.
        """
        pass

    @abstractmethod
    async def insert(self, data: dict[str, Any]) -> str:
        """Insert a new record into storage.

        Args:
            data: Key-value raw entity data maps.

        Returns:
            str: Generated unique string identifier.
        """
        pass

    @abstractmethod
    async def update(self, entity_id: str, updates: dict[str, Any]) -> bool:
        """Update an existing record fields by ID.

        Args:
            entity_id: The ID string.
            updates: Key-value field updates maps.

        Returns:
            bool: True if updated, False otherwise.
        """
        pass

    @abstractmethod
    async def delete(self, entity_id: str) -> bool:
        """Delete a record by ID.

        Args:
            entity_id: The ID string.

        Returns:
            bool: True if deleted, False otherwise.
        """
        pass


class MongoRepository[T](BaseRepository[T], ABC):
    """Concrete abstract repository implementation for MongoDB collections."""

    def __init__(self, db: AsyncIOMotorDatabase[Any], collection_name: str) -> None:
        """Initialize the repository context.

        Args:
            db: Active database connection handler.
            collection_name: Target collection name in the database.
        """
        self.db = db
        self.collection = db[collection_name]

    async def find_by_id(self, entity_id: str) -> T | None:
        """Find a single document by unique string ID.

        Args:
            entity_id: Unique document ID string.

        Returns:
            T | None: Unmarshaled document payload, or None.
        """
        # MongoDB uses bson ObjectId, we support query via direct ID mapping.
        # In a fully concrete implementation, the subclass resolves type mappings
        # (e.g. converting string ID into ObjectId representation).
        document = await self.collection.find_one({"_id": entity_id})
        return self._map_id(document) if document else None

    async def find_one(self, filters: dict[str, Any]) -> T | None:
        """Find a single document matching criteria queries.

        Args:
            filters: Query parameters.

        Returns:
            T | None: Unmarshaled document payload, or None.
        """
        document = await self.collection.find_one(filters)
        return self._map_id(document) if document else None

    async def find_many(
        self,
        filters: dict[str, Any],
        skip: int = 0,
        limit: int = 100,
    ) -> list[T]:
        """Find multiple documents matching filters.

        Args:
            filters: Query parameters.
            skip: Count of items to skip.
            limit: Maximum items to return.

        Returns:
            list[T]: Unmarshaled documents.
        """
        cursor = self.collection.find(filters).skip(skip).limit(limit)
        documents = await cursor.to_list(length=limit)
        return [self._map_id(doc) for doc in documents]

    async def insert(self, data: dict[str, Any]) -> str:
        """Insert a document map record.

        Args:
            data: Document mappings to insert.

        Returns:
            str: Generated document ID string.
        """
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def update(self, entity_id: str, updates: dict[str, Any]) -> bool:
        """Update a document context by ID.

        Args:
            entity_id: Target document ID.
            updates: Mappings of updates to commit.

        Returns:
            bool: True if matched and updated, False otherwise.
        """
        result = await self.collection.update_one({"_id": entity_id}, {"$set": updates})
        return result.modified_count > 0

    async def delete(self, entity_id: str) -> bool:
        """Delete a document by ID.

        Args:
            entity_id: Target document ID.

        Returns:
            bool: True if matched and deleted, False otherwise.
        """
        result = await self.collection.delete_one({"_id": entity_id})
        return result.deleted_count > 0

    def _map_id(self, document: dict[str, Any]) -> Any:
        """Helper mapper resolving raw ObjectId representation.

        Args:
            document: Raw document mapping from db.

        Returns:
            Any: Clean document mapping.
        """
        if document and "_id" in document:
            document["id"] = str(document.pop("_id"))
        return document
