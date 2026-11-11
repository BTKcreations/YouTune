// C:\Users\Windows\.gemini\antigravity\scratch\youtune\frontend\src\types\api.ts

import { Track, Playlist, Artist, GenreCategory } from './music';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPageToken?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface SearchQueryFilters {
  query: string;
  type?: 'track' | 'artist' | 'playlist' | 'album' | 'all';
  pageToken?: string;
  limit?: number;
}

export interface SearchResult {
  tracks: Track[];
  artists: ArtistReferenceSearchResult[];
  playlists: PlaylistSearchResult[];
  nextPageToken?: string;
}

export interface ArtistReferenceSearchResult {
  id: string;
  name: string;
  avatarUrl?: string;
  channelId?: string;
}

export interface PlaylistSearchResult {
  id: string;
  title: string;
  thumbnailUrl?: string;
  channelTitle?: string;
  trackCount?: number;
}

export interface CreatePlaylistDto {
  title: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdatePlaylistDto {
  title?: string;
  description?: string;
  isPublic?: boolean;
  coverUrl?: string;
}

export interface AddTrackToPlaylistDto {
  track: Track;
  position?: number;
}

export interface ReorderPlaylistTracksDto {
  trackIds: string[];
}

export interface HistoryItem {
  id: string;
  track: Track;
  playedAt: string;
}
