from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.schemas.common import ApiResponse
from app.schemas.music import Track, SearchResult
from app.services.youtube_service import youtube_service
from app.core.database import get_db
from app.core.deps import get_current_user_optional
from app.models.models import User, UserLike, TrackModel
from app.services.track_service import track_model_to_schema

router = APIRouter(prefix="/tracks", tags=["tracks"])


@router.get("/search", response_model=ApiResponse)
async def search_tracks(
    q: str = Query(..., description="Search query string"),
    type: str = Query("all", description="Search type: track, artist, playlist, or all"),
    pageToken: Optional[str] = Query(None, description="Page token for pagination"),
    limit: int = Query(25, ge=1, le=50, description="Max results")
):
    results = await youtube_service.search(query=q, search_type=type, page_token=pageToken, limit=limit)
    return ApiResponse(
        success=True,
        data=results.model_dump(),
        message="Search completed successfully"
    )


@router.get("/trending", response_model=ApiResponse)
async def get_trending_tracks(
    region: str = Query("US", description="Two letter ISO country code"),
    limit: int = Query(25, ge=1, le=50)
):
    tracks = await youtube_service.get_trending_music(region_code=region, limit=limit)
    return ApiResponse(
        success=True,
        data=[t.model_dump() for t in tracks],
        message="Trending tracks retrieved successfully"
    )


@router.get("/{youtube_id}", response_model=ApiResponse)
async def get_track_detail(
    youtube_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    track = await youtube_service.get_track_by_youtube_id(youtube_id)
    if not track:
        # Check database fallback
        stmt = select(TrackModel).where(TrackModel.youtube_id == youtube_id)
        res = await db.execute(stmt)
        record = res.scalars().first()
        if record:
            track = track_model_to_schema(record)
        else:
            raise HTTPException(status_code=404, detail="Track not found")

    # Check if user liked it
    if current_user:
        like_stmt = (
            select(UserLike)
            .join(TrackModel)
            .where(UserLike.user_id == current_user.id, TrackModel.youtube_id == youtube_id)
        )
        like_res = await db.execute(like_stmt)
        track.isLiked = like_res.scalars().first() is not None

    return ApiResponse(
        success=True,
        data=track.model_dump(),
        message="Track details retrieved successfully"
    )


@router.get("/{youtube_id}/related", response_model=ApiResponse)
async def get_related_tracks(
    youtube_id: str,
    limit: int = Query(20, ge=1, le=50)
):
    # Fetch base track first to get artist
    base_track = await youtube_service.get_track_by_youtube_id(youtube_id)
    search_q = base_track.artist if base_track else "trending music"
    
    # Search for related tracks
    results = await youtube_service.search(query=search_q, search_type="track", limit=limit)
    filtered = [t for t in results.tracks if t.youtubeId != youtube_id]
    return ApiResponse(
        success=True,
        data=[t.model_dump() for t in filtered],
        message="Related recommendation tracks retrieved"
    )
