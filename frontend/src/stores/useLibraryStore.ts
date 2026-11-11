import { create } from 'zustand';
import { Track, Playlist, Artist } from '../types/music';
import { MOCK_PLAYLISTS, MOCK_TRACKS, MOCK_ARTISTS } from '../utils/mockData';

interface LibraryState {
  likedTracks: Track[];
  playlists: Playlist[];
  followedArtists: Artist[];
  history: { track: Track; playedAt: string }[];
  
  toggleLikeTrack: (track: Track) => void;
  isTrackLiked: (trackId: string) => boolean;
  createPlaylist: (title: string, description?: string) => Playlist;
  deletePlaylist: (id: string) => void;
  updatePlaylist: (id: string, partial: Partial<Playlist>) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTracks: (playlistId: string, trackIds: string[]) => void;
  toggleFollowArtist: (artist: Artist) => void;
  isArtistFollowed: (artistId: string) => boolean;
  addToHistory: (track: Track) => void;
  clearHistory: () => void;
}

const STORAGE_PLAYLISTS = 'youtune_playlists';
const STORAGE_LIKED = 'youtune_liked_tracks';
const STORAGE_HISTORY = 'youtune_history';

export const useLibraryStore = create<LibraryState>((set, get) => {
  // Load saved or fallback to mocks
  let savedPlaylists = MOCK_PLAYLISTS;
  let savedLiked = MOCK_TRACKS.filter((t) => t.isLiked);
  let savedHistory: { track: Track; playedAt: string }[] = [];

  try {
    const p = localStorage.getItem(STORAGE_PLAYLISTS);
    if (p) savedPlaylists = JSON.parse(p);
    const l = localStorage.getItem(STORAGE_LIKED);
    if (l) savedLiked = JSON.parse(l);
    const h = localStorage.getItem(STORAGE_HISTORY);
    if (h) savedHistory = JSON.parse(h);
  } catch (e) {
    console.error('Error loading library localStorage', e);
  }

  const persistPlaylists = (playlists: Playlist[]) => {
    localStorage.setItem(STORAGE_PLAYLISTS, JSON.stringify(playlists));
  };
  const persistLiked = (liked: Track[]) => {
    localStorage.setItem(STORAGE_LIKED, JSON.stringify(liked));
  };
  const persistHistory = (history: { track: Track; playedAt: string }[]) => {
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history));
  };

  return {
    likedTracks: savedLiked,
    playlists: savedPlaylists,
    followedArtists: MOCK_ARTISTS,
    history: savedHistory,

    toggleLikeTrack: (track) => {
      const { likedTracks } = get();
      const exists = likedTracks.some((t) => t.id === track.id || t.youtubeId === track.youtubeId);
      let updated: Track[];
      if (exists) {
        updated = likedTracks.filter((t) => t.id !== track.id && t.youtubeId !== track.youtubeId);
      } else {
        updated = [{ ...track, isLiked: true }, ...likedTracks];
      }
      persistLiked(updated);
      set({ likedTracks: updated });
    },

    isTrackLiked: (trackId) => {
      return get().likedTracks.some((t) => t.id === trackId || t.youtubeId === trackId);
    },

    createPlaylist: (title, description) => {
      const newPlaylist: Playlist = {
        id: `pl-${Date.now()}`,
        userId: 'user-demo',
        title,
        description: description || '',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
        isPublic: true,
        trackCount: 0,
        totalDurationSec: 0,
        tracks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newPlaylist, ...get().playlists];
      persistPlaylists(updated);
      set({ playlists: updated });
      return newPlaylist;
    },

    deletePlaylist: (id) => {
      const updated = get().playlists.filter((p) => p.id !== id);
      persistPlaylists(updated);
      set({ playlists: updated });
    },

    updatePlaylist: (id, partial) => {
      const updated = get().playlists.map((p) =>
        p.id === id ? { ...p, ...partial, updatedAt: new Date().toISOString() } : p
      );
      persistPlaylists(updated);
      set({ playlists: updated });
    },

    addTrackToPlaylist: (playlistId, track) => {
      const updated = get().playlists.map((p) => {
        if (p.id !== playlistId) return p;
        const currentTracks = p.tracks || [];
        if (currentTracks.some((t) => t.id === track.id || t.youtubeId === track.youtubeId)) {
          return p; // Already in playlist
        }
        const newTracks = [...currentTracks, track];
        return {
          ...p,
          tracks: newTracks,
          trackCount: newTracks.length,
          totalDurationSec: (p.totalDurationSec || 0) + (track.durationSec || 0),
          updatedAt: new Date().toISOString(),
        };
      });
      persistPlaylists(updated);
      set({ playlists: updated });
    },

    removeTrackFromPlaylist: (playlistId, trackId) => {
      const updated = get().playlists.map((p) => {
        if (p.id !== playlistId) return p;
        const currentTracks = p.tracks || [];
        const trackToRemove = currentTracks.find((t) => t.id === trackId);
        const newTracks = currentTracks.filter((t) => t.id !== trackId);
        return {
          ...p,
          tracks: newTracks,
          trackCount: newTracks.length,
          totalDurationSec: Math.max(0, (p.totalDurationSec || 0) - (trackToRemove?.durationSec || 0)),
          updatedAt: new Date().toISOString(),
        };
      });
      persistPlaylists(updated);
      set({ playlists: updated });
    },

    reorderPlaylistTracks: (playlistId, trackIds) => {
      const updated = get().playlists.map((p) => {
        if (p.id !== playlistId || !p.tracks) return p;
        const trackMap = new Map(p.tracks.map((t) => [t.id, t]));
        const reordered = trackIds
          .map((id) => trackMap.get(id))
          .filter((t): t is Track => Boolean(t));
        return {
          ...p,
          tracks: reordered,
          updatedAt: new Date().toISOString(),
        };
      });
      persistPlaylists(updated);
      set({ playlists: updated });
    },

    toggleFollowArtist: (artist) => {
      const { followedArtists } = get();
      const exists = followedArtists.some((a) => a.id === artist.id);
      let updated: Artist[];
      if (exists) {
        updated = followedArtists.filter((a) => a.id !== artist.id);
      } else {
        updated = [artist, ...followedArtists];
      }
      set({ followedArtists: updated });
    },

    isArtistFollowed: (artistId) => {
      return get().followedArtists.some((a) => a.id === artistId);
    },

    addToHistory: (track) => {
      const { history } = get();
      const filtered = history.filter((h) => h.track.id !== track.id && h.track.youtubeId !== track.youtubeId);
      const updated = [{ track, playedAt: new Date().toISOString() }, ...filtered].slice(0, 50);
      persistHistory(updated);
      set({ history: updated });
    },

    clearHistory: () => {
      persistHistory([]);
      set({ history: [] });
    },
  };
});
