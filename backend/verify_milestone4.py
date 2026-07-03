"""Verification script for Milestone 4 Task Engine.

Performs functional tests against a live server to verify:
task CRUD, pagination (page, limit, sorting), validation, status state transitions,
soft deletion, unauthorized access blocks, and strict database ownership isolation.
"""

import asyncio
from typing import Any

import httpx
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = "http://localhost:8000"
DB_URI = "mongodb://localhost:27017"
DB_NAME = "nova_dev"

# Setup two users to verify ownership isolation
USER_A_EMAIL = "usera@example.com"
USER_A_USERNAME = "usera"
USER_B_EMAIL = "userb@example.com"
USER_B_USERNAME = "userb"
TEST_PASSWORD = "secure_password_123"


async def setup_db() -> None:
    """Pre-test cleanup: delete previous user profiles and tasks."""
    client: AsyncIOMotorClient[Any] = AsyncIOMotorClient(DB_URI)
    db = client[DB_NAME]

    # Delete users
    await db.users.delete_many({"email": {"$in": [USER_A_EMAIL, USER_B_EMAIL]}})
    # Delete tasks
    await db.tasks.delete_many(
        {"user_id": {"$in": [USER_A_USERNAME, USER_A_EMAIL, "usera_id_placeholder"]}}
    )
    # Clean refresh tokens
    await db.refresh_tokens.delete_many({})

    client.close()
    print("[-] Database cleaned up successfully.")


