from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.models import TrackModel
from app.schemas.music import Track


async def get_or_create_track(db: AsyncSession, track_in: Track) -> TrackModel:
    stmt = select(TrackModel).where(TrackModel.youtube_id == track_in.youtubeId)
    result = await db.execute(stmt)
    track_record = result.scalars().first()
    if track_record:
        return track_record
    
    new_track = TrackModel(
        id=track_in.id or f"yt_{track_in.youtubeId}",
        youtube_id=track_in.youtubeId,
        title=track_in.title,
        artist=track_in.artist,
        album_title=track_in.album.title if track_in.album else None,
        duration_sec=track_in.durationSec,
        thumbnail_url=track_in.thumbnailUrl,
        channel_id=track_in.channelId,
        channel_title=track_in.channelTitle,
        views=track_in.views or 0,
        published_at=track_in.publishedAt,
    )
    db.add(new_track)
    await db.commit()
    await db.refresh(new_track)
    return new_track


def track_model_to_schema(model: TrackModel, is_liked: bool = False) -> Track:
    return Track(
        id=model.id,
        youtubeId=model.youtube_id,
        title=model.title,
        artist=model.artist,
        durationSec=model.duration_sec,
        thumbnailUrl=model.thumbnail_url,
        channelId=model.channel_id,
        channelTitle=model.channel_title,
        views=model.views,
        publishedAt=model.published_at,
        isLiked=is_liked
    )
