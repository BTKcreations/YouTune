import pytest


@pytest.mark.asyncio
async def test_library_and_settings_flow(client):
    # 1. Register user
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": "lib_user@example.com",
        "username": "lib_fan",
        "password": "Password123!"
    })
    token = reg_res.json()["data"]["tokens"]["accessToken"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    sample_track = {
        "id": "t_synth",
        "youtubeId": "synth_123",
        "title": "Midnight City",
        "artist": "M83",
        "durationSec": 243,
        "thumbnailUrl": "https://i.ytimg.com/vi/synth_123/hqdefault.jpg"
    }

    # 2. Like track
    like_res = await client.post("/api/v1/library/likes/synth_123", json={"track": sample_track}, headers=auth_headers)
    assert like_res.status_code == 200
    assert like_res.json()["data"]["liked"] is True

    # 3. Get likes
    likes_list = await client.get("/api/v1/library/likes", headers=auth_headers)
    assert likes_list.status_code == 200
    assert len(likes_list.json()["data"]) == 1
    assert likes_list.json()["data"][0]["youtubeId"] == "synth_123"

    # 4. Unlike track
    unlike_res = await client.delete("/api/v1/library/likes/synth_123", headers=auth_headers)
    assert unlike_res.status_code == 200
    assert unlike_res.json()["data"]["liked"] is False

    # 5. Playback history
    hist_post = await client.post("/api/v1/library/history", json={"track": sample_track}, headers=auth_headers)
    assert hist_post.status_code == 200
    
    hist_get = await client.get("/api/v1/library/history", headers=auth_headers)
    assert hist_get.status_code == 200
    assert len(hist_get.json()["data"]) == 1
    assert hist_get.json()["data"][0]["track"]["title"] == "Midnight City"

    # 6. Follow artist
    follow_res = await client.post("/api/v1/library/artists/follow", json={
        "artistName": "Daft Punk",
        "channelId": "UC_daftpunk",
        "avatarUrl": "https://example.com/daft.jpg"
    }, headers=auth_headers)
    assert follow_res.status_code == 200

    followed_list = await client.get("/api/v1/library/artists", headers=auth_headers)
    assert followed_list.status_code == 200
    assert len(followed_list.json()["data"]) == 1
    assert followed_list.json()["data"][0]["artistName"] == "Daft Punk"

    # 7. Unfollow artist
    unfollow_res = await client.delete("/api/v1/library/artists/unfollow/Daft Punk", headers=auth_headers)
    assert unfollow_res.status_code == 200

    # 8. Settings get & update
    settings_res = await client.get("/api/v1/settings", headers=auth_headers)
    assert settings_res.status_code == 200
    assert settings_res.json()["data"]["theme"] == "dark"

    update_settings_res = await client.put("/api/v1/settings", json={
        "theme": "spotify-black",
        "volume": 90,
        "searchHistory": ["synthwave", "lofi"]
    }, headers=auth_headers)
    assert update_settings_res.status_code == 200
    assert update_settings_res.json()["data"]["theme"] == "spotify-black"
    assert update_settings_res.json()["data"]["volume"] == 90
    assert "synthwave" in update_settings_res.json()["data"]["searchHistory"]
