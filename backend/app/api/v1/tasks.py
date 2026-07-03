"""Task management API router.

Exposes REST routes for creating, listing, modifying, and soft-deleting tasks.
"""

from fastapi import APIRouter, Depends, Query, status

from app.dependencies.auth import get_current_active_user
from app.dependencies.task import get_task_service
from app.models.user import User
from app.schemas.common import ResponseEnvelope
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post(
    "",
    response_model=ResponseEnvelope[TaskResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    request: TaskCreate,
    current_user: User = Depends(get_current_active_user),
    task_service: TaskService = Depends(get_task_service),
) -> ResponseEnvelope[TaskResponse]:
    """Create a new task instance for the authenticated user."""
    # Ensure current_user.id is not None
    user_id = current_user.id or ""
    task = await task_service.create_task(user_id, request)
    return ResponseEnvelope(
        success=True,
        data=TaskResponse.model_validate(task),
        message="Task created successfully.",
    )


@router.get(
    "",
    response_model=ResponseEnvelope[list[TaskResponse]],
)
async def list_tasks(
    page: int = Query(1, ge=1, description="Pagination page index."),
    limit: int = Query(10, ge=1, le=100, description="Pagination limit size."),
    sort_by: str = Query("created_at", description="Sorting field key."),
    sort_order: str = Query("desc", description="Sorting order (asc or desc)."),
    current_user: User = Depends(get_current_active_user),
    task_service: TaskService = Depends(get_task_service),
) -> ResponseEnvelope[list[TaskResponse]]:
    """List paginated tasks belonging to the authenticated user."""
    user_id = current_user.id or ""
    skip = (page - 1) * limit
    order_val = -1 if sort_order.lower() == "desc" else 1

    tasks = await task_service.list_tasks(
        user_id=user_id,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=order_val,
    )
    return ResponseEnvelope(
        success=True,
        data=[TaskResponse.model_validate(t) for t in tasks],
        message="Tasks retrieved successfully.",
    )


@router.get(
    "/{task_id}",
    response_model=ResponseEnvelope[TaskResponse],
)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    task_service: TaskService = Depends(get_task_service),
) -> ResponseEnvelope[TaskResponse]:
    """Retrieve details of a specific task."""
    user_id = current_user.id or ""
    task = await task_service.get_task_by_id(user_id, task_id)
    return ResponseEnvelope(
        success=True,
        data=TaskResponse.model_validate(task),
        message="Task details retrieved successfully.",
    )


@router.patch(
    "/{task_id}",
    response_model=ResponseEnvelope[TaskResponse],
)
async def update_task(
    task_id: str,
    request: TaskUpdate,
    current_user: User = Depends(get_current_active_user),
    task_service: TaskService = Depends(get_task_service),
) -> ResponseEnvelope[TaskResponse]:
    """Update attributes or execution status of a task."""
    user_id = current_user.id or ""
    task = await task_service.update_task(user_id, task_id, request)
    return ResponseEnvelope(
        success=True,
        data=TaskResponse.model_validate(task),
        message="Task updated successfully.",
    )


@router.delete(
    "/{task_id}",
    response_model=ResponseEnvelope[None],
)
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    task_service: TaskService = Depends(get_task_service),
) -> ResponseEnvelope[None]:
    """Soft-delete a specific task."""
    user_id = current_user.id or ""
    await task_service.delete_task(user_id, task_id)
    return ResponseEnvelope(
        success=True,
        data=None,
        message="Task deleted successfully.",
    )
