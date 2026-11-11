import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    playlists = relationship("Playlist", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("UserLike", back_populates="user", cascade="all, delete-orphan")
    history = relationship("PlayHistory", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    followed_artists = relationship("FollowedArtist", back_populates="user", cascade="all, delete-orphan")


class TrackModel(Base):
    __tablename__ = "tracks"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    youtube_id = Column(String(64), unique=True, index=True, nullable=False)
    title = Column(String(512), nullable=False)
    artist = Column(String(255), nullable=False, index=True)
    album_title = Column(String(255), nullable=True)
    duration_sec = Column(Integer, default=0)
    thumbnail_url = Column(String(1024), nullable=False)
    channel_id = Column(String(128), nullable=True)
    channel_title = Column(String(255), nullable=True)
    views = Column(Integer, default=0)
    published_at = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    playlist_tracks = relationship("PlaylistTrack", back_populates="track", cascade="all, delete-orphan")
    likes = relationship("UserLike", back_populates="track", cascade="all, delete-orphan")
    play_histories = relationship("PlayHistory", back_populates="track", cascade="all, delete-orphan")


class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    cover_url = Column(String(1024), nullable=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="playlists")
    playlist_tracks = relationship("PlaylistTrack", back_populates="playlist", cascade="all, delete-orphan", order_by="PlaylistTrack.position")


class PlaylistTrack(Base):
    __tablename__ = "playlist_tracks"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    playlist_id = Column(String(64), ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False, index=True)
    track_id = Column(String(64), ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False, default=0)
    added_at = Column(DateTime, default=utc_now)

    playlist = relationship("Playlist", back_populates="playlist_tracks")
    track = relationship("TrackModel", back_populates="playlist_tracks")

    __table_args__ = (
        UniqueConstraint("playlist_id", "track_id", name="uq_playlist_track"),
        Index("idx_playlist_position", "playlist_id", "position"),
    )


class UserLike(Base):
    __tablename__ = "user_likes"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    track_id = Column(String(64), ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="likes")
    track = relationship("TrackModel", back_populates="likes")

    __table_args__ = (
        UniqueConstraint("user_id", "track_id", name="uq_user_like"),
    )


class PlayHistory(Base):
    __tablename__ = "play_history"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    track_id = Column(String(64), ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False, index=True)
    played_at = Column(DateTime, default=utc_now, index=True)

    user = relationship("User", back_populates="history")
    track = relationship("TrackModel", back_populates="play_histories")


class FollowedArtist(Base):
    __tablename__ = "followed_artists"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    artist_name = Column(String(255), nullable=False)
    channel_id = Column(String(128), nullable=True)
    avatar_url = Column(String(1024), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="followed_artists")

    __table_args__ = (
        UniqueConstraint("user_id", "artist_name", name="uq_user_artist"),
    )


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    theme = Column(String(64), default="dark")
    audio_quality = Column(String(64), default="high")
    autoplay = Column(Boolean, default=True)
    volume = Column(Integer, default=80)
    search_history_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="settings")
