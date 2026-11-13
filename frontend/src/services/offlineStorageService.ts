import { Track } from '../types/music';
import { ClientMusicService } from './clientMusicService';

const CACHE_NAME = 'youtune-offline-audio-v1';
const METADATA_KEY = 'youtune_offline_tracks_meta';

export interface OfflineTrackMetadata {
  track: Track;
  downloadedAt: number;
  sizeBytes?: number;
}

export class OfflineStorageService {
  /**
   * Save track into local storage and cache audio blob for true offline listening
   */
  static async downloadTrack(track: Track): Promise<boolean> {
    try {
      // 1. Immediately cache metadata in localStorage so it appears in the Offline Library
      const tracks = this.getDownloadedTracks();
      const existingIdx = tracks.findIndex(
        (t) => t.track.id === track.id || t.track.youtubeId === track.youtubeId
      );

      if (existingIdx >= 0) {
        tracks[existingIdx] = { track, downloadedAt: Date.now() };
      } else {
        tracks.unshift({ track, downloadedAt: Date.now() });
      }
      localStorage.setItem(METADATA_KEY, JSON.stringify(tracks));

      // 2. Cache actual audio stream binary into Cache API if supported
      if ('caches' in window) {
        try {
          const cache = await caches.open(CACHE_NAME);
          const audioUrl = await ClientMusicService.getAudioStreamUrl(track.youtubeId);
          if (audioUrl) {
            // Fetch audio stream as blob or through standard cache entry
            const audioResp = await fetch(audioUrl, { mode: 'cors' }).catch(() => null);
            if (audioResp && audioResp.ok) {
              await cache.put(`/offline/audio/${track.youtubeId}`, audioResp);
            }
          }
        } catch {
          // Audio binary caching best-effort (CORS dependent)
        }
      }

      return true;
    } catch (e) {
      console.error('Failed to save track for offline', e);
      return false;
    }
  }

  /**
   * Retrieve all locally downloaded offline songs
   */
  static getDownloadedTracks(): OfflineTrackMetadata[] {
    try {
      const data = localStorage.getItem(METADATA_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Check if a track is cached offline
   */
  static isTrackDownloaded(youtubeId: string): boolean {
    const list = this.getDownloadedTracks();
    return list.some((item) => item.track.youtubeId === youtubeId);
  }

  /**
   * Get cached offline audio URL
   */
  static async getOfflineAudioUrl(youtubeId: string): Promise<string | null> {
    try {
      if (!('caches' in window)) return null;
      const cache = await caches.open(CACHE_NAME);
      const match = await cache.match(`/offline/audio/${youtubeId}`);
      if (match) {
        const blob = await match.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn('Error reading offline cache', e);
    }
    return null;
  }

  /**
   * Delete track from offline cache
   */
  static async removeDownloadedTrack(youtubeId: string): Promise<void> {
    try {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        await cache.delete(`/offline/audio/${youtubeId}`);
        await cache.delete(`/offline/img/${youtubeId}`);
      }
      const list = this.getDownloadedTracks().filter((t) => t.track.youtubeId !== youtubeId);
      localStorage.setItem(METADATA_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Error deleting cached track', e);
    }
  }
}
