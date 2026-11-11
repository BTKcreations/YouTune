// C:\Users\Windows\.gemini\antigravity\scratch\youtune\frontend\src\types\music.ts

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
export type RepeatMode = 'off' | 'all' | 'one';

export interface ArtistReference {
  id: string;
  name: string;
}

export interface AlbumReference {
  id: string;
  title: string;
  coverUrl?: string;
}

export interface Track {
  id: string; // Unique internal track ID (or youtubeId if standalone)
  youtubeId: string; // YouTube Video ID (required for compliance playback)
  title: string;
  artist: string;
  artists?: ArtistReference[];
  album?: AlbumReference;
  durationSec: number;
  thumbnailUrl: string;
  channelId?: string;
  channelTitle?: string;
  views?: number;
  publishedAt?: string;
  isLiked?: boolean;
}

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  trackCount: number;
  totalDurationSec: number;
  tracks?: Track[];
  createdAt: string;
  updatedAt: string;
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  bannerUrl?: string;
  bio?: string;
  subscribersCount?: number;
  monthlyListeners?: number;
  topTracks: Track[];
  albums?: Album[];
  relatedArtists?: ArtistReference[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverUrl: string;
  releaseYear?: number;
  trackCount: number;
  tracks?: Track[];
}

export interface GenreCategory {
  id: string;
  title: string;
  color: string;
  imageUrl?: string;
  searchQuery: string;
  description?: string;
}

export interface QueueItem {
  queueId: string; // UUID to handle duplicate tracks in queue
  track: Track;
}
