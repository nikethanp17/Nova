"""Task schemas.

Defines validation and serialization structures for task CRUD REST endpoints.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.task import TaskPriority, TaskStatus


class TaskCreate(BaseModel):
    """Input validator for creating a new Task."""

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Brief descriptive name of the task.",
    )
    description: str | None = Field(
        default=None, description="Longer text description."
    )
    goal: str = Field(
        ...,
        min_length=1,
        description="The ultimate objective or outcome of this task run.",
    )
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM, description="Task execution priority."
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Generic unstructured contextual dictionary data.",
    )


class TaskUpdate(BaseModel):
    """Input validator for updating task attributes."""

    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
        description="Updated name of the task.",
    )
    description: str | None = Field(
        default=None, description="Updated text description."
    )
    goal: str | None = Field(
        default=None, min_length=1, description="Updated goal description."
    )
    status: TaskStatus | None = Field(
        default=None, description="Next execution status state."
    )
    priority: TaskPriority | None = Field(
        default=None, description="Updated task priority."
    )
    metadata: dict[str, Any] | None = Field(
        default=None, description="Overwriting metadata dictionary."
    )


class TaskResponse(BaseModel):
    """Output serialization representation for a Task."""

    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True,
    )

    id: str
    user_id: str
    title: str
    description: str | None = None
    goal: str
    status: TaskStatus
    priority: TaskPriority
    metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
