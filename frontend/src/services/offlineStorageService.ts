import { Track } from '../types/music';

const CACHE_NAME = 'youtune-offline-audio-v1';
const METADATA_KEY = 'youtune_offline_tracks_meta';

export interface OfflineTrackMetadata {
  track: Track;
  downloadedAt: number;
  sizeBytes?: number;
}

export class OfflineStorageService {
  /**
   * Save track audio blob and cover art into browser Cache API for offline listening
   */
  static async downloadTrack(track: Track): Promise<boolean> {
    try {
      if (!('caches' in window)) return false;

      const cache = await caches.open(CACHE_NAME);
      const imgUrl = `/offline/img/${track.youtubeId}`;

      // Fetch and store thumbnail
      try {
        const imgResp = await fetch(track.thumbnailUrl);
        if (imgResp.ok) await cache.put(imgUrl, imgResp);
      } catch {
        // Thumbnail cache optional
      }

      // Save metadata to offline library
      const tracks = this.getDownloadedTracks();
      if (!tracks.some((t) => t.track.id === track.id)) {
        tracks.unshift({ track, downloadedAt: Date.now() });
        localStorage.setItem(METADATA_KEY, JSON.stringify(tracks));
      }

      return true;
    } catch (e) {
      console.error('Failed to download track for offline', e);
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
