"""Planner service coordination module."""

from datetime import datetime

from app.agents.planner.planner_agent import PlannerAgent
from app.agents.planner.planner_models import ExecutionPlan, PlanStatus
from app.agents.planner.planner_prompt import PROMPT_VERSION
from app.core.exceptions import ConflictException, NotFoundException
from app.models.task import TaskStatus
from app.repositories.execution_plan_repository import ExecutionPlanRepository
from app.repositories.task_repository import TaskRepository


class PlannerService:
    """Orchestrates planning tasks, status transitions, and persists execution plans."""

    def __init__(
        self,
        task_repository: TaskRepository,
        plan_repository: ExecutionPlanRepository,
        planner_agent: PlannerAgent,
    ) -> None:
        """Initialize the PlannerService.

        Args:
            task_repository: Repositories accessing Tasks collection.
            plan_repository: Repositories accessing ExecutionPlans collection.
            planner_agent: The PlannerAgent instance.
        """
        self.task_repo = task_repository
        self.plan_repo = plan_repository
        self.planner_agent = planner_agent

    async def create_plan(self, user_id: str, task_id: str) -> ExecutionPlan:
        """Generate, validate, and store a structured execution plan for a task.

        Updates task status: PENDING -> PLANNING -> READY.
        Returns pre-existing READY plan if it exists.
        Rolls task to PENDING and marks plan FAILED if generation fails.

        Args:
            user_id: Owner user ID string.
            task_id: Task identification string.

        Raises:
            NotFoundException: If task is missing.
            ConflictException: If task status is not valid for planning.

        Returns:
            ExecutionPlan: Generated and persisted execution plan.
        """
        # 1. Fetch task
        task = await self.task_repo.find_by_id_for_user(user_id, task_id)
        if not task:
            raise NotFoundException(
                message="Task not found or has been deleted",
                error_code="TASK_NOT_FOUND",
            )

        # Use 409 Conflict if task status is invalid (already executing or finished)
        if task.status in {
            TaskStatus.RUNNING,
            TaskStatus.COMPLETED,
            TaskStatus.FAILED,
            TaskStatus.CANCELLED,
        }:
            raise ConflictException(
                message=f"Cannot plan task in status {task.status}.",
                error_code="INVALID_STATUS_TRANSITION",
            )

        # 2. Check if a READY plan already exists
        existing_plan = await self.plan_repo.find_one(
            {"task_id": task_id, "user_id": user_id}
        )
        if existing_plan and existing_plan.status == PlanStatus.READY:
            # Align task status to READY if not already set
            if task.status != TaskStatus.READY:
                await self.task_repo.update_for_user(
                    user_id,
                    task_id,
                    {"status": TaskStatus.READY, "updated_at": datetime.utcnow()},
                )
            return existing_plan

        # Ensure task is ready to start planning if we generate a new one
        if task.status not in {TaskStatus.PENDING, TaskStatus.PLANNING}:
            raise ConflictException(
                message=f"Cannot plan task in status {task.status}. Must be PENDING.",
                error_code="INVALID_STATUS_TRANSITION",
            )

        # Transition task status to PLANNING
        await self.task_repo.update_for_user(
            user_id,
            task_id,
            {"status": TaskStatus.PLANNING, "updated_at": datetime.utcnow()},
        )

        try:
            # 3. Generate plan using PlannerAgent
            execution_plan = await self.planner_agent.plan(
                task_id=task_id,
                user_id=user_id,
                title=task.title,
                description=task.description,
                goal=task.goal,
                priority=task.priority,
                metadata=task.metadata,
            )

            # Store READY plan
            plan_data = execution_plan.model_dump(by_alias=True, exclude={"id"})
            if existing_plan and existing_plan.id:
                await self.plan_repo.update(existing_plan.id, plan_data)
                execution_plan.id = existing_plan.id
            else:
                inserted_id = await self.plan_repo.insert(plan_data)
                execution_plan.id = inserted_id

            # 4. Transition task status to READY
            await self.task_repo.update_for_user(
                user_id,
                task_id,
                {"status": TaskStatus.READY, "updated_at": datetime.utcnow()},
            )

            return execution_plan

        except Exception as e:
            # Revert task status to PENDING and save a FAILED execution plan
            failed_plan = ExecutionPlan(
                task_id=task_id,
                user_id=user_id,
                goal=task.goal,
                status=PlanStatus.FAILED,
                estimated_steps=0,
                estimated_duration="0 minutes",
                prompt_version=PROMPT_VERSION,
                steps=[],
                metadata={
                    "error": str(e),
                    "provider": "unknown",
                    "model": "unknown",
                    "tokens_input": 0,
                    "tokens_output": 0,
                    "generation_time_ms": 0,
                },
            )
            failed_plan_data = failed_plan.model_dump(by_alias=True, exclude={"id"})
            if existing_plan and existing_plan.id:
                await self.plan_repo.update(existing_plan.id, failed_plan_data)
                failed_plan.id = existing_plan.id
            else:
                inserted_id = await self.plan_repo.insert(failed_plan_data)
                failed_plan.id = inserted_id

            # Revert task to PENDING
            await self.task_repo.update_for_user(
                user_id,
                task_id,
                {"status": TaskStatus.PENDING, "updated_at": datetime.utcnow()},
            )
            raise e

    async def get_plan(self, user_id: str, task_id: str) -> ExecutionPlan:
        """Retrieve the persisted plan for a task, verifying user ownership.

        Args:
            user_id: Owner user ID string.
            task_id: Task identification string.

        Raises:
            NotFoundException: If task or plan does not exist.

        Returns:
            ExecutionPlan: Found execution plan model.
        """
        # Verify task exists and is owned by the user
        task = await self.task_repo.find_by_id_for_user(user_id, task_id)
        if not task:
            raise NotFoundException(
                message="Task not found or has been deleted",
                error_code="TASK_NOT_FOUND",
            )

        plan = await self.plan_repo.find_one({"task_id": task_id, "user_id": user_id})
        if not plan:
            raise NotFoundException(
                message="Execution plan not found for this task",
                error_code="PLAN_NOT_FOUND",
            )
        return plan
