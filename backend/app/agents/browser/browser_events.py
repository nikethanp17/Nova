"""Browser agent execution events.

Declares event schemas and log publishers tracking task executions.
"""

import json
import os
from collections.abc import Callable
from datetime import datetime
from typing import Any


class BrowserEvent:
    """Base event payload containing tracking metadata."""

    def __init__(self, task_id: str, event_type: str) -> None:
        self.task_id = task_id
        self.event_type = event_type
        self.timestamp = datetime.utcnow().isoformat() + "Z"

    def to_dict(self) -> dict[str, Any]:
        """Convert payload to serialization dictionary."""
        return {
            "task_id": self.task_id,
            "event_type": self.event_type,
            "timestamp": self.timestamp,
        }


class TaskStarted(BrowserEvent):
    """Event emitted when the browser agent begins plan execution."""

    def __init__(self, task_id: str) -> None:
        super().__init__(task_id, "TaskStarted")


class StepStarted(BrowserEvent):
    """Event emitted when a step starts executing."""

    def __init__(
        self,
        task_id: str,
        step_number: int,
        action: str,
        target: str | None,
    ) -> None:
        super().__init__(task_id, "StepStarted")
        self.step_number = step_number
        self.action = action
        self.target = target

    def to_dict(self) -> dict[str, Any]:
        data = super().to_dict()
        data.update(
            {
                "step_number": self.step_number,
                "action": self.action,
                "target": self.target,
            }
        )
        return data


class ScreenshotTaken(BrowserEvent):
    """Event emitted when a step screenshot has been captured."""

    def __init__(
        self,
        task_id: str,
        step_number: int,
        screenshot_path: str | None,
    ) -> None:
        super().__init__(task_id, "ScreenshotTaken")
        self.step_number = step_number
        self.screenshot_path = screenshot_path

    def to_dict(self) -> dict[str, Any]:
        data = super().to_dict()
        data.update(
            {
                "step_number": self.step_number,
                "screenshot_path": self.screenshot_path,
            }
        )
        return data


class StepCompleted(BrowserEvent):
    """Event emitted when a step completes execution."""

    def __init__(
        self,
        task_id: str,
        step_number: int,
        status: str,
        duration_ms: int,
        error: str | None = None,
    ) -> None:
        super().__init__(task_id, "StepCompleted")
        self.step_number = step_number
        self.status = status
        self.duration_ms = duration_ms
        self.error = error

    def to_dict(self) -> dict[str, Any]:
        data = super().to_dict()
        data.update(
            {
                "step_number": self.step_number,
                "status": self.status,
                "duration_ms": self.duration_ms,
                "error": self.error,
            }
        )
        return data


class ExecutionFinished(BrowserEvent):
    """Event emitted when the overall task execution sequence has ended."""

    def __init__(self, task_id: str, status: str, error: str | None = None) -> None:
        super().__init__(task_id, "ExecutionFinished")
        self.status = status
        self.error = error

    def to_dict(self) -> dict[str, Any]:
        data = super().to_dict()
        data.update(
            {
                "status": self.status,
                "error": self.error,
            }
        )
        return data


class BrowserEventBus:
    """In-process event dispatcher publishing lifecycle states to files and handlers."""

    def __init__(self, task_id: str, logs_dir: str) -> None:
        self.task_id = task_id
        self.logs_file = os.path.join(logs_dir, "execution_events.jsonl")
        self.listeners: list[Callable[[BrowserEvent], None]] = []

    def subscribe(self, callback: Callable[[BrowserEvent], None]) -> None:
        """Register a callback listener."""
        self.listeners.append(callback)

    def publish(self, event: BrowserEvent) -> None:
        """Publish event to registered listeners and write to the logs directory."""
        # 1. Notify listeners
        import contextlib

        for listener in self.listeners:
            with contextlib.suppress(Exception):
                listener(event)

        # 2. Append event payload to jsonl log file
        with (
            contextlib.suppress(Exception),
            open(self.logs_file, "a", encoding="utf-8") as f,
        ):
            f.write(json.dumps(event.to_dict()) + "\n")
