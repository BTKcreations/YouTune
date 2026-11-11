from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, Depends
from app.schemas.common import ApiResponse
from app.schemas.discovery import GenreCategory, TrendingChart, RelatedArtist, HomeFeedResponse
from app.services.discovery_service import discovery_service

router = APIRouter()


@router.get("/genres", response_model=ApiResponse)
async def get_genres():
    """Get all curated genres and mood categories."""
    genres = discovery_service.get_curated_genres()
    return ApiResponse(
        success=True,
        data=genres,
        message="Curated genres retrieved successfully"
    )


@router.get("/genres/{genre_id}", response_model=ApiResponse)
async def get_genre_details(genre_id: str, limit: int = Query(25, ge=1, le=50)):
    """Get genre category details and associated tracks."""
    genre = discovery_service.get_genre_by_id(genre_id)
    if not genre:
        raise HTTPException(status_code=404, detail=f"Genre '{genre_id}' not found")

    tracks = await discovery_service.get_genre_tracks(genre_id=genre_id, limit=limit)
    return ApiResponse(
        success=True,
        data={
            "genre": genre,
            "tracks": tracks
        },
        message=f"Tracks for genre '{genre.title}' retrieved"
    )


@router.get("/trending", response_model=ApiResponse)
async def get_trending(
    region: str = Query("US", description="Two-letter ISO region code"),
    genre: Optional[str] = Query(None, description="Optional genre filter"),
    limit: int = Query(25, ge=1, le=50)
):
    """Get trending music charts by region and optional genre."""
    chart = await discovery_service.get_trending_chart(region_code=region, genre=genre, limit=limit)
    return ApiResponse(
        success=True,
        data=chart,
        message=f"Trending chart for region {region.upper()} retrieved"
    )


@router.get("/related-artists", response_model=ApiResponse)
async def get_related_artists(
    artist: str = Query(..., description="Artist name to find relations for"),
    limit: int = Query(6, ge=1, le=20)
):
    """Get related artists based on history/tags and search."""
    related = await discovery_service.get_related_artists(artist_name=artist, limit=limit)
    return ApiResponse(
        success=True,
        data=related,
        message=f"Related artists for '{artist}' retrieved"
    )


@router.get("/home", response_model=ApiResponse)
async def get_home_feed(
    region: str = Query("US", description="Region code for local trending")
):
    """
    Get full dynamic personalized Home feed sections
    (Quick Picks, Top Picks, Trending, Moods/Genres, Featured Artists).
    """
    feed = await discovery_service.generate_home_feed(user_region=region)
    return ApiResponse(
        success=True,
        data=feed,
        message="Home feed generated successfully"
    )
