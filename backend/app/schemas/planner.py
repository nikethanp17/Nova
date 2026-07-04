"""Planner API validation and serialization schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.agents.planner.planner_models import PlanStatus, StepStatus


class StepResponse(BaseModel):
    """Response schema mapping an execution step."""

    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True,
    )

    step_number: int = Field(..., description="1-indexed sequence identifier.")
    title: str = Field(..., description="Short name describing the step action.")
    description: str = Field(..., description="Longer text description of task step.")
    action: str = Field(..., description="Programmatic action keyword.")
    target: str | None = Field(
        default=None, description="Action target selector or URL."
    )
    input: Any = Field(default=None, description="Input payload parameters required.")
    expected_result: str = Field(..., description="Description of successful outcome.")
    status: StepStatus = Field(..., description="Step execution state.")


class ExecutionPlanResponse(BaseModel):
    """Response schema wrapping the full generated execution plan."""

    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True,
        populate_by_name=True,
    )

    id: str = Field(..., description="Unique generated plan ID.")
    task_id: str = Field(..., description="Target task ID.")
    goal: str = Field(..., description="The plan destination goal.")
    status: PlanStatus = Field(..., description="Plan validation status.")
    estimated_steps: int = Field(..., description="Total count of steps.")
    estimated_duration: str = Field(
        ..., description="Human readable estimate of duration."
    )
    prompt_version: str = Field(
        ..., description="Version of system planning prompt used."
    )
    created_at: datetime = Field(
        ..., description="Timestamp representing plan generation time."
    )
    steps: list[StepResponse] = Field(
        default_factory=list, description="Ordered steps list."
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
        default_factory=dict, description="Metadata metrics, including cost tracking."
    )
