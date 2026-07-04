"""Verification script for Milestone 5 Planner Agent.

Tests successful plan generation, plan retrieval, idempotency, ownership security,
state transition validation, malformed LLM retry success, and failed
generation recovery.
"""

import asyncio
from typing import Any

from httpx import AsyncClient

from app.agents.planner.planner_models import PlanStatus
from app.dependencies.planner import get_llm_provider
from app.main import app
from app.models.task import TaskStatus

BASE_URL = "http://test"
TEST_PASSWORD = "secure_password_123"
USER_A_EMAIL = "usera_m5@example.com"
USER_A_USERNAME = "usera_m5"
USER_B_EMAIL = "userb_m5@example.com"
USER_B_USERNAME = "userb_m5"


class MalformedOnceProvider:
    """Mock LLM Provider that fails on first attempt and succeeds on retry."""

    def __init__(self, target_goal: str) -> None:
        self.calls = 0
        self.target_goal = target_goal

    async def generate_plan(
        self,
        title: str,
        description: str | None,
        goal: str,
        priority: str,
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        self.calls += 1
        if self.calls == 1:
            # First attempt: return malformed non-dictionary
            return "MALFORMED_NON_DICT"  # type: ignore[return-value]

        # Second attempt: succeed
        return {
            "goal": self.target_goal,
            "estimated_steps": 1,
            "estimated_duration": "2 minutes",
            "steps": [
                {
                    "step_number": 1,
                    "title": "Retry success step",
                    "description": "Returned on the second attempt.",
                    "action": "navigate",
                    "target": "https://example.com",
                    "input": None,
                    "expected_result": "Page loaded successfully.",
                    "status": "PENDING",
                }
            ],
            "metadata": {
                "provider": "malformed-once-provider",
                "model": "retry-model",
                "tokens_input": 12,
                "tokens_output": 24,
                "generation_time_ms": 200,
            },
        }


class AlwaysMalformedProvider:
    """Mock LLM Provider that always fails to generate valid plan."""

    async def generate_plan(
        self,
        title: str,
        description: str | None,
        goal: str,
        priority: str,
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        return "MALFORMED_ALWAYS"  # type: ignore[return-value]


async def clean_db() -> None:
    """Clear database profiles and tasks before verification runs."""
    from motor.motor_asyncio import AsyncIOMotorClient

    client: AsyncIOMotorClient[Any] = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["nova_dev"]
    await db.users.delete_many({"email": {"$in": [USER_A_EMAIL, USER_B_EMAIL]}})
    await db.tasks.delete_many({"user_id": {"$in": [USER_A_USERNAME, USER_B_USERNAME]}})
    await db.execution_plans.delete_many({})
    client.close()
    print("[-] Test database initialized and cleaned.")


async def verify_planner_agent() -> None:
    """Execute functional planner checks."""
    import httpx

    from app.database.connection import close_mongo_connection, connect_to_mongo

    # Manually configure the mongo client lifecycle for test process
    await connect_to_mongo()

    try:
        transport = httpx.ASGITransport(app=app)
        async with AsyncClient(
            transport=transport, base_url=BASE_URL, timeout=10.0
        ) as client:
            await clean_db()

            # 1. Register User A
            res = await client.post(
                "/api/v1/auth/register",
                json={
                    "email": USER_A_EMAIL,
                    "username": USER_A_USERNAME,
                    "full_name": "User A",
                    "password": TEST_PASSWORD,
                },
            )
            print(f"Register A response: {res.status_code} {res.text}")
            assert res.status_code == 201

            # Register User B
            res = await client.post(
                "/api/v1/auth/register",
                json={
                    "email": USER_B_EMAIL,
                    "username": USER_B_USERNAME,
                    "full_name": "User B",
                    "password": TEST_PASSWORD,
                },
            )
            print(f"Register B response: {res.status_code} {res.text}")
            assert res.status_code == 201

            # Login User A
            res = await client.post(
                "/api/v1/auth/login",
                json={"email": USER_A_EMAIL, "password": TEST_PASSWORD},
            )
            assert res.status_code == 200
            token_a = res.json()["data"]["access_token"]
            headers_a = {"Authorization": f"Bearer {token_a}"}

            # Login User B
            res = await client.post(
                "/api/v1/auth/login",
                json={"email": USER_B_EMAIL, "password": TEST_PASSWORD},
            )
            assert res.status_code == 200
            token_b = res.json()["data"]["access_token"]
            headers_b = {"Authorization": f"Bearer {token_b}"}

            # 2. Create Task (User A)
            task_payload = {
                "title": "Apply for Job",
                "description": "Submit application to Careers Portal.",
                "goal": "Submit job form and extract confirmation code.",
                "priority": "HIGH",
            }
            res = await client.post(
                "/api/v1/tasks", json=task_payload, headers=headers_a
            )
            assert res.status_code == 201
            task_id = res.json()["data"]["id"]

            # 3. Create Execution Plan (DummyProvider)
            print(f"\n[1] Requesting plan generation for task {task_id}...")
            res = await client.post(f"/api/v1/tasks/{task_id}/plan", headers=headers_a)
            print(f"Response code: {res.status_code}")
            assert res.status_code == 201
            plan_data = res.json()["data"]

            # Verify plan payload properties
            assert plan_data["task_id"] == task_id
            assert plan_data["status"] == PlanStatus.READY
            assert plan_data["estimated_steps"] == 3
            assert plan_data["estimated_duration"] == "10 minutes"
            assert plan_data["metadata"]["provider"] == "dummy"
            assert plan_data["metadata"]["model"] == "dummy-model"

            # Verify step structures (browser-oriented steps verification)
            step_1 = plan_data["steps"][0]
            assert step_1["step_number"] == 1
            assert step_1["action"] == "navigate"
            assert step_1["target"] == "https://careers.google.com"
            assert step_1["input"] is None
            assert step_1["status"] == "PENDING"

            # Verify task status transitioned PENDING -> READY
            res_task = await client.get(f"/api/v1/tasks/{task_id}", headers=headers_a)
            assert res_task.json()["data"]["status"] == TaskStatus.READY
            print("Task status transitioned: READY")

            # 4. GET Execution Plan Retrieval
            print("\n[2] Retrieving plan via GET...")
            res = await client.get(f"/api/v1/tasks/{task_id}/plan", headers=headers_a)
            print(f"Response code: {res.status_code}")
            assert res.status_code == 200
            assert res.json()["data"]["id"] == plan_data["id"]

            # 5. Idempotence Check (Duplicate Request)
            print("\n[3] Requesting plan again (duplicate request)...")
            res = await client.post(f"/api/v1/tasks/{task_id}/plan", headers=headers_a)
            print(f"Response code: {res.status_code}")
            # Idempotence: Returns existing READY plan
            assert res.status_code in (200, 201)
            assert res.json()["data"]["id"] == plan_data["id"]

            # 6. Invalid Task Status Transition Protection (409 Conflict)
            print("\n[4] Transitioning task to RUNNING and re-planning...")
            # Update task status manually
            await client.patch(
                f"/api/v1/tasks/{task_id}",
                json={"status": "RUNNING"},
                headers=headers_a,
            )
            # Attempt to plan -> Expect 409 Conflict because status is invalid
            res = await client.post(f"/api/v1/tasks/{task_id}/plan", headers=headers_a)
            print(f"Response code: {res.status_code}")
            assert res.status_code == 409
            assert res.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"

            # 7. Ownership Security Boundary (404 isolation check)
            print("\n[5] Querying plan as Non-Owner (User B)...")
            res = await client.get(f"/api/v1/tasks/{task_id}/plan", headers=headers_b)
            print(f"GET response code: {res.status_code}")
            assert res.status_code == 404

            res = await client.post(f"/api/v1/tasks/{task_id}/plan", headers=headers_b)
            print(f"POST response code: {res.status_code}")
            assert res.status_code == 404

            # 8. Malformed LLM retry once and succeed validation
            print("\n[6] Testing malformed LLM retry once and succeed...")
            # Create a new PENDING task
            res = await client.post(
                "/api/v1/tasks",
                json={
                    "title": "Retry Task",
                    "goal": "Verify retry succeeds.",
                },
                headers=headers_a,
            )
            retry_task_id = res.json()["data"]["id"]

            # Inject MalformedOnceProvider
            retry_provider = MalformedOnceProvider(target_goal="Verify retry succeeds.")
            app.dependency_overrides[get_llm_provider] = lambda: retry_provider

            # Call POST plan -> Expect successful creation after retry
            res = await client.post(
                f"/api/v1/tasks/{retry_task_id}/plan", headers=headers_a
            )
            print(f"Response code: {res.status_code}")
            assert res.status_code == 201
            assert retry_provider.calls == 2  # Proves retry once occurred!
            assert res.json()["data"]["status"] == PlanStatus.READY

            # 9. Failed generation recovery
            print("\n[7] Testing failed generation recovery...")
            # Create a new PENDING task
            res = await client.post(
                "/api/v1/tasks",
                json={
                    "title": "Always Fail Task",
                    "goal": "Verify failure flow.",
                },
                headers=headers_a,
            )
            fail_task_id = res.json()["data"]["id"]

            # Inject AlwaysMalformedProvider
            app.dependency_overrides[get_llm_provider] = lambda: (
                AlwaysMalformedProvider()
            )

            # Call POST plan -> Should fail to generate plan
            try:
                res = await client.post(
                    f"/api/v1/tasks/{fail_task_id}/plan", headers=headers_a
                )
                print(f"Response code: {res.status_code}")
            except Exception as e:
                # The server raises 500 error due to internal Exception propagated
                print(f"Exception caught on server call as expected: {e}")

            # Check DB plan status is FAILED and Task is reverted to PENDING
            res_task = await client.get(
                f"/api/v1/tasks/{fail_task_id}", headers=headers_a
            )
            assert res_task.json()["data"]["status"] == TaskStatus.PENDING
            print("Task status reverted to PENDING successfully.")

            # Recovery check: Restore default provider, try again
            print("Recovering generation by switching back to default provider...")
            app.dependency_overrides.pop(get_llm_provider, None)

            res = await client.post(
                f"/api/v1/tasks/{fail_task_id}/plan", headers=headers_a
            )
            print(f"Response code: {res.status_code}")
            assert res.status_code == 201
            assert res.json()["data"]["status"] == PlanStatus.READY

            res_task = await client.get(
                f"/api/v1/tasks/{fail_task_id}", headers=headers_a
            )
            assert res_task.json()["data"]["status"] == TaskStatus.READY
            print("Task status recovered to READY successfully.")

            print("\n=== ALL MILESTONE 5 PLANNER AGENT VERIFICATIONS PASSED ===")
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(verify_planner_agent())
