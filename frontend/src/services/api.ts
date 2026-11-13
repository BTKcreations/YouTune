import { ApiResponse, SearchResult } from '../types/api';
import { Track, Playlist, Artist, GenreCategory } from '../types/music';
import { MOCK_TRACKS, MOCK_PLAYLISTS, MOCK_ARTISTS, MOCK_GENRES } from '../utils/mockData';
import { ClientMusicService } from './clientMusicService';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface HomeFeedSection {
  id: string;
  title: string;
  description?: string;
  type: 'tracks' | 'playlists' | 'artists' | 'genres';
  items: any[];
}

export interface HomeFeedData {
  sections: HomeFeedSection[];
}

export interface RelatedArtistData {
  id: string;
  name: string;
  avatarUrl?: string;
  subscribersCount?: number;
  topTracks: Track[];
  matchScore?: number;
}

export interface TrendingChartData {
  region: string;
  genre: string;
  tracks: Track[];
}

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('youtune_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Search tracks, playlists, artists via backend or mock fallback
  async search(query: string, type: string = 'all'): Promise<SearchResult> {
    try {
      const res = await fetch(`${BASE_URL}/tracks/search?q=${encodeURIComponent(query)}&type=${type}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json: ApiResponse<SearchResult> = await res.json();
        if (json.data) return json.data;
      }
    } catch (e) {
      // Fallback silently to mock search
    }

    const q = query.toLowerCase().trim();
    const tracks = MOCK_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
    const artists = MOCK_ARTISTS.filter((a) => a.name.toLowerCase().includes(q)).map((a) => ({
      id: a.id,
      name: a.name,
      avatarUrl: a.avatarUrl,
    }));
    const playlists = MOCK_PLAYLISTS.filter((p) => p.title.toLowerCase().includes(q)).map((p) => ({
      id: p.id,
      title: p.title,
      thumbnailUrl: p.coverUrl,
      trackCount: p.trackCount,
    }));

    return { tracks, artists, playlists };
  }

  // Get home trending tracks
  async getTrendingTracks(region: string = 'US', genre?: string): Promise<Track[]> {
    try {
      const url = genre
        ? `${BASE_URL}/explore/trending?region=${region}&genre=${encodeURIComponent(genre)}`
        : `${BASE_URL}/tracks/trending?region=${region}`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        if (data && Array.isArray(data.tracks)) {
          return data.tracks;
        }
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (e) {
      // Fallback
    }

    // Dynamic regional search query mapping when backend is unavailable
    const regionalQueries: Record<string, string> = {
      US: 'Billboard Hot 100 top music',
      GB: 'UK Top 40 official chart songs',
      GLOBAL: 'Global top 50 viral hits',
      JP: 'J-Pop Top hits trending music',
      KR: 'K-Pop Top hits trending songs',
      BR: 'Musicas mais tocadas Brasil top hits',
    };

    const targetQuery = genre
      ? `${genre} top hits music`
      : regionalQueries[region] || `${region} top trending music`;

    try {
      const clientRes = await ClientMusicService.search(targetQuery);
      if (clientRes.tracks && clientRes.tracks.length > 0) {
        return clientRes.tracks;
      }
    } catch {
      // Fallback to static mock
    }

    return MOCK_TRACKS;
  }

  // Get dynamic Home feed sections
  async getHomeFeed(region: string = 'US'): Promise<HomeFeedData> {
    try {
      const res = await fetch(`${BASE_URL}/explore/home?region=${region}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.sections) {
          return json.data;
        }
      }
    } catch (e) {
      // Fallback
    }

    // High quality fallback sections if backend is connecting
    return {
      sections: [
        {
          id: 'quick-picks',
          title: 'Quick Picks',
          description: 'Popular tracks handpicked for your day',
          type: 'tracks',
          items: MOCK_TRACKS.slice(0, 6),
        },
        {
          id: 'top-picks',
          title: 'Top Picks For You',
          description: 'Based on your recent listening habits',
          type: 'tracks',
          items: MOCK_TRACKS,
        },
        {
          id: 'trending-today',
          title: 'Trending Today',
          description: 'The most played tracks right now',
          type: 'tracks',
          items: [...MOCK_TRACKS].reverse(),
        },
        {
          id: 'mood-boosters',
          title: 'Explore Genres & Moods',
          description: 'Find music tailored for any activity',
          type: 'genres',
          items: MOCK_GENRES,
        },
      ],
    };
  }

  // Get genres / categories
  async getGenres(): Promise<GenreCategory[]> {
    try {
      const res = await fetch(`${BASE_URL}/explore/genres`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) return json.data;
      }
    } catch (e) {}
    return MOCK_GENRES;
  }

  // Get genre details with tracks
  async getGenreDetails(genreId: string): Promise<{ genre: GenreCategory; tracks: Track[] }> {
    try {
      const res = await fetch(`${BASE_URL}/explore/genres/${encodeURIComponent(genreId)}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.genre) return json.data;
      }
    } catch (e) {}

    const found = MOCK_GENRES.find((g) => g.id === genreId) || {
      id: genreId,
      title: genreId.charAt(0).toUpperCase() + genreId.slice(1),
      color: '#1E3264',
      searchQuery: `${genreId} top hits`,
    };

    // Client-side dynamic search for genre tracks if backend is absent
    try {
      const clientRes = await ClientMusicService.search(found.searchQuery || `${found.title} songs`);
      if (clientRes.tracks && clientRes.tracks.length > 0) {
        return {
          genre: found,
          tracks: clientRes.tracks,
        };
      }
    } catch {
      // Fallback
    }

    return {
      genre: found,
      tracks: MOCK_TRACKS,
    };
  }

  // Get related artists
  async getRelatedArtists(artistName: string): Promise<RelatedArtistData[]> {
    try {
      const res = await fetch(
        `${BASE_URL}/explore/related-artists?artist=${encodeURIComponent(artistName)}`,
        { headers: this.getHeaders() }
      );
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) return json.data;
      }
    } catch (e) {}

    return MOCK_ARTISTS.map((a) => ({
      id: a.id,
      name: a.name,
      avatarUrl: a.avatarUrl,
      subscribersCount: a.subscribersCount,
      topTracks: a.topTracks,
    }));
  }

  // Get playlist by id
  async getPlaylist(id: string): Promise<Playlist | null> {
    try {
      const res = await fetch(`${BASE_URL}/playlists/${id}`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (e) {}
    return MOCK_PLAYLISTS.find((p) => p.id === id) || null;
  }

  // Get artist by id
  async getArtist(id: string): Promise<Artist | null> {
    try {
      const res = await fetch(`${BASE_URL}/artists/${id}`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (e) {}
    return MOCK_ARTISTS.find((a) => a.id === id) || null;
  }
}

export const api = new ApiService();
