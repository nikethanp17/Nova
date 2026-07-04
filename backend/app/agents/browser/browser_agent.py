"""Browser automation agent.

Acts as the entry interface coordinating drivers, session directories,
executors, and lifecycle events.
"""

from typing import Any

from app.agents.browser.browser_driver import BrowserDriver
from app.agents.browser.browser_events import (
    BrowserEventBus,
    ExecutionFinished,
    TaskStarted,
)
from app.agents.browser.browser_models import BrowserStepResult, ExecutionPlan
from app.agents.browser.browser_session import BrowserSession


class BrowserAgent:
    """Orchestrator executing browser automation plans."""

    def __init__(self, driver: BrowserDriver) -> None:
        """Initialize the BrowserAgent with a driver.

        Args:
            driver: BrowserDriver protocol interface implementation.
        """
        self.driver = driver

    async def execute_plan(
        self,
        plan: ExecutionPlan,
        headless: bool = True,
        save_update_callback: Any = None,
    ) -> list[BrowserStepResult]:
        """Deploy browser, run executor loop, and handle cleanup.

        Args:
            plan: Deserialized plan.
            headless: Toggle UI display.
            save_update_callback: Optional async callback to stream DB updates.

        Returns:
            list[BrowserStepResult]: Sequential step outputs.
        """
        # 1. Spawn session
        session = BrowserSession(task_id=plan.task_id)

        # 2. Set up local event bus
        event_bus = BrowserEventBus(task_id=plan.task_id, logs_dir=session.logs_dir)

        # 3. Publish TaskStarted event
        event_bus.publish(TaskStarted(task_id=plan.task_id))

        step_results: list[BrowserStepResult] = []
        execution_status = "SUCCESS"
        execution_error = None

        try:
            # 4. Initialize page and bind to driver
            page = await session.initialize(headless=headless)
            self.driver.set_page(page)

            # 5. Instantiate executor and run
            from app.agents.browser.browser_executor import BrowserExecutor

            executor = BrowserExecutor(
                driver=self.driver, session=session, event_bus=event_bus
            )
            step_results = await executor.execute(
                plan, save_update_callback=save_update_callback
            )

            # Check if any step failed
            if any(sr.status == "FAILED" for sr in step_results):
                execution_status = "FAILED"
                failed_step = next(sr for sr in step_results if sr.status == "FAILED")
                execution_error = failed_step.error

        except Exception as e:
            execution_status = "FAILED"
            execution_error = str(e)
            raise e
        finally:
            # 6. Teardown session cleanly
            await session.close()

            # 7. Publish ExecutionFinished event
            event_bus.publish(
                ExecutionFinished(
                    task_id=plan.task_id,
                    status=execution_status,
                    error=execution_error,
                )
            )

        return step_results
