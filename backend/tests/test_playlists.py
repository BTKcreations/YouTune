import pytest


@pytest.mark.asyncio
async def test_playlists_crud_and_reorder(client):
    # 1. Register and get token
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": "playlist_user@example.com",
        "username": "dj_user",
        "password": "Password123!"
    })
    token = reg_res.json()["data"]["tokens"]["accessToken"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. Create playlist
    create_res = await client.post("/api/v1/playlists", json={
        "title": "Chill Vibes",
        "description": "Late night coding tunes",
        "isPublic": True
    }, headers=auth_headers)
    assert create_res.status_code == 200
    pl_data = create_res.json()["data"]
    playlist_id = pl_data["id"]
    assert pl_data["title"] == "Chill Vibes"
    assert pl_data["trackCount"] == 0

    # 3. Add tracks
    track_1 = {
        "id": "t1",
        "youtubeId": "dQw4w9WgXcQ",
        "title": "Never Gonna Give You Up",
        "artist": "Rick Astley",
        "durationSec": 213,
        "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
    }
    track_2 = {
        "id": "t2",
        "youtubeId": "kJQP7kiw5Fk",
        "title": "Despacito",
        "artist": "Luis Fonsi",
        "durationSec": 282,
        "thumbnailUrl": "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg"
    }

    add_res1 = await client.post(f"/api/v1/playlists/{playlist_id}/tracks", json={"track": track_1}, headers=auth_headers)
    assert add_res1.status_code == 200
    assert add_res1.json()["data"]["trackCount"] == 1

    add_res2 = await client.post(f"/api/v1/playlists/{playlist_id}/tracks", json={"track": track_2}, headers=auth_headers)
    assert add_res2.status_code == 200
    assert add_res2.json()["data"]["trackCount"] == 2

    # 4. Get playlist
    get_res = await client.get(f"/api/v1/playlists/{playlist_id}")
    assert get_res.status_code == 200
    assert len(get_res.json()["data"]["tracks"]) == 2

    # 5. Reorder tracks
    reorder_res = await client.put(f"/api/v1/playlists/{playlist_id}/tracks/reorder", json={
        "trackIds": ["kJQP7kiw5Fk", "dQw4w9WgXcQ"]
    }, headers=auth_headers)
    assert reorder_res.status_code == 200
    tracks = reorder_res.json()["data"]["tracks"]
    assert tracks[0]["youtubeId"] == "kJQP7kiw5Fk"
    assert tracks[1]["youtubeId"] == "dQw4w9WgXcQ"

    # 6. Remove track
    del_track_res = await client.delete(f"/api/v1/playlists/{playlist_id}/tracks/kJQP7kiw5Fk", headers=auth_headers)
    assert del_track_res.status_code == 200
    assert del_track_res.json()["data"]["trackCount"] == 1

    # 7. Update playlist details
    update_res = await client.put(f"/api/v1/playlists/{playlist_id}", json={
        "title": "Updated Chill Vibes",
        "isPublic": False
    }, headers=auth_headers)
    assert update_res.status_code == 200
    assert update_res.json()["data"]["title"] == "Updated Chill Vibes"
    assert update_res.json()["data"]["isPublic"] is False

    # 8. Delete playlist
    del_res = await client.delete(f"/api/v1/playlists/{playlist_id}", headers=auth_headers)
    assert del_res.status_code == 200
