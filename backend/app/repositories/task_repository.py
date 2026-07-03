"""Task repository implementation.

Coordinates database persistence logic targeting tasks and task executions collections.
"""

from datetime import datetime
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.task import Task, TaskExecution
from app.repositories.base import MongoRepository


class TaskRepository(MongoRepository[Task]):
    """Task database repository operations.

    Implements automatic user-scoping and soft-delete filters.
    """

    def __init__(self, db: AsyncIOMotorDatabase[Any]) -> None:
        """Initialize TaskRepository targeting tasks and executions.

        Args:
            db: The active database connection client.
        """
        super().__init__(db, "tasks", Task)
        self.executions_collection = db["task_executions"]

    async def find_by_id_for_user(self, user_id: str, task_id: str) -> Task | None:
        """Locate an active task by ID, scoped to a specific user.

        Args:
            user_id: Owner user ID string.
            task_id: Unique task ID string.

        Returns:
            Task | None: The found active Task model, or None.
        """
        try:
            obj_id = ObjectId(task_id)
        except (InvalidId, TypeError):
            obj_id = task_id  # type: ignore[assignment]

        document = await self.collection.find_one(
            {"_id": obj_id, "user_id": user_id, "deleted_at": None}
        )
        return self._to_entity(document) if document else None

    async def find_one_for_user(
        self, user_id: str, filters: dict[str, Any]
    ) -> Task | None:
        """Find a single active task matching criteria, scoped to a user.

        Args:
            user_id: Owner user ID string.
            filters: Query filter parameters.

        Returns:
            Task | None: The matched active Task model, or None.
        """
        query = {"user_id": user_id, "deleted_at": None}
        query.update(filters)
        document = await self.collection.find_one(query)
        return self._to_entity(document) if document else None

    async def find_many_for_user(
        self,
        user_id: str,
        filters: dict[str, Any],
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "created_at",
        sort_order: int = -1,
    ) -> list[Task]:
        """Query multiple active tasks scoped to a specific user with pagination.

        Args:
            user_id: Owner user ID string.
            filters: Query filters.
            skip: Count of items to skip.
            limit: Maximum items to return.
            sort_by: Target sorting field.
            sort_order: Sorting direction (1 for asc, -1 for desc).

        Returns:
            list[Task]: List of retrieved Task models.
        """
        query = {"user_id": user_id, "deleted_at": None}
        query.update(filters)

        cursor = (
            self.collection.find(query)
            .sort(sort_by, sort_order)
            .skip(skip)
            .limit(limit)
        )
        documents = await cursor.to_list(length=limit)
        return [self._to_entity(doc) for doc in documents]

    async def update_for_user(
        self, user_id: str, task_id: str, updates: dict[str, Any]
    ) -> bool:
        """Update active task parameters scoped to a specific user.

        Args:
            user_id: Owner user ID string.
            task_id: Unique task ID string.
            updates: Attributes dict to modify.

        Returns:
            bool: True if task modified, False otherwise.
        """
        try:
            obj_id = ObjectId(task_id)
        except (InvalidId, TypeError):
            obj_id = task_id  # type: ignore[assignment]

        result = await self.collection.update_one(
            {"_id": obj_id, "user_id": user_id, "deleted_at": None},
            {"$set": updates},
        )
        return result.modified_count > 0

    async def soft_delete_for_user(self, user_id: str, task_id: str) -> bool:
        """Flag a task as soft-deleted by setting deleted_at to current timestamp.

        Args:
            user_id: Owner user ID string.
            task_id: Unique task ID string.

        Returns:
            bool: True if soft-deleted, False otherwise.
        """
        try:
            obj_id = ObjectId(task_id)
        except (InvalidId, TypeError):
            obj_id = task_id  # type: ignore[assignment]

        result = await self.collection.update_one(
            {"_id": obj_id, "user_id": user_id, "deleted_at": None},
            {"$set": {"deleted_at": datetime.utcnow()}},
        )
        return result.modified_count > 0

    # -----------------------------------------------------------------------
    # Task Execution Persistence helpers
    # -----------------------------------------------------------------------

    async def insert_execution(self, execution: TaskExecution) -> str:
        """Insert a new task execution record.

        Args:
            execution: TaskExecution model data.

        Returns:
            str: Generated execution ID.
        """
        data = execution.model_dump(by_alias=True, exclude={"id"})
        result = await self.executions_collection.insert_one(data)
        return str(result.inserted_id)

    async def find_executions_by_task_id(
        self, user_id: str, task_id: str
    ) -> list[TaskExecution]:
        """Retrieve task executions, verifying task ownership first.

        Args:
            user_id: Requesting user ID.
            task_id: Unique task ID.

        Returns:
            list[TaskExecution]: List of task executions attempts.
        """
        # Ensure task exists and belongs to the user
        task = await self.find_by_id_for_user(user_id, task_id)
        if not task:
            return []

        cursor = self.executions_collection.find({"task_id": task_id})
        documents = await cursor.to_list(length=100)

        executions = []
        for doc in documents:
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
            executions.append(TaskExecution.model_validate(doc))
        return executions
