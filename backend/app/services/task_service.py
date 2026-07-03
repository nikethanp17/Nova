"""Task application service.

Coordinates task CRUD validations, status state transitions, and user ownership rules.
"""

from datetime import datetime
from typing import Any

from app.core.exceptions import ConflictException, NotFoundException
from app.models.task import Task, TaskStatus
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate, TaskUpdate

# Map containing valid state transitions for tasks
VALID_TRANSITIONS = {
    TaskStatus.PENDING: {
        TaskStatus.PLANNING,
        TaskStatus.RUNNING,
        TaskStatus.CANCELLED,
    },
    TaskStatus.PLANNING: {
        TaskStatus.RUNNING,
        TaskStatus.FAILED,
        TaskStatus.CANCELLED,
    },
    TaskStatus.RUNNING: {
        TaskStatus.WAITING,
        TaskStatus.COMPLETED,
        TaskStatus.FAILED,
        TaskStatus.CANCELLED,
    },
    TaskStatus.WAITING: {
        TaskStatus.RUNNING,
        TaskStatus.FAILED,
        TaskStatus.CANCELLED,
    },
    TaskStatus.COMPLETED: set(),
    TaskStatus.FAILED: set(),
    TaskStatus.CANCELLED: set(),
}


class TaskService:
    """Operations managing Task lifecycle, transitions, and user isolation."""

    def __init__(self, task_repository: TaskRepository) -> None:
        """Initialize the TaskService.

        Args:
            task_repository: Injected TaskRepository instance.
        """
        self.task_repo = task_repository

    async def create_task(self, user_id: str, request: TaskCreate) -> Task:
        """Create a user-owned task record in PENDING state.

        Args:
            user_id: Owner user ID string.
            request: Task definition request payload.

        Returns:
            Task: Created Task instance.
        """
        now = datetime.utcnow()
        task = Task(
            user_id=user_id,
            title=request.title,
            description=request.description,
            goal=request.goal,
            status=TaskStatus.PENDING,
            priority=request.priority,
            metadata=request.metadata,
            created_at=now,
            updated_at=now,
        )

        inserted_id = await self.task_repo.insert(
            task.model_dump(by_alias=True, exclude={"id"})
        )
        task.id = inserted_id
        return task

    async def list_tasks(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "created_at",
        sort_order: int = -1,
    ) -> list[Task]:
        """List active tasks for a specific user.

        Args:
            user_id: Owner user ID string.
            skip: Page index offset.
            limit: Page item size limit.
            sort_by: Target field attribute to sort.
            sort_order: Sort direction integer (1 asc, -1 desc).

        Returns:
            list[Task]: List of retrieved active tasks.
        """
        return await self.task_repo.find_many_for_user(
            user_id=user_id,
            filters={},
            skip=skip,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
        )

    async def get_task_by_id(self, user_id: str, task_id: str) -> Task:
        """Retrieve details of a single user-owned active task.

        Args:
            user_id: Owner user ID string.
            task_id: Unique task ID string.

        Raises:
            NotFoundException: If task does not exist or belongs to another user.

        Returns:
            Task: Retrieved Task instance.
        """
        task = await self.task_repo.find_by_id_for_user(user_id, task_id)
        if task is None:
            raise NotFoundException(
                message="Task not found or has been deleted",
                error_code="TASK_NOT_FOUND",
            )
        return task

    async def update_task(
        self, user_id: str, task_id: str, request: TaskUpdate
    ) -> Task:
        """Process partial modifications on a user-owned active task.

        Validates state transitions if status is updated.

        Args:
            user_id: Owner user ID string.
            task_id: Unique task ID string.
            request: Partial task update schema.

        Raises:
            NotFoundException: If task does not exist or belongs to another user.
            ConflictException: If target status transition is invalid.

        Returns:
            Task: Modified Task instance.
        """
        current_task = await self.get_task_by_id(user_id, task_id)

        updates: dict[str, Any] = {}

        if request.title is not None:
            updates["title"] = request.title
        if request.description is not None:
            updates["description"] = request.description
        if request.goal is not None:
            updates["goal"] = request.goal
        if request.priority is not None:
            updates["priority"] = request.priority
        if request.metadata is not None:
            # Overwrite or merge metadata
            updates["metadata"] = request.metadata

        # Status transition validation
        if request.status is not None:
            new_status = TaskStatus(request.status)
            old_status = TaskStatus(current_task.status)

            if new_status != old_status:
                allowed_transitions = VALID_TRANSITIONS.get(old_status, set())
                if new_status not in allowed_transitions:
                    raise ConflictException(
                        message=(
                            f"Invalid status transition from "
                            f"{old_status} to {new_status}"
                        ),
                        error_code="INVALID_STATUS_TRANSITION",
                    )

                updates["status"] = new_status

                # Manage timestamp boundaries automatically
                now = datetime.utcnow()
                if new_status == TaskStatus.RUNNING and current_task.started_at is None:
                    updates["started_at"] = now

                if new_status in {
                    TaskStatus.COMPLETED,
                    TaskStatus.FAILED,
                    TaskStatus.CANCELLED,
                }:
                    updates["completed_at"] = now

        if not updates:
            return current_task

        # Timestamp last modification
        updates["updated_at"] = datetime.utcnow()

        success = await self.task_repo.update_for_user(user_id, task_id, updates)
        if not success:
            raise NotFoundException(
                message="Task not found or has been deleted",
                error_code="TASK_NOT_FOUND",
            )

        # Return updated representation
        return await self.get_task_by_id(user_id, task_id)

    async def delete_task(self, user_id: str, task_id: str) -> bool:
        """Perform a soft delete of a user-owned task.

        Args:
            user_id: Owner user ID string.
            task_id: Unique task ID string.

        Raises:
            NotFoundException: If task does not exist or belongs to another user.

        Returns:
            bool: True if soft-deleted successfully.
        """
        # Ensure task exists and user is owner
        await self.get_task_by_id(user_id, task_id)

        success = await self.task_repo.soft_delete_for_user(user_id, task_id)
        if not success:
            raise NotFoundException(
                message="Task not found or has been deleted",
                error_code="TASK_NOT_FOUND",
            )
        return True
