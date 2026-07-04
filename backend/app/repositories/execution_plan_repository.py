"""Execution plan repository implementation."""

from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.agents.planner.planner_models import ExecutionPlan
from app.repositories.base import MongoRepository


class ExecutionPlanRepository(MongoRepository[ExecutionPlan]):
    """MongoDB repository for persisting and loading ExecutionPlans."""

    def __init__(self, db: AsyncIOMotorDatabase[Any]) -> None:
        """Initialize the repository targeting execution_plans collection.

        Args:
            db: The database client instance.
        """
        super().__init__(db, "execution_plans", ExecutionPlan)
