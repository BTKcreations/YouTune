from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.music import Track


class UserProfile(BaseModel):
    id: str
    email: str
    username: str
    avatarUrl: Optional[str] = None
    createdAt: str


class AuthTokens(BaseModel):
    accessToken: str
    refreshToken: Optional[str] = None
    expiresIn: int


class AuthData(BaseModel):
    user: UserProfile
    tokens: AuthTokens


class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshTokenRequest(BaseModel):
    refreshToken: str


class PlaylistResponse(BaseModel):
    id: str
    userId: str
    title: str
    description: Optional[str] = None
    coverUrl: Optional[str] = None
    isPublic: bool = True
    trackCount: int = 0
    totalDurationSec: int = 0
    tracks: Optional[List[Track]] = None
    createdAt: str
    updatedAt: str


class CreatePlaylistDto(BaseModel):
    title: str
    description: Optional[str] = None
    isPublic: Optional[bool] = True


class UpdatePlaylistDto(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    isPublic: Optional[bool] = None
    coverUrl: Optional[str] = None


class AddTrackToPlaylistDto(BaseModel):
    track: Track
    position: Optional[int] = None


class ReorderPlaylistTracksDto(BaseModel):
    trackIds: List[str]


class HistoryItem(BaseModel):
    id: str
    track: Track
    playedAt: str


class UserSettingsDto(BaseModel):
    theme: Optional[str] = "dark"
    audioQuality: Optional[str] = "high"
    autoplay: Optional[bool] = True
    volume: Optional[int] = 80
    searchHistory: Optional[List[str]] = Field(default_factory=list)


class UpdateUserSettingsDto(BaseModel):
    theme: Optional[str] = None
    audioQuality: Optional[str] = None
    autoplay: Optional[bool] = None
    volume: Optional[int] = None
    searchHistory: Optional[List[str]] = None
