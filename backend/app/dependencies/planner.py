"""FastAPI dependencies injection for the Planner Agent."""

from typing import Any

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.agents.planner.planner_agent import (
    DummyProvider,
    GeminiProvider,
    LLMProvider,
    PlannerAgent,
)
from app.agents.planner.planner_service import PlannerService
from app.core.config import get_settings
from app.dependencies.database import get_database
from app.dependencies.task import get_task_repository
from app.repositories.execution_plan_repository import ExecutionPlanRepository
from app.repositories.task_repository import TaskRepository


def get_execution_plan_repository(
    db: AsyncIOMotorDatabase[Any] = Depends(get_database),
) -> ExecutionPlanRepository:
    """Dependency injector yielding ExecutionPlanRepository.

    Args:
        db: The active motor connection context database.

    Returns:
        ExecutionPlanRepository: Instantiated repository.
    """
    return ExecutionPlanRepository(db)


def get_llm_provider() -> LLMProvider:
    """Dependency injector yielding active LLMProvider protocol implementation.

    Returns:
        LLMProvider: Instantiated provider conforming to protocol.
    """
    settings = get_settings()
    if settings.GEMINI_API_KEY:
        return GeminiProvider(api_key=settings.GEMINI_API_KEY)
    return DummyProvider()


def get_planner_agent(
    llm_provider: LLMProvider = Depends(get_llm_provider),
) -> PlannerAgent:
    """Dependency injector yielding PlannerAgent.

    Args:
        llm_provider: Conforming LLMProvider protocol instance.

    Returns:
        PlannerAgent: Instantiated agent.
    """
    return PlannerAgent(llm_provider)


def get_planner_service(
    task_repo: TaskRepository = Depends(get_task_repository),
    plan_repo: ExecutionPlanRepository = Depends(get_execution_plan_repository),
    planner_agent: PlannerAgent = Depends(get_planner_agent),
) -> PlannerService:
    """Dependency injector yielding PlannerService.

    Args:
        task_repo: Task repository instance.
        plan_repo: Execution plan repository instance.
        planner_agent: Instantiated PlannerAgent.

    Returns:
        PlannerService: Instantiated service class.
    """
    return PlannerService(task_repo, plan_repo, planner_agent)
