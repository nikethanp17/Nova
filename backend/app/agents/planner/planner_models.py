"""Planner domain models.

Defines the structured execution steps, statuses, and plans.
"""

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class StepStatus(StrEnum):
    """Execution status for an individual step in the plan."""

    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class PlanStatus(StrEnum):
    """Overall status of the execution plan."""

    PLANNING = "PLANNING"
    READY = "READY"
    FAILED = "FAILED"


class Step(BaseModel):
    """An individual execution step within a plan, consumed by Browser Agent."""

    model_config = ConfigDict(
        use_enum_values=True,
    )

    step_number: int = Field(..., description="1-indexed sequence number of the step.")
    title: str = Field(..., description="Short title of the step action.")
    description: str = Field(
        ..., description="Detailed description of what this step does."
    )
    action: str = Field(
        ..., description="Action name or keyword representing the operation."
    )
    target: str | None = Field(
        default=None, description="The element selector, URL, or target of the action."
    )
    input: Any = Field(
        default=None, description="User or contextual input data required for the step."
    )
    expected_result: str = Field(
        ..., description="Condition indicating successful completion of the step."
    )
    status: StepStatus = Field(
        default=StepStatus.PENDING, description="Current execution state of this step."
    )


class ExecutionPlan(BaseModel):
    """Full execution plan generated for a task."""

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        use_enum_values=True,
    )

    id: str | None = Field(default=None, alias="id")
    task_id: str = Field(..., description="ID of the task this plan executes.")
    user_id: str = Field(..., description="Owner of the task and plan.")
    goal: str = Field(..., description="The ultimate target objective.")
    status: PlanStatus = Field(
        default=PlanStatus.PLANNING, description="Status of the execution plan."
    )
    estimated_steps: int = Field(..., description="Total number of steps in this plan.")
    estimated_duration: str = Field(
        ..., description="Estimated time duration to complete (e.g. '10 minutes')."
    )
    prompt_version: str = Field(
        ..., description="Version identifier of the planning system prompt used."
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Timestamp of plan creation."
    )
    steps: list[Step] = Field(
        default_factory=list, description="Ordered steps of the execution plan."
    )
    strategy: str | None = Field(
        default=None,
        description="The conceptual strategy designed by the planner agent.",
    )
    checkpoints: list[str] | None = Field(
        default=None,
        description="Key milestones/checkpoints expected during execution.",
    )
    success_criteria: str | None = Field(
        default=None,
        description="Outcome criteria verifying successful goal completion.",
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Metadata, including LLM provider and cost tracking.",
    )
