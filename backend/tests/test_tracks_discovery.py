import pytest


@pytest.mark.asyncio
async def test_search_tracks_mock_fallback(client):
    response = await client.get("/api/v1/tracks/search?q=test&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "tracks" in data["data"]
    assert len(data["data"]["tracks"]) > 0
    first_track = data["data"]["tracks"][0]
    assert "youtubeId" in first_track
    assert "title" in first_track
    assert "artist" in first_track


@pytest.mark.asyncio
async def test_trending_tracks(client):
    response = await client.get("/api/v1/tracks/trending?region=US&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) > 0


@pytest.mark.asyncio
async def test_track_detail(client):
    # Fetch a track from trending first
    trend_res = await client.get("/api/v1/tracks/trending?limit=1")
    track_id = trend_res.json()["data"][0]["youtubeId"]

    response = await client.get(f"/api/v1/tracks/{track_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["youtubeId"] == track_id


@pytest.mark.asyncio
async def test_related_tracks(client):
    # Fetch a track from trending first
    trend_res = await client.get("/api/v1/tracks/trending?limit=1")
    track_id = trend_res.json()["data"][0]["youtubeId"]

    response = await client.get(f"/api/v1/tracks/{track_id}/related?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    # The base track itself should be excluded
    for t in data["data"]:
        assert t["youtubeId"] != track_id
