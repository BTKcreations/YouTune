from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_user_optional
from app.models.models import Playlist, PlaylistTrack, TrackModel, User
from app.schemas.common import ApiResponse
from app.schemas.dtos import (
    PlaylistResponse,
    CreatePlaylistDto,
    UpdatePlaylistDto,
    AddTrackToPlaylistDto,
    ReorderPlaylistTracksDto,
)
from app.schemas.music import Track
from app.services.track_service import get_or_create_track, track_model_to_schema

router = APIRouter(prefix="/playlists", tags=["playlists"])


def playlist_to_response(playlist: Playlist, include_tracks: bool = True) -> PlaylistResponse:
    tracks: List[Track] = []
    total_duration = 0
    if include_tracks and playlist.playlist_tracks:
        for pt in playlist.playlist_tracks:
            if pt.track:
                tracks.append(track_model_to_schema(pt.track))
                total_duration += pt.track.duration_sec

    return PlaylistResponse(
        id=playlist.id,
        userId=playlist.user_id,
        title=playlist.title,
        description=playlist.description,
        coverUrl=playlist.cover_url,
        isPublic=playlist.is_public,
        trackCount=len(playlist.playlist_tracks) if playlist.playlist_tracks else 0,
        totalDurationSec=total_duration,
        tracks=tracks if include_tracks else None,
        createdAt=playlist.created_at.isoformat() if playlist.created_at else "",
        updatedAt=playlist.updated_at.isoformat() if playlist.updated_at else "",
    )


@router.get("", response_model=ApiResponse)
async def get_user_playlists(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Playlist)
        .where(Playlist.user_id == current_user.id)
        .options(selectinload(Playlist.playlist_tracks).selectinload(PlaylistTrack.track))
        .order_by(Playlist.updated_at.desc())
    )
    result = await db.execute(stmt)
    playlists = result.scalars().all()
    data = [playlist_to_response(p, include_tracks=False).model_dump() for p in playlists]
    return ApiResponse(success=True, data=data)


@router.post("", response_model=ApiResponse)
async def create_playlist(
    dto: CreatePlaylistDto,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_playlist = Playlist(
        user_id=current_user.id,
        title=dto.title.strip(),
        description=dto.description.strip() if dto.description else None,
        is_public=dto.isPublic if dto.isPublic is not None else True,
        cover_url="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80"
    )
    db.add(new_playlist)
    await db.commit()
    await db.refresh(new_playlist)
    
    # Reload with empty playlist_tracks
    stmt = (
        select(Playlist)
        .where(Playlist.id == new_playlist.id)
        .options(selectinload(Playlist.playlist_tracks))
    )
    res = await db.execute(stmt)
    full_playlist = res.scalars().first()
    return ApiResponse(success=True, data=playlist_to_response(full_playlist, include_tracks=True).model_dump())


@router.get("/{playlist_id}", response_model=ApiResponse)
async def get_playlist(
    playlist_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Playlist)
        .where(Playlist.id == playlist_id)
        .options(selectinload(Playlist.playlist_tracks).selectinload(PlaylistTrack.track))
    )
    result = await db.execute(stmt)
    playlist = result.scalars().first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    if not playlist.is_public and (not current_user or current_user.id != playlist.user_id):
        raise HTTPException(status_code=403, detail="This playlist is private")

    return ApiResponse(success=True, data=playlist_to_response(playlist, include_tracks=True).model_dump())


@router.put("/{playlist_id}", response_model=ApiResponse)
async def update_playlist(
    playlist_id: str,
    dto: UpdatePlaylistDto,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Playlist)
        .where(Playlist.id == playlist_id)
        .options(selectinload(Playlist.playlist_tracks).selectinload(PlaylistTrack.track))
    )
    result = await db.execute(stmt)
    playlist = result.scalars().first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    if playlist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if dto.title is not None:
        playlist.title = dto.title.strip()
    if dto.description is not None:
        playlist.description = dto.description.strip()
    if dto.isPublic is not None:
        playlist.is_public = dto.isPublic
    if dto.coverUrl is not None:
        playlist.cover_url = dto.coverUrl

    await db.commit()
    await db.refresh(playlist)
    return ApiResponse(success=True, data=playlist_to_response(playlist, include_tracks=True).model_dump())


