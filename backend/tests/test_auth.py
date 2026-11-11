import pytest


@pytest.mark.asyncio
async def test_auth_and_profile_flow(client):
    # 1. Register user
    reg_payload = {
        "email": "tester@example.com",
        "username": "tester",
        "password": "Password123!"
    }
    res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == "tester@example.com"
    tokens = data["data"]["tokens"]
    assert "accessToken" in tokens
    assert "refreshToken" in tokens
    access_token = tokens["accessToken"]

    # 2. Duplicate registration should fail with 400
    res_dup = await client.post("/api/v1/auth/register", json=reg_payload)
    assert res_dup.status_code == 400

    # 3. Login with correct credentials
    login_payload = {
        "email": "tester@example.com",
        "password": "Password123!"
    }
    res_login = await client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    login_data = res_login.json()
    assert login_data["success"] is True
    assert login_data["data"]["user"]["username"] == "tester"

    # 4. Login with invalid password
    res_bad_login = await client.post("/api/v1/auth/login", json={"email": "tester@example.com", "password": "wrong"})
    assert res_bad_login.status_code == 401

    # 5. Access protected /me route
    res_me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert res_me.status_code == 200
    assert res_me.json()["data"]["email"] == "tester@example.com"

    # 6. Refresh token
    res_refresh = await client.post("/api/v1/auth/refresh", json={"refreshToken": tokens["refreshToken"]})
    assert res_refresh.status_code == 200
    assert "accessToken" in res_refresh.json()["data"]["tokens"]
