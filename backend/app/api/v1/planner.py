"""Planner endpoints REST router."""

from fastapi import APIRouter, Depends, status

from app.agents.planner.planner_service import PlannerService
from app.dependencies.auth import get_current_active_user
from app.dependencies.planner import get_planner_service
from app.models.user import User
from app.schemas.common import ResponseEnvelope
from app.schemas.planner import ExecutionPlanResponse

router = APIRouter(prefix="/tasks", tags=["Planner"])


@router.post(
    "/{task_id}/plan",
    response_model=ResponseEnvelope[ExecutionPlanResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_execution_plan(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    planner_service: PlannerService = Depends(get_planner_service),
) -> ResponseEnvelope[ExecutionPlanResponse]:
    """Generate and store a structured execution plan for a task."""
    user_id = current_user.id or ""
    plan = await planner_service.create_plan(user_id, task_id)
    return ResponseEnvelope(
        success=True,
        data=ExecutionPlanResponse.model_validate(plan),
        message="Execution plan generated and stored successfully.",
    )


@router.get(
    "/{task_id}/plan",
    response_model=ResponseEnvelope[ExecutionPlanResponse],
    status_code=status.HTTP_200_OK,
)
async def get_execution_plan(
    task_id: str,
    current_user: User = Depends(get_current_active_user),
    planner_service: PlannerService = Depends(get_planner_service),
) -> ResponseEnvelope[ExecutionPlanResponse]:
    """Retrieve the generated execution plan for a specific task."""
    user_id = current_user.id or ""
    plan = await planner_service.get_plan(user_id, task_id)
    return ResponseEnvelope(
        success=True,
        data=ExecutionPlanResponse.model_validate(plan),
        message="Execution plan retrieved successfully.",
    )
