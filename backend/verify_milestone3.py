"""Verification script for Milestone 3 authentication and user foundation.

Runs automated tests against a live server to verify all requirements:
registration, login, JWT validation, refresh token rotation, duplicate prevention,
invalid password rejections, and session invalidation logouts.
"""

import asyncio
from typing import Any

import httpx
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = "http://localhost:8000"
DB_URI = "mongodb://localhost:27017"
DB_NAME = "nova_dev"

TEST_EMAIL = "testuser@example.com"
TEST_USERNAME = "testuser"
TEST_PASSWORD = "secure_password_123"
TEST_FULL_NAME = "Nova Test User"


async def setup_db() -> None:
    """Clean database state before starting verification checks."""
    client: AsyncIOMotorClient[Any] = AsyncIOMotorClient(DB_URI)
    db = client[DB_NAME]
    # Delete test user if present
    await db.users.delete_many({"email": TEST_EMAIL})
    await db.refresh_tokens.delete_many({"user_id": TEST_USERNAME})
    client.close()
    print("[-] Pre-test DB cleanup completed.")


async def verify_flow() -> None:
    """Execute API requests to check authentication endpoints."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        # Check Health
        res = await client.get("/health")
        print(f"\n[1] Health Check: {res.status_code} {res.json()}")

        # 3. Create test user
        register_payload = {
            "email": TEST_EMAIL,
            "username": TEST_USERNAME,
            "full_name": TEST_FULL_NAME,
            "password": TEST_PASSWORD,
        }
        res = await client.post("/api/v1/auth/register", json=register_payload)
        print(f"\n[3] Create Test User: {res.status_code}")
        print(res.json())
        assert res.status_code == 201
        assert res.json()["success"] is True
        assert res.json()["data"]["email"] == TEST_EMAIL

        # 10. Verify duplicate registration rejection (Duplicate Email)
        res = await client.post("/api/v1/auth/register", json=register_payload)
        print(f"\n[10.1] Duplicate Email Register Check: {res.status_code}")
        print(res.json())
        assert res.status_code == 409
        assert res.json()["success"] is False
        assert res.json()["error"]["code"] == "EMAIL_ALREADY_TAKEN"

        # 10. Verify duplicate registration rejection (Duplicate Username)
        duplicate_username_payload = {
            "email": "different_email@example.com",
            "username": TEST_USERNAME,
            "full_name": TEST_FULL_NAME,
            "password": TEST_PASSWORD,
        }
        res = await client.post(
            "/api/v1/auth/register", json=duplicate_username_payload
        )
        print(f"\n[10.2] Duplicate Username Register Check: {res.status_code}")
        print(res.json())
        assert res.status_code == 409
        assert res.json()["success"] is False
        assert res.json()["error"]["code"] == "USERNAME_ALREADY_TAKEN"

        # 11. Verify invalid password login rejection
        invalid_login_payload = {"email": TEST_EMAIL, "password": "wrong_password"}
        res = await client.post("/api/v1/auth/login", json=invalid_login_payload)
        print(f"\n[11] Invalid Password Login: {res.status_code}")
        print(res.json())
        assert res.status_code == 401
        assert res.json()["success"] is False
        assert res.json()["error"]["code"] == "INVALID_CREDENTIALS"

        # 4. Login successfully
        login_payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
        res = await client.post("/api/v1/auth/login", json=login_payload)
        print(f"\n[4] Login Success Check: {res.status_code}")
        print(res.json())
        assert res.status_code == 200
        data = res.json()["data"]
        access_token = data["access_token"]
        refresh_token = data["refresh_token"]
        assert access_token is not None
        assert refresh_token is not None
        assert data["token_type"] == "Bearer"

        # 5. Verify access token (by calling protected endpoint)
        headers = {"Authorization": f"Bearer {access_token}"}
        res = await client.get("/api/v1/users/me", headers=headers)
        print(f"\n[5/7] Verify Access Token & Protected Endpoint: {res.status_code}")
        print(res.json())
        assert res.status_code == 200
        assert res.json()["success"] is True
        assert res.json()["data"]["email"] == TEST_EMAIL

        # Verify access token protected route failure without headers
        res = await client.get("/api/v1/users/me")
        print(f"\n[7] Protected Endpoint block without token: {res.status_code}")
        # HTTPBearer returns 401 Unauthorized on missing headers
        assert res.status_code == 401

        # 9. Verify Refresh Token Rotation
        # Call refresh endpoint with original refresh token
        refresh_payload = {"refresh_token": refresh_token}
        res = await client.post("/api/v1/auth/refresh", json=refresh_payload)
        print(f"\n[9.1] Rotate Refresh Token: {res.status_code}")
        print(res.json())
        assert res.status_code == 200
        data2 = res.json()["data"]
        new_access_token = data2["access_token"]
        new_refresh_token = data2["refresh_token"]
        assert new_access_token != access_token
        assert new_refresh_token != refresh_token

        # Try to refresh again using the OLD refresh token
        # (should fail and trigger breach revocation)
        res = await client.post("/api/v1/auth/refresh", json=refresh_payload)
        print(f"\n[9.2] Re-use Revoked Refresh Token (Should Fail): {res.status_code}")
        print(res.json())
        assert res.status_code == 401
        assert res.json()["success"] is False
        assert res.json()["error"]["code"] == "TOKEN_REVOKED"

        # Verify the new refresh token is also revoked due to breach compromise
        new_refresh_payload = {"refresh_token": new_refresh_token}
        res = await client.post("/api/v1/auth/refresh", json=new_refresh_payload)
        print(f"\n[9.3] Verify Rotation Breach Lockout of New Token: {res.status_code}")
        print(res.json())
        assert res.status_code == 401
        assert res.json()["success"] is False

        # Login again to get a fresh refresh token for logout tests
        res = await client.post("/api/v1/auth/login", json=login_payload)
        latest_refresh_token = res.json()["data"]["refresh_token"]

        # 8. Verify Logout
        logout_payload = {"refresh_token": latest_refresh_token}
        res = await client.post("/api/v1/auth/logout", json=logout_payload)
        print(f"\n[8.1] Logout Session: {res.status_code}")
        print(res.json())
        assert res.status_code == 200
        assert res.json()["success"] is True

        # Try to refresh with logged-out refresh token (should fail)
        res = await client.post("/api/v1/auth/refresh", json=logout_payload)
        print(f"\n[8.2] Verify Logged-out Refresh Rejection: {res.status_code}")
        print(res.json())
        assert res.status_code == 401
        assert res.json()["success"] is False

        print("\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY ===")


if __name__ == "__main__":
    asyncio.run(setup_db())
    asyncio.run(verify_flow())
