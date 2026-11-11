from typing import List, Optional
from pydantic import BaseModel, Field


class ArtistReference(BaseModel):
    id: str
    name: str


class AlbumReference(BaseModel):
    id: str
    title: str
    coverUrl: Optional[str] = None


class Track(BaseModel):
    id: str
    youtubeId: str
    title: str
    artist: str
    artists: Optional[List[ArtistReference]] = None
    album: Optional[AlbumReference] = None
    durationSec: int = 0
    thumbnailUrl: str
    channelId: Optional[str] = None
    channelTitle: Optional[str] = None
    views: Optional[int] = None
    publishedAt: Optional[str] = None
    isLiked: Optional[bool] = False


class ArtistReferenceSearchResult(BaseModel):
    id: str
    name: str
    avatarUrl: Optional[str] = None
    channelId: Optional[str] = None


class PlaylistSearchResult(BaseModel):
    id: str
    title: str
    thumbnailUrl: Optional[str] = None
    channelTitle: Optional[str] = None
    trackCount: Optional[int] = 0


class SearchResult(BaseModel):
    tracks: List[Track] = Field(default_factory=list)
    artists: List[ArtistReferenceSearchResult] = Field(default_factory=list)
    playlists: List[PlaylistSearchResult] = Field(default_factory=list)
    nextPageToken: Optional[str] = None
