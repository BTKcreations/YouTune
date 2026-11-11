from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, UserLike, PlayHistory, FollowedArtist, TrackModel
from app.schemas.common import ApiResponse
from app.schemas.music import Track
from app.schemas.dtos import HistoryItem
from app.services.track_service import get_or_create_track, track_model_to_schema

router = APIRouter(prefix="/library", tags=["library"])


class TrackPayload(BaseModel):
    track: Track


class ArtistFollowPayload(BaseModel):
    artistName: str
    channelId: Optional[str] = None
    avatarUrl: Optional[str] = None


@router.get("/likes", response_model=ApiResponse)
async def get_liked_tracks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(UserLike)
        .where(UserLike.user_id == current_user.id)
        .options(selectinload(UserLike.track))
        .order_by(UserLike.created_at.desc())
    )
    result = await db.execute(stmt)
    likes = result.scalars().all()
    tracks: List[Track] = []
    for lk in likes:
        if lk.track:
            tracks.append(track_model_to_schema(lk.track, is_liked=True))
    return ApiResponse(success=True, data=[t.model_dump() for t in tracks])


@router.post("/likes/{youtube_id}", response_model=ApiResponse)
async def like_track(
    youtube_id: str,
    payload: Optional[TrackPayload] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    track_record = None
    if payload and payload.track:
        track_record = await get_or_create_track(db, payload.track)
    else:
        res = await db.execute(select(TrackModel).where(TrackModel.youtube_id == youtube_id))
        track_record = res.scalars().first()
        if not track_record:
            # Create a placeholder track if needed
            placeholder = Track(
                id=f"yt_{youtube_id}",
                youtubeId=youtube_id,
                title="Unknown Track",
                artist="Unknown Artist",
                thumbnailUrl=f"https://i.ytimg.com/vi/{youtube_id}/hqdefault.jpg"
            )
            track_record = await get_or_create_track(db, placeholder)

    # Check if already liked
    like_stmt = select(UserLike).where(
        UserLike.user_id == current_user.id,
        UserLike.track_id == track_record.id
    )
    existing = (await db.execute(like_stmt)).scalars().first()
    if not existing:
        new_like = UserLike(user_id=current_user.id, track_id=track_record.id)
        db.add(new_like)
        await db.commit()

    return ApiResponse(
        success=True,
        data={"liked": True, "track": track_model_to_schema(track_record, is_liked=True).model_dump()},
        message="Track added to liked songs"
    )


@router.delete("/likes/{youtube_id}", response_model=ApiResponse)
async def unlike_track(
    youtube_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(TrackModel).where(TrackModel.youtube_id == youtube_id))
    track_record = res.scalars().first()
    if track_record:
        like_stmt = select(UserLike).where(
            UserLike.user_id == current_user.id,
            UserLike.track_id == track_record.id
        )
        existing = (await db.execute(like_stmt)).scalars().first()
        if existing:
            await db.delete(existing)
            await db.commit()

    return ApiResponse(success=True, data={"liked": False, "youtubeId": youtube_id}, message="Track removed from liked songs")


@router.get("/history", response_model=ApiResponse)
async def get_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(PlayHistory)
        .where(PlayHistory.user_id == current_user.id)
        .options(selectinload(PlayHistory.track))
        .order_by(PlayHistory.played_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    
    # Retrieve user likes to mark isLiked accurately
    liked_res = await db.execute(select(UserLike.track_id).where(UserLike.user_id == current_user.id))
    liked_ids = set(liked_res.scalars().all())

    history_items: List[HistoryItem] = []
    for ph in records:
        if ph.track:
            history_items.append(
                HistoryItem(
                    id=ph.id,
                    track=track_model_to_schema(ph.track, is_liked=(ph.track.id in liked_ids)),
                    playedAt=ph.played_at.isoformat() if ph.played_at else ""
                )
            )

    return ApiResponse(success=True, data=[h.model_dump() for h in history_items])


@router.post("/history", response_model=ApiResponse)
async def add_history(
    payload: TrackPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    track_record = await get_or_create_track(db, payload.track)
    ph = PlayHistory(
        user_id=current_user.id,
        track_id=track_record.id
    )
    db.add(ph)
    await db.commit()
    await db.refresh(ph)

    item = HistoryItem(
        id=ph.id,
        track=track_model_to_schema(track_record),
        playedAt=ph.played_at.isoformat() if ph.played_at else ""
    )
    return ApiResponse(success=True, data=item.model_dump())


# Artist Follow / Unfollow
@router.get("/artists", response_model=ApiResponse)
async def get_followed_artists(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FollowedArtist).where(FollowedArtist.user_id == current_user.id).order_by(FollowedArtist.created_at.desc())
    result = await db.execute(stmt)
    artists = result.scalars().all()
    data = [
        {
            "id": a.id,
            "artistName": a.artist_name,
            "channelId": a.channel_id,
            "avatarUrl": a.avatar_url,
            "createdAt": a.created_at.isoformat() if a.created_at else "",
        }
        for a in artists
    ]
    return ApiResponse(success=True, data=data)


@router.post("/artists/follow", response_model=ApiResponse)
async def follow_artist(
    payload: ArtistFollowPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FollowedArtist).where(
        FollowedArtist.user_id == current_user.id,
        FollowedArtist.artist_name == payload.artistName.strip()
    )
    existing = (await db.execute(stmt)).scalars().first()
    if not existing:
        artist = FollowedArtist(
            user_id=current_user.id,
            artist_name=payload.artistName.strip(),
            channel_id=payload.channelId,
            avatar_url=payload.avatarUrl
        )
        db.add(artist)
        await db.commit()
        await db.refresh(artist)
    else:
        artist = existing

    return ApiResponse(
        success=True,
        data={
            "id": artist.id,
            "artistName": artist.artist_name,
            "channelId": artist.channel_id,
            "avatarUrl": artist.avatar_url,
        },
        message="Artist followed successfully"
    )


@router.delete("/artists/unfollow/{artist_name}", response_model=ApiResponse)
async def unfollow_artist(
    artist_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FollowedArtist).where(
        FollowedArtist.user_id == current_user.id,
        FollowedArtist.artist_name == artist_name.strip()
    )
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        await db.delete(existing)
        await db.commit()

    return ApiResponse(success=True, data={"artistName": artist_name}, message="Artist unfollowed")
