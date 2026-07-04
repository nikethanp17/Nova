"""Verification script for Milestone 6 Browser Agent.

Sets up a local verification page, registers a user, creates a task,
populates a custom local-navigation plan, runs execution via the REST API,
and validates outcomes, logs, events, and screenshot artifacts.
"""

import asyncio
import os
from typing import Any

from bson import ObjectId
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from app.database.client import get_db
from app.database.connection import close_mongo_connection, connect_to_mongo
from app.main import app
from app.models.task import TaskStatus
from app.repositories.execution_plan_repository import ExecutionPlanRepository

BASE_URL = "http://test"
TEST_PASSWORD = "secure_password_123"
USER_EMAIL = "user_m6@example.com"
USER_USERNAME = "user_m6"


async def clean_db() -> None:
    """Clear test data from tasks, executions, and plans."""
    client: AsyncIOMotorClient[Any] = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["nova_dev"]
    await db.users.delete_many({"email": USER_EMAIL})
    await db.tasks.delete_many({"user_id": USER_USERNAME})
    await db.execution_plans.delete_many({})
    await db.task_executions.delete_many({})
    client.close()
    print("[-] Test database cleaned.")


async def verify_browser_agent() -> None:
    """Execute end-to-end browser agent checks."""
    import httpx

    await connect_to_mongo()

    try:
        transport = httpx.ASGITransport(app=app)
        async with AsyncClient(
            transport=transport, base_url=BASE_URL, timeout=30.0
        ) as client:
            await clean_db()

            # 1. Register User
            print("\n[1] Registering verification user...")
            res = await client.post(
                "/api/v1/auth/register",
                json={
                    "email": USER_EMAIL,
                    "username": USER_USERNAME,
                    "full_name": "Browser Agent Tester",
                    "password": TEST_PASSWORD,
                },
            )
            assert res.status_code == 201

            # Login User
            res = await client.post(
                "/api/v1/auth/login",
                json={"email": USER_EMAIL, "password": TEST_PASSWORD},
            )
            assert res.status_code == 200
            token = res.json()["data"]["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # 2. Create Task
            print("\n[2] Defining task...")
            res = await client.post(
                "/api/v1/tasks",
                json={
                    "title": "Local Browser Run",
                    "goal": "Verify local typing and button click actions.",
                    "priority": "HIGH",
                },
                headers=headers,
            )
            assert res.status_code == 201
            task_id = res.json()["data"]["id"]
            print(f"Task defined with ID: {task_id}")

            # 3. Create Custom Execution Plan referencing local test_page.html
            local_page_path = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "workspace", "test_page.html")
            )
            local_page_url = f"file://{local_page_path}"

            print(f"Resolving local test page URL: {local_page_url}")
            assert os.path.exists(local_page_path), (
                "Local test page must exist before verification runs."
            )

            # Insert Plan directly to DB to bypass DummyProvider hardcoding
            db = get_db()
            plan_repo = ExecutionPlanRepository(db)

            # Build steps conforming to refinement requirements
            plan_document = {
                "task_id": task_id,
                "user_id": USER_USERNAME,
                "goal": "Verify local typing and button click actions.",
                "status": "READY",
                "estimated_steps": 4,
                "estimated_duration": "2 minutes",
                "prompt_version": "v1-test",
                "steps": [
                    {
                        "step_number": 1,
                        "title": "Navigate to local verification portal",
                        "description": "Loads local verification page file",
                        "action": "navigate",
                        "target": local_page_url,
                        "input": None,
                        "expected_result": "Page loaded successfully",
                        "status": "PENDING",
                    },
                    {
                        "step_number": 2,
                        "title": "Type test username",
                        "description": "Writes testing username into field",
                        "action": "type",
                        "target": "input#username-input",
                        "input": "milestone6_tester",
                        "expected_result": "Input query updated",
                        "status": "PENDING",
                    },
                    {
                        "step_number": 3,
                        "title": "Click verification button",
                        "description": "Triggers local click verification",
                        "action": "click",
                        "target": "button#submit-btn",
                        "input": None,
                        "expected_result": "Outcomes success banner updated",
                        "status": "PENDING",
                    },
                    {
                        "step_number": 4,
                        "title": "Verify outcome elements",
                        "description": "Asserts validation text banner",
                        "action": "verify",
                        "target": "div#success-message",
                        "input": "Verification Success",
                        "expected_result": "Success message elements visible",
                        "status": "PENDING",
                    },
                ],
                "metadata": {"provider": "test-manual"},
            }
            await plan_repo.insert(plan_document)
            print("Execution plan inserted into DB manually.")

            # Update task status to READY so execution is authorized
            await db.tasks.update_one(
                {"_id": ObjectId(task_id)}, {"$set": {"status": "READY"}}
            )

            # 4. Trigger Execution
            print("\n[3] Triggering execution via POST /execute...")
            res = await client.post(
                f"/api/v1/tasks/{task_id}/execute",
                headers=headers,
            )
            print(f"POST Response: {res.status_code} {res.text}")
            assert res.status_code == 201

            # 5. Poll for completion
            print("\n[4] Polling background agent execution status...")
            max_attempts = 30
            completed = False
            status_str = ""
            for attempt in range(max_attempts):
                res_task = await client.get(f"/api/v1/tasks/{task_id}", headers=headers)
                status_str = res_task.json()["data"]["status"]
                print(
                    f"Attempt {attempt + 1}/{max_attempts}: Task status is {status_str}"
                )

                if status_str in (TaskStatus.COMPLETED, TaskStatus.FAILED):
                    completed = True
                    break
                await asyncio.sleep(0.5)

            if status_str != TaskStatus.COMPLETED:
                res_exec = await client.get(
                    f"/api/v1/tasks/{task_id}/execution", headers=headers
                )
                print(f"FAILED EXECUTION DETAILS: {res_exec.text}")

            assert completed, "Task execution failed to complete within timeout."
            assert status_str == TaskStatus.COMPLETED, (
                f"Task failed. Last status: {status_str}"
            )

            # 6. Retrieve Execution details
            print("\n[5] Fetching execution attempt via GET /execution...")
            res = await client.get(
                f"/api/v1/tasks/{task_id}/execution",
                headers=headers,
            )
            print(f"GET Response: {res.status_code}")
            assert res.status_code == 200

            execution_data = res.json()["data"]
            assert execution_data["status"] == "COMPLETED"

            # Verify step results persisted inside metadata
            step_results = execution_data["metadata"]["step_results"]
            print(f"Retrieved {len(step_results)} step results.")
            assert len(step_results) == 4

            for idx, step_res in enumerate(step_results):
                step_num = idx + 1
                print(
                    f"Step {step_num}: {step_res['action']} status is "
                    f"{step_res['status']}"
                )
                assert step_res["step_number"] == step_num
                assert step_res["status"] == "SUCCESS"
                assert step_res["duration_ms"] >= 0
                assert step_res["screenshot_path"] is not None
                # Resolve web-relative /workspace/ path to local workspace/ dir
                local_screenshot_path = step_res["screenshot_path"]
                if local_screenshot_path.startswith("/workspace/"):
                    local_screenshot_path = os.path.join(
                        os.path.dirname(__file__), local_screenshot_path.lstrip("/")
                    )
                assert os.path.exists(local_screenshot_path), (
                    f"Screenshot file missing: {local_screenshot_path}"
                )
                assert step_res["started_at"] is not None
                assert step_res["completed_at"] is not None
                assert step_res["url"] is not None

            # 7. Check logs/execution_events.jsonl for internal lifecycle events
            logs_file = os.path.join(
                os.path.dirname(__file__),
                "workspace",
                "tasks",
                task_id,
                "logs",
                "execution_events.jsonl",
            )
            print(f"Checking events log file: {logs_file}")
            assert os.path.exists(logs_file), "Events log file missing."

            import json

            with open(logs_file) as f:
                lines = f.readlines()

            events = [
                res_task.get("event_type")
                for line in lines
                if (res_task := json.loads(line))
            ]
            print(f"Logged events list: {events}")

            # Check for required refinement events
            required_events = [
                "TaskStarted",
                "StepStarted",
                "ScreenshotTaken",
                "StepCompleted",
                "ExecutionFinished",
            ]
            for event_type in required_events:
                assert event_type in events, f"Event {event_type} missing from logs."

            print("\n=== ALL MILESTONE 6 BROWSER AGENT VERIFICATIONS PASSED ===")

    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(verify_browser_agent())