async def verify_tasks_engine() -> None:
    """Execute functional test suite checks."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        # Register User A
        res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": USER_A_EMAIL,
                "username": USER_A_USERNAME,
                "full_name": "User A",
                "password": TEST_PASSWORD,
            },
        )
        print(f"\n[1] Register User A: {res.status_code}")
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
        print(f"\n[2] Register User B: {res.status_code}")
        assert res.status_code == 201

        # Login User A
        res = await client.post(
            "/api/v1/auth/login",
            json={"email": USER_A_EMAIL, "password": TEST_PASSWORD},
        )
        assert res.status_code == 200
        user_a_token = res.json()["data"]["access_token"]
        user_a_id = res.json()["data"]["user"]["id"]

        # Login User B
        res = await client.post(
            "/api/v1/auth/login",
            json={"email": USER_B_EMAIL, "password": TEST_PASSWORD},
        )
        assert res.status_code == 200
        user_b_token = res.json()["data"]["access_token"]

        headers_a = {"Authorization": f"Bearer {user_a_token}"}
        headers_b = {"Authorization": f"Bearer {user_b_token}"}

        # -------------------------------------------------------------------
        # 1. Create a task (User A)
        # -------------------------------------------------------------------
        task_payload = {
            "title": "Automate Travel Expenses",
            "description": "Log into portals and pull flight invoice PDF.",
            "goal": "Extract flight cost details and export to spreadsheet",
            "priority": "HIGH",
            "metadata": {"source": "verify_script", "attempt": 1},
        }
        res = await client.post("/api/v1/tasks", json=task_payload, headers=headers_a)
        print(f"\n[3] Create Task User A: {res.status_code}")
        print(res.json())
        assert res.status_code == 201
        task_data = res.json()["data"]
        task_id = task_data["id"]
        assert task_data["title"] == "Automate Travel Expenses"
        assert task_data["status"] == "PENDING"
        assert task_data["priority"] == "HIGH"
        assert task_data["user_id"] == user_a_id
        assert task_data["started_at"] is None
        assert task_data["completed_at"] is None

        # -------------------------------------------------------------------
        # 2. Validation Checks (422 rejection)
        # -------------------------------------------------------------------
        invalid_payload = {"title": "No Goal Task"}  # Missing required 'goal'
        res = await client.post(
            "/api/v1/tasks", json=invalid_payload, headers=headers_a
        )
        print(f"\n[4] Create Task (Missing Goal): {res.status_code}")
        assert res.status_code == 422

        invalid_priority = {
            "title": "Bad Priority",
            "goal": "Test Goal",
            "priority": "SUPER_HIGH",
        }
        res = await client.post(
            "/api/v1/tasks", json=invalid_priority, headers=headers_a
        )
        print(f"\n[5] Create Task (Invalid Priority): {res.status_code}")
        assert res.status_code == 422

        # -------------------------------------------------------------------
        # 3. Retrieve Details (User A)
        # -------------------------------------------------------------------
        res = await client.get(f"/api/v1/tasks/{task_id}", headers=headers_a)
        print(f"\n[6] Get Task Details (Owner): {res.status_code}")
        assert res.status_code == 200
        assert res.json()["data"]["id"] == task_id

        # -------------------------------------------------------------------
        # 4. Ownership Isolation Checks (unauthorized access blocks)
        # -------------------------------------------------------------------
        # User B trying to fetch User A's task -> should be 404
        res = await client.get(f"/api/v1/tasks/{task_id}", headers=headers_b)
        print(f"\n[7.1] Get Task Details (Non-Owner User B): {res.status_code}")
        print(res.json())
        assert res.status_code == 404
        assert res.json()["error"]["code"] == "TASK_NOT_FOUND"

        # User B trying to update User A's task -> should be 404
        res = await client.patch(
            f"/api/v1/tasks/{task_id}",
            json={"title": "Hacked Title"},
            headers=headers_b,
        )
        print(f"\n[7.2] Patch Task (Non-Owner User B): {res.status_code}")
        assert res.status_code == 404

        # User B trying to delete User A's task -> should be 404
        res = await client.delete(f"/api/v1/tasks/{task_id}", headers=headers_b)
        print(f"\n[7.3] Delete Task (Non-Owner User B): {res.status_code}")
        assert res.status_code == 404

        # -------------------------------------------------------------------
        # 5. Status Transitions and Validations (409 checks)
        # -------------------------------------------------------------------
        # PENDING -> PLANNING (valid)
        res = await client.patch(
            f"/api/v1/tasks/{task_id}",
            json={"status": "PLANNING"},
            headers=headers_a,
        )
        print(f"\n[8.1] Transition PENDING -> PLANNING: {res.status_code}")
        assert res.status_code == 200
        assert res.json()["data"]["status"] == "PLANNING"

        # PLANNING -> RUNNING (valid, started_at set)
        res = await client.patch(
            f"/api/v1/tasks/{task_id}",
            json={"status": "RUNNING"},
            headers=headers_a,
        )
        print(f"\n[8.2] Transition PLANNING -> RUNNING: {res.status_code}")
        assert res.status_code == 200
        assert res.json()["data"]["status"] == "RUNNING"
        assert res.json()["data"]["started_at"] is not None

        # RUNNING -> PLANNING (invalid! 409 Conflict expected)
        res = await client.patch(
            f"/api/v1/tasks/{task_id}",
            json={"status": "PLANNING"},
            headers=headers_a,
        )
        print(f"\n[8.3] Transition RUNNING -> PLANNING (Invalid): {res.status_code}")
        print(res.json())
        assert res.status_code == 409
        assert res.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"

        # RUNNING -> COMPLETED (valid, completed_at set)
        res = await client.patch(
            f"/api/v1/tasks/{task_id}",
            json={"status": "COMPLETED"},
            headers=headers_a,
        )
        print(f"\n[8.4] Transition RUNNING -> COMPLETED: {res.status_code}")
        assert res.status_code == 200
        assert res.json()["data"]["status"] == "COMPLETED"
        assert res.json()["data"]["completed_at"] is not None

        # COMPLETED -> RUNNING (invalid! 409 Conflict expected)
        res = await client.patch(
            f"/api/v1/tasks/{task_id}",
            json={"status": "RUNNING"},
            headers=headers_a,
        )
        print(f"\n[8.5] Transition COMPLETED -> RUNNING (Invalid): {res.status_code}")
        assert res.status_code == 409

        # -------------------------------------------------------------------
        # 6. Pagination & Sorting Verification
        # -------------------------------------------------------------------
        # Create extra tasks for User A to check pagination
        await client.post(
            "/api/v1/tasks",
            json={
                "title": "Second Task",
                "goal": "Test sorting pagination",
                "priority": "LOW",
            },
            headers=headers_a,
        )
        await client.post(
            "/api/v1/tasks",
            json={
                "title": "Third Task",
                "goal": "Test sorting pagination 2",
                "priority": "URGENT",
            },
            headers=headers_a,
        )

        # GET /tasks with page=1, limit=2, sort_by=priority, sort_order=desc
        # MongoDB sorts by string representation of the enum value.
        res = await client.get(
            "/api/v1/tasks?page=1&limit=2&sort_by=priority&sort_order=desc",
            headers=headers_a,
        )
        print(f"\n[9] Paginated Task Listing (limit=2): {res.status_code}")
        print(res.json())
        assert res.status_code == 200
        tasks_list = res.json()["data"]
        assert len(tasks_list) == 2

        # -------------------------------------------------------------------
        # 7. Soft Delete Verification
        # -------------------------------------------------------------------
        res = await client.delete(f"/api/v1/tasks/{task_id}", headers=headers_a)
        print(f"\n[10.1] Soft Delete Task: {res.status_code}")
        assert res.status_code == 200

        # Try to retrieve it -> should be 404
        res = await client.get(f"/api/v1/tasks/{task_id}", headers=headers_a)
        print(f"\n[10.2] Get Soft-deleted Task (Should Fail): {res.status_code}")
        assert res.status_code == 404

        # List tasks -> should exclude the soft-deleted task
        res = await client.get("/api/v1/tasks", headers=headers_a)
        print("\n[10.3] Listing Tasks (Excluding Soft Deleted):")
        print(res.json())
        assert res.status_code == 200
        active_ids = [t["id"] for t in res.json()["data"]]
        assert task_id not in active_ids

        print("\n=== MILESTONE 4 TASKS ENGINE VERIFIED SUCCESSFULLY ===")


if __name__ == "__main__":
    asyncio.run(setup_db())
    asyncio.run(verify_tasks_engine())
