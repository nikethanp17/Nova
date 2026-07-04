"""Browser agent REST router.

Exposes endpoints for running browser execution sequences and inspecting histories.
"""

from datetime import datetime
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, status

from app.agents.browser.browser_agent import BrowserAgent
from app.agents.browser.browser_models import ExecutionPlan as BrowserExecutionPlan
from app.core.exceptions import ConflictException, NotFoundException
from app.dependencies.auth import get_current_active_user
from app.dependencies.browser import get_browser_agent
from app.dependencies.planner import get_execution_plan_repository
from app.dependencies.task import get_task_repository
from app.models.task import TaskExecution, TaskStatus
from app.models.user import User
from app.repositories.execution_plan_repository import ExecutionPlanRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.browser import TaskExecutionResponse
from app.schemas.common import ResponseEnvelope

router = APIRouter(prefix="/tasks", tags=["Browser Agent"])


async def run_browser_agent_flow(
    task_id: str,
    user_id: str,
    execution_id: str,
    plan_dict: dict[str, Any],
    task_repo: TaskRepository,
    browser_agent: BrowserAgent,
) -> None:
    """Background task executing the automated browser steps and updating states."""
    try:
        # Deserialize into Browser ExecutionPlan schema (isolated from planner models)
        plan = BrowserExecutionPlan.model_validate(plan_dict)

        # Define dynamic live update callback
        async def save_update(
            res_list: list[Any], current_memory: dict[str, Any] | None = None
        ) -> None:
            steps_serialized = [r.model_dump() for r in res_list]
            set_dict: dict[str, Any] = {
                "metadata.step_results": steps_serialized,
            }
            if current_memory:
                set_dict["metadata.memory"] = current_memory
                set_dict["metadata.current_url"] = current_memory.get("current_url")
                set_dict["metadata.current_action"] = current_memory.get(
                    "current_action"
                )
                set_dict["metadata.reasoning"] = current_memory.get("reasoning")
                set_dict["metadata.confidence"] = current_memory.get("confidence")
                set_dict["metadata.retry_count"] = current_memory.get("retry_count")

            await task_repo.executions_collection.update_one(
                {"_id": ObjectId(execution_id)},
                {"$set": set_dict},
            )

        # Execute plan
        results = await browser_agent.execute_plan(
            plan, headless=True, save_update_callback=save_update
        )

        # Determine outcome
        failed = any(r.status == "FAILED" for r in results)
        final_status = TaskStatus.FAILED if failed else TaskStatus.COMPLETED
        error_msg = next((r.error for r in results if r.status == "FAILED"), None)

        # Update Task record
        await task_repo.update_for_user(
            user_id,
            task_id,
            {
                "status": final_status,
                "completed_at": datetime.utcnow(),
            },
        )

        # Update TaskExecution history
        steps_serialized = [r.model_dump() for r in results]
        await task_repo.executions_collection.update_one(
            {"_id": ObjectId(execution_id)},
            {
                "$set": {
                    "status": final_status,
                    "completed_at": datetime.utcnow(),
                    "error": error_msg,
                    "metadata.step_results": steps_serialized,
                }
            },
        )

    except Exception as e:
        # Fallback for system errors during browser run
        await task_repo.update_for_user(
            user_id,
            task_id,
            {
                "status": TaskStatus.FAILED,
                "completed_at": datetime.utcnow(),
            },
        )
        await task_repo.executions_collection.update_one(
            {"_id": ObjectId(execution_id)},
            {
                "$set": {
                    "status": TaskStatus.FAILED,
                    "completed_at": datetime.utcnow(),
                    "error": f"Internal execution failure: {str(e)}",
                }
            },
        )


@router.post(
    "/{task_id}/execute",
    response_model=ResponseEnvelope[TaskExecutionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def execute_task(
    task_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    task_repo: TaskRepository = Depends(get_task_repository),
    plan_repo: ExecutionPlanRepository = Depends(get_execution_plan_repository),
    browser_agent: BrowserAgent = Depends(get_browser_agent),
) -> ResponseEnvelope[TaskExecutionResponse]:
    """Trigger the autonomous execution of a generated plan in the background."""
    user_id = current_user.id or ""

    # 1. Verify task exists and belongs to the user
    task = await task_repo.find_by_id_for_user(user_id, task_id)
    if not task:
        raise NotFoundException("Task not found or unauthorized.", "TASK_NOT_FOUND")

    # 2. Check task status transition (must be READY or planning complete)
    if task.status != TaskStatus.READY:
        raise ConflictException(
            f"Task must be in READY state to execute. Current status: {task.status}",
            "INVALID_STATUS",
        )

    # 3. Retrieve the generated execution plan
    plan = await plan_repo.find_one({"task_id": task_id})
    if not plan:
        raise NotFoundException(
            "No execution plan exists for this task. Run planner generation first.",
            "PLAN_NOT_FOUND",
        )

    # 4. Transition task status to RUNNING
    await task_repo.update_for_user(
        user_id,
        task_id,
        {
            "status": TaskStatus.RUNNING,
            "started_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
    )

    # 5. Insert TaskExecution record
    execution = TaskExecution(
        task_id=task_id,
        status=TaskStatus.RUNNING,
        started_at=datetime.utcnow(),
    )
    execution_id = await task_repo.insert_execution(execution)
    execution.id = execution_id

    # 6. Dispatch background worker thread
    plan_dict = plan.model_dump()
    background_tasks.add_task(
        run_browser_agent_flow,
        task_id=task_id,
        user_id=user_id,
        execution_id=execution_id,
        plan_dict=plan_dict,
        task_repo=task_repo,
        browser_agent=browser_agent,
    )

    return ResponseEnvelope(
        success=True,
        data=TaskExecutionResponse.model_validate(execution),
        message="Task execution started in the background.",
    )


@router.get(
    "/{task_id}/execution",
    response_model=ResponseEnvelope[TaskExecutionResponse],
    status_code=status.HTTP_200_OK,
)
async def get_latest_task_execution(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    task_repo: TaskRepository = Depends(get_task_repository),
) -> ResponseEnvelope[TaskExecutionResponse]:
    """Retrieve the latest execution attempt for a specific task."""
    user_id = current_user.id or ""

    # Ensure task ownership first
    task = await task_repo.find_by_id_for_user(user_id, task_id)
    if not task:
        raise NotFoundException("Task not found or unauthorized.", "TASK_NOT_FOUND")

    # Fetch executions
    executions = await task_repo.find_executions_by_task_id(user_id, task_id)
    if not executions:
        raise NotFoundException(
            "No execution attempts recorded for this task.", "EXECUTION_NOT_FOUND"
        )

    # Sort to return the most recent attempt
    executions.sort(key=lambda x: x.started_at, reverse=True)
    latest_execution = executions[0]

    return ResponseEnvelope(
        success=True,
        data=TaskExecutionResponse.model_validate(latest_execution),
        message="Latest execution details retrieved successfully.",
    )