@router.delete("/{playlist_id}", response_model=ApiResponse)
async def delete_playlist(
    playlist_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Playlist).where(Playlist.id == playlist_id)
    result = await db.execute(stmt)
    playlist = result.scalars().first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    if playlist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    await db.delete(playlist)
    await db.commit()
    return ApiResponse(success=True, data={"id": playlist_id}, message="Playlist deleted successfully")


@router.post("/{playlist_id}/tracks", response_model=ApiResponse)
async def add_track_to_playlist(
    playlist_id: str,
    dto: AddTrackToPlaylistDto,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Playlist)
        .where(Playlist.id == playlist_id)
        .options(selectinload(Playlist.playlist_tracks))
    )
    result = await db.execute(stmt)
    playlist = result.scalars().first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    if playlist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Persist track in DB if needed
    track_record = await get_or_create_track(db, dto.track)

    # Check if track already in playlist
    for pt in playlist.playlist_tracks:
        if pt.track_id == track_record.id:
            # Already added, return playlist
            return ApiResponse(success=True, data=playlist_to_response(playlist, include_tracks=True).model_dump(), message="Track already in playlist")

    position = dto.position if dto.position is not None else len(playlist.playlist_tracks)
    new_pt = PlaylistTrack(
        playlist_id=playlist.id,
        track_id=track_record.id,
        position=position
    )
    db.add(new_pt)

    # If playlist has default cover or no cover, set it to the track's thumbnail
    if not playlist.cover_url or "unsplash" in playlist.cover_url:
        playlist.cover_url = track_record.thumbnail_url

    await db.commit()
    db.expire_all()

    # Reload playlist with updated tracks
    stmt = (
        select(Playlist)
        .where(Playlist.id == playlist_id)
        .options(selectinload(Playlist.playlist_tracks).selectinload(PlaylistTrack.track))
    )
    res = await db.execute(stmt)
    updated_playlist = res.scalars().first()
    return ApiResponse(success=True, data=playlist_to_response(updated_playlist, include_tracks=True).model_dump())


@router.delete("/{playlist_id}/tracks/{track_id}", response_model=ApiResponse)
async def remove_track_from_playlist(
    playlist_id: str,
    track_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Playlist)
        .where(Playlist.id == playlist_id)
        .options(selectinload(Playlist.playlist_tracks).selectinload(PlaylistTrack.track))
    )
    result = await db.execute(stmt)
    playlist = result.scalars().first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    if playlist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # track_id could be TrackModel.id or TrackModel.youtube_id
    found_pt = None
    for pt in playlist.playlist_tracks:
        if pt.track_id == track_id or (pt.track and pt.track.youtube_id == track_id):
            found_pt = pt
            break

    if found_pt:
        await db.delete(found_pt)
        await db.commit()
        db.expire_all()

    # Reload
    stmt = (
        select(Playlist)
        .where(Playlist.id == playlist_id)
        .options(selectinload(Playlist.playlist_tracks).selectinload(PlaylistTrack.track))
    )
    res = await db.execute(stmt)
    updated_playlist = res.scalars().first()
    return ApiResponse(success=True, data=playlist_to_response(updated_playlist, include_tracks=True).model_dump())


@router.put("/{playlist_id}/tracks/reorder", response_model=ApiResponse)
async def reorder_playlist_tracks(
    playlist_id: str,
    dto: ReorderPlaylistTracksDto,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Playlist)
        .where(Playlist.id == playlist_id)
        .options(selectinload(Playlist.playlist_tracks).selectinload(PlaylistTrack.track))
    )
    result = await db.execute(stmt)
    playlist = result.scalars().first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    if playlist.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Map trackId/youtubeId to PlaylistTrack
    track_map = {}
    for pt in playlist.playlist_tracks:
        track_map[pt.track_id] = pt
        if pt.track:
            track_map[pt.track.youtube_id] = pt

    for new_idx, tid in enumerate(dto.trackIds):
        if tid in track_map:
            track_map[tid].position = new_idx

    await db.commit()
    db.expire_all()

    # Reload ordered
    stmt = (
        select(Playlist)
        .where(Playlist.id == playlist_id)
        .options(selectinload(Playlist.playlist_tracks).selectinload(PlaylistTrack.track))
    )
    res = await db.execute(stmt)
    updated_playlist = res.scalars().first()
    # Sort in memory as well for response
    if updated_playlist and updated_playlist.playlist_tracks:
        updated_playlist.playlist_tracks.sort(key=lambda x: x.position)

    return ApiResponse(success=True, data=playlist_to_response(updated_playlist, include_tracks=True).model_dump())
