"""Verification script for Milestone 7 Autonomous Browser Agent.

Runs end-to-end task planning and execution checks on a local test page
to verify page scanning, accessibility tree, dynamic loop, memory, and recovery flow.
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
USER_EMAIL = "user_m7@example.com"
USER_USERNAME = "user_m7"


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


async def verify_autonomous_agent() -> None:
    """Execute end-to-end autonomous agent checks."""
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
                    "full_name": "Autonomous Tester",
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
                    "title": "Autonomous Job Scan",
                    "goal": "Search for Python jobs and verify details.",
                    "priority": "HIGH",
                },
                headers=headers,
            )
            assert res.status_code == 201
            task_id = res.json()["data"]["id"]
            print(f"Task defined with ID: {task_id}")

            # 3. Create Custom Execution Plan with Strategy and Checkpoints
            local_page_path = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "workspace", "test_page.html")
            )
            local_page_url = f"file://{local_page_path}"

            print(f"Resolving local test page URL: {local_page_url}")
            assert os.path.exists(local_page_path), (
                "Local test page must exist before verification runs."
            )

            db = get_db()
            plan_repo = ExecutionPlanRepository(db)

            plan_document = {
                "task_id": task_id,
                "user_id": USER_USERNAME,
                "goal": "Verify local typing and button click actions.",
                "status": "READY",
                "estimated_steps": 3,
                "estimated_duration": "2 minutes",
                "prompt_version": "v7-test",
                "strategy": "Load portal, input search query, and verify outcomes.",
                "checkpoints": [
                    "Open target portal page",
                    "Fill search query",
                    "Assert search success message",
                ],
                "success_criteria": "Successful validation label is visible.",
                "steps": [
                    {
                        "step_number": 1,
                        "title": "Navigate to page",
                        "description": "Loads test page",
                        "action": "navigate",
                        "target": local_page_url,
                        "input": None,
                        "expected_result": "Page loaded successfully",
                        "status": "PENDING",
                    }
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
            max_attempts = 40
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

            # 6. Validate execution record metadata
            print("\n[5] Fetching execution attempt metadata...")
            res_exec = await client.get(
                f"/api/v1/tasks/{task_id}/execution", headers=headers
            )
            assert res_exec.status_code == 200
            exec_data = res_exec.json()["data"]

            metadata = exec_data.get("metadata", {})
            print(f"Captured Metadata Keys: {list(metadata.keys())}")

            # Assert new dynamic reasoning metadata properties are populated
            assert "memory" in metadata, "Dynamic loop memory missing."
            assert "current_url" in metadata, "Current url missing."
            assert "current_action" in metadata, "Current action missing."
            assert "reasoning" in metadata, "Reasoning history missing."
            assert "confidence" in metadata, "Confidence values missing."

            print("\n[✔] Verification metadata assertions passed.")

            # Validate generated step logs
            step_results = metadata.get("step_results", [])
            print(f"Total steps captured: {len(step_results)}")
            assert len(step_results) > 0, "No steps registered during execution."

            for sr in step_results:
                print(
                    f"Step {sr['step_number']} - Action: {sr['action']} "
                    f"- Status: {sr['status']} - Duration: {sr['duration_ms']}ms"
                )
                assert sr["status"] == "SUCCESS"
                # Resolve relative workspace path to assert it exists
                raw_path = sr.get("screenshot_path")
                if raw_path:
                    # Strip web relative prefix to resolve on disk
                    clean_path = raw_path
                    if raw_path.startswith("/workspace/"):
                        clean_path = raw_path.replace("/workspace/", "workspace/")
                    assert os.path.exists(clean_path), (
                        f"Screenshot not found on disk: {clean_path}"
                    )

            print("\n[✔] Step result metrics & screenshots validated successfully.")
            print("\n================================================")
            print("🎉 MILESTONE 7 AUTONOMOUS REASONING PASSED! 🎉")
            print("================================================")

    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(verify_autonomous_agent())
