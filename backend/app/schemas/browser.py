"""Browser agent API validation schemas.

Defines schemas for execution response models.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class TaskExecutionResponse(BaseModel):
    """Output serialization structure for task execution attempts."""

    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True,
    )

    id: str
    task_id: str
    status: str
    started_at: datetime
    completed_at: datetime | None = None
    error: str | None = None
    metadata: dict[str, Any] = {}
