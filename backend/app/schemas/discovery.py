from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.music import Track, ArtistReference, AlbumReference, SearchResult, PlaylistSearchResult, ArtistReferenceSearchResult


class GenreCategory(BaseModel):
    id: str
    title: str
    color: str
    imageUrl: Optional[str] = None
    searchQuery: str
    description: Optional[str] = None


class TrendingChart(BaseModel):
    region: str
    genre: Optional[str] = "All"
    tracks: List[Track] = Field(default_factory=list)


class RelatedArtist(BaseModel):
    id: str
    name: str
    avatarUrl: Optional[str] = None
    subscribersCount: Optional[int] = None
    topTracks: List[Track] = Field(default_factory=list)
    matchScore: Optional[float] = 1.0


class HomeFeedSection(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    type: str = "tracks"  # tracks, playlists, artists, genres
    items: List[Any] = Field(default_factory=list)


class HomeFeedResponse(BaseModel):
    sections: List[HomeFeedSection] = Field(default_factory=list)
