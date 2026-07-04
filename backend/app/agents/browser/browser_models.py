"""Browser agent models.

Defines Pydantic representations for browser actions, results, and steps.
No imports from the planner module are allowed here.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class Step(BaseModel):
    """An individual execution step within a plan, consumed by Browser Agent."""

    step_number: int
    title: str
    description: str
    action: str
    target: str | None = None
    input: Any = None
    expected_result: str
    status: str = "PENDING"


class ExecutionPlan(BaseModel):
    """Full execution plan generated for a task."""

    id: str | None = Field(default=None, alias="id")
    task_id: str
    user_id: str
    goal: str
    status: str = "PLANNING"
    estimated_steps: int
    estimated_duration: str
    prompt_version: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    steps: list[Step] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ActionResult(BaseModel):
    """Result of a single executed browser action."""

    success: bool
    message: str | None = None
    error: str | None = None
    extracted_data: Any = None
    confidence: float = 1.0
    url: str | None = None


class BrowserStepResult(BaseModel):
    """Outcome metrics for an executed step in an execution plan."""

    step_number: int
    action: str
    target: str | None = None
    status: str  # e.g., "SUCCESS", "FAILED"
    duration_ms: int
    screenshot_path: str | None = None
    error: str | None = None
    confidence: float = 1.0
    started_at: datetime
    completed_at: datetime
    url: str | None = None
