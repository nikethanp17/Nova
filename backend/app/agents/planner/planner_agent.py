"""Planner Agent module.

Implements the PlannerAgent and LLMProvider protocols/concrete instances.
"""

import asyncio
import json
import logging
import os
import time
import urllib.error
import urllib.request
from typing import Any, Protocol, cast

from app.agents.planner.planner_models import (
    ExecutionPlan,
    PlanStatus,
    Step,
    StepStatus,
)
from app.agents.planner.planner_prompt import PROMPT_VERSION

logger = logging.getLogger(__name__)


class LLMProvider(Protocol):
    """Protocol defining the interface for LLM calls."""

    async def generate_plan(
        self,
        title: str,
        description: str | None,
        goal: str,
        priority: str,
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        """Generate a raw plan dictionary from the LLM.

        Args:
            title: Title of the task.
            description: Description of the task.
            goal: Goal description.
            priority: Priority rating.
            metadata: Custom execution context metadata.

        Returns:
            dict[str, Any]: Serialized plan matching schema.
        """
        ...


class DummyProvider:
    """Mock LLM Provider returning static execution plans and cost metrics."""

    async def generate_plan(
        self,
        title: str,
        description: str | None,
        goal: str,
        priority: str,
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        """Generate a mock plan conforming to expected format.

        Args:
            title: Title of the task.
            description: Description of the task.
            goal: Goal description.
            priority: Priority rating.
            metadata: Custom execution context metadata.

        Returns:
            dict[str, Any]: Mock plan details.
        """
        if metadata.get("simulate_malformed"):
            # Return corrupt type to trigger parsing/validation exception
            return "MALFORMED_NON_DICT"  # type: ignore[return-value]

        return {
            "goal": goal,
            "estimated_steps": 3,
            "estimated_duration": "10 minutes",
            "strategy": f"Mock plan strategy to satisfy goal: {goal}",
            "checkpoints": ["Navigate home", "Input search query", "Verify outcome"],
            "success_criteria": "The target page is visible and verification succeeds.",
            "steps": [
                {
                    "step_number": 1,
                    "title": f"Navigate to task targets: {title}",
                    "description": "Load target webpage and wait for body element.",
                    "action": "navigate",
                    "target": "https://careers.google.com",
                    "input": None,
                    "expected_result": "Page loaded and search box is visible.",
                    "status": "PENDING",
                },
                {
                    "step_number": 2,
                    "title": "Query jobs details",
                    "description": f"Carry out core activities for goal: {goal}",
                    "action": "fill",
                    "target": "input[type='search']",
                    "input": "Software Engineer",
                    "expected_result": "Query text populated in input search field.",
                    "status": "PENDING",
                },
                {
                    "step_number": 3,
                    "title": "Validate final execution state",
                    "description": "Confirm state parameters conform to requirements.",
                    "action": "validate",
                    "target": None,
                    "input": None,
                    "expected_result": "Success message or portal state confirmed.",
                    "status": "PENDING",
                },
            ],
            "metadata": {
                "provider": "dummy",
                "model": "dummy-model",
                "tokens_input": 0,
                "tokens_output": 0,
                "generation_time_ms": 100,
            },
        }


class GeminiProvider:
    """Gemini API LLM Provider conforming to LLMProvider."""

    def __init__(self, api_key: str | None = None) -> None:
        """Initialize the GeminiProvider.

        Args:
            api_key: Optional Gemini API key. If not provided, reads from environment.
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")

    def _send_request(self, url: str, payload_bytes: bytes) -> bytes:
        req = urllib.request.Request(
            url,
            data=payload_bytes,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            return cast(bytes, response.read())

    async def generate_plan(
        self,
        title: str,
        description: str | None,
        goal: str,
        priority: str,
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        """Generate a structured plan from the Gemini API.

        Args:
            title: Title of the task.
            description: Description of the task.
            goal: Goal description.
            priority: Priority rating.
            metadata: Custom execution context metadata.

        Returns:
            dict[str, Any]: Plan dictionary matching schema.
        """
        api_key = self.api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set.")

        # Construct payload conforming to Google GenAI REST API generateContent
        from app.agents.planner.planner_prompt import PLANNER_SYSTEM_PROMPT

        user_content = (
            f"Task Title: {title}\n"
            f"Description: {description or ''}\n"
            f"Goal: {goal}\n"
            f"Priority: {priority}"
        )

        payload = {
            "contents": [{"parts": [{"text": user_content}]}],
            "systemInstruction": {"parts": [{"text": PLANNER_SYSTEM_PROMPT}]},
            "generationConfig": {"responseMimeType": "application/json"},
        }

        # Model name: gemini-1.5-flash is extremely fast and cost-effective
        model_name = "gemini-1.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload_bytes = json.dumps(payload).encode("utf-8")

        start_time = time.perf_counter()
        try:
            loop = asyncio.get_event_loop()
            response_bytes = await loop.run_in_executor(
                None, self._send_request, url, payload_bytes
            )
        except urllib.error.HTTPError as e:
            error_content = e.read().decode("utf-8") if e.fp else ""
            logger.error(f"Gemini API HTTP error: {e.code} - {error_content}")
            raise ValueError(
                f"Gemini API returned error code {e.code}: {error_content}"
            ) from e
        except Exception as e:
            logger.error(f"Gemini API connection error: {e}")
            raise ValueError(f"Failed to communicate with Gemini API: {e}") from e

        end_time = time.perf_counter()
        generation_time_ms = int((end_time - start_time) * 1000)

        try:
            response_data = json.loads(response_bytes.decode("utf-8"))
            candidate = response_data["candidates"][0]
            text_response = candidate["content"]["parts"][0]["text"]
            plan_json = json.loads(text_response)
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            logger.error(
                f"Failed to parse Gemini API response: {response_bytes.decode('utf-8')}"
            )
            raise ValueError(f"Malformed response from Gemini API: {e}") from e

        # Extract token usage if available
        usage = response_data.get("usageMetadata", {})
        tokens_input = usage.get("promptTokenCount", 0)
        tokens_output = usage.get("candidatesTokenCount", 0)

        # Inject metadata
        plan_json["metadata"] = {
            "provider": "gemini",
            "model": model_name,
            "tokens_input": tokens_input,
            "tokens_output": tokens_output,
            "generation_time_ms": generation_time_ms,
        }

        return cast(dict[str, Any], plan_json)


class PlannerAgent:
    """Converts a Task into a step-by-step ExecutionPlan using an LLMProvider."""

    def __init__(self, llm_provider: LLMProvider) -> None:
        """Initialize the PlannerAgent.

        Args:
            llm_provider: An implementation conforming to LLMProvider protocol.
        """
        self.llm_provider = llm_provider

    async def plan(
        self,
        task_id: str,
        user_id: str,
        title: str,
        description: str | None,
        goal: str,
        priority: str,
        metadata: dict[str, Any],
    ) -> ExecutionPlan:
        """Formulate a plan by converting task fields into Step objects.

        Retries once if provider response fails validation or parsing.

        Args:
            task_id: Task identification string.
            user_id: Owner user ID string.
            title: Title of the task.
            description: Description of the task.
            goal: Goal description.
            priority: Priority rating.
            metadata: Context metadata.

        Raises:
            ValueError: If plan parsing or validation fails after retrying.

        Returns:
            ExecutionPlan: Formulated ready execution plan.
        """
        attempts = 2
        last_error = None
        raw_plan = None

        for attempt in range(attempts):
            try:
                raw_plan = await self.llm_provider.generate_plan(
                    title=title,
                    description=description,
                    goal=goal,
                    priority=priority,
                    metadata=metadata,
                )

                if not isinstance(raw_plan, dict):
                    raise ValueError("LLM response is not a valid dictionary.")
                if "steps" not in raw_plan:
                    raise ValueError("LLM response missing 'steps' key.")

                # Check each step structure
                for idx, step in enumerate(raw_plan["steps"], start=1):
                    if not isinstance(step, dict):
                        raise ValueError(f"Step index {idx} is not a dictionary.")
                    required_keys = {
                        "step_number",
                        "title",
                        "description",
                        "action",
                        "expected_result",
                    }
                    missing_keys = required_keys - step.keys()
                    if missing_keys:
                        raise ValueError(f"Step missing required keys: {missing_keys}")

                # Successful validation
                break

            except Exception as e:
                logger.warning(
                    f"Planning attempt {attempt + 1} failed for task {task_id}: {e}"
                )
                last_error = e
                if attempt == attempts - 1:
                    # Final attempt failed
                    raise ValueError(
                        f"Failed to generate valid plan after "
                        f"{attempts} attempts: {last_error}"
                    ) from last_error

        # Map steps to domain models
        steps = []
        for s in raw_plan.get("steps", []):  # type: ignore[union-attr]
            steps.append(
                Step(
                    step_number=s["step_number"],
                    title=s["title"],
                    description=s["description"],
                    action=s["action"],
                    target=s.get("target"),
                    input=s.get("input"),
                    expected_result=s["expected_result"],
                    status=StepStatus.PENDING,
                )
            )

        # Extract cost tracking metadata from provider output or default
        llm_metadata = raw_plan.get("metadata", {})  # type: ignore[union-attr]
        cost_metadata = {
            "provider": llm_metadata.get("provider", "unknown"),
            "model": llm_metadata.get("model", "unknown"),
            "tokens_input": llm_metadata.get("tokens_input", 0),
            "tokens_output": llm_metadata.get("tokens_output", 0),
            "generation_time_ms": llm_metadata.get("generation_time_ms", 0),
        }

        return ExecutionPlan(
            task_id=task_id,
            user_id=user_id,
            goal=raw_plan.get("goal", goal),  # type: ignore[union-attr]
            status=PlanStatus.READY,
            estimated_steps=len(steps),
            estimated_duration=raw_plan.get(  # type: ignore[union-attr]
                "estimated_duration", "5 minutes"
            ),
            prompt_version=PROMPT_VERSION,
            strategy=raw_plan.get("strategy"),  # type: ignore[union-attr]
            checkpoints=raw_plan.get("checkpoints"),  # type: ignore[union-attr]
            success_criteria=raw_plan.get("success_criteria"),  # type: ignore[union-attr]
            steps=steps,
            metadata=cost_metadata,
        )
