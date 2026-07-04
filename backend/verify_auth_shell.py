"""Verification script for Phase 2 Authenticated Application Shell APIs.

Tests register, login, profile retrieval (/users/me), and token refresh rotation.
"""

import asyncio

from httpx import AsyncClient

BASE_URL = "http://localhost:8000"
TEST_EMAIL = "auth_shell_test@example.com"
TEST_USERNAME = "auth_shell_test"
TEST_PASSWORD = "secure_password_123"


async def verify_auth_shell_apis():
    from motor.motor_asyncio import AsyncIOMotorClient

    # 1. Clean DB
    mongo_client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = mongo_client["nova_dev"]
    await db.users.delete_many({"email": TEST_EMAIL})
    await db.tasks.delete_many({"user_id": TEST_USERNAME})
    mongo_client.close()
    print("[-] Pre-test DB cleaned.")

    async with AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        # 2. Register
        print("\n[1] Testing POST /api/v1/auth/register...")
        reg_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": TEST_EMAIL,
                "username": TEST_USERNAME,
                "full_name": "Auth Shell Test",
                "password": TEST_PASSWORD,
            },
        )
        print(f"Status: {reg_res.status_code}")
        print(f"Body: {reg_res.text}")
        assert reg_res.status_code == 201
        assert reg_res.json()["success"] is True

        # 3. Login
        print("\n[2] Testing POST /api/v1/auth/login...")
        login_res = await client.post(
            "/api/v1/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
            },
        )
        print(f"Status: {login_res.status_code}")
        print(f"Body: {login_res.text}")
        assert login_res.status_code == 200
        assert login_res.json()["success"] is True

        token_data = login_res.json()["data"]
        access_token = token_data["access_token"]
        refresh_token = token_data["refresh_token"]
        user_data = token_data["user"]

        assert user_data["email"] == TEST_EMAIL
        assert user_data["username"] == TEST_USERNAME
        assert user_data["full_name"] == "Auth Shell Test"

        # 4. Fetch Profile (/users/me)
        print("\n[3] Testing GET /api/v1/users/me...")
        profile_res = await client.get(
            "/api/v1/users/me", headers={"Authorization": f"Bearer {access_token}"}
        )
        print(f"Status: {profile_res.status_code}")
        print(f"Body: {profile_res.text}")
        assert profile_res.status_code == 200
        assert profile_res.json()["success"] is True
        assert profile_res.json()["data"]["username"] == TEST_USERNAME

        # 5. Token Refresh Rotation
        print("\n[4] Testing POST /api/v1/auth/refresh...")
        refresh_res = await client.post(
            "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
        )
        print(f"Status: {refresh_res.status_code}")
        print(f"Body: {refresh_res.text}")
        assert refresh_res.status_code == 200
        assert refresh_res.json()["success"] is True
        assert "access_token" in refresh_res.json()["data"]

        print("\n=== ALL INTEGRATION API VERIFICATIONS PASSED SUCCESSFULLY ===")


if __name__ == "__main__":
    asyncio.run(verify_auth_shell_apis())
