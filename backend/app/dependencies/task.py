"""Task module dependency injectors.

Defines FastAPI dependencies for injecting task repositories and services.
"""

from typing import Any

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies.database import get_database
from app.repositories.task_repository import TaskRepository
from app.services.task_service import TaskService


def get_task_repository(
    db: AsyncIOMotorDatabase[Any] = Depends(get_database),
) -> TaskRepository:
    """Dependency injector yielding TaskRepository.

    Args:
        db: Injected database connection context.

    Returns:
        TaskRepository: Instantiated repository.
    """
    return TaskRepository(db)


def get_task_service(
    task_repo: TaskRepository = Depends(get_task_repository),
) -> TaskService:
    """Dependency injector yielding TaskService.

    Args:
        task_repo: Injected TaskRepository instance.

    Returns:
        TaskService: Instantiated service.
    """
    return TaskService(task_repo)
