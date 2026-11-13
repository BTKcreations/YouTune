import { Track } from '../types/music';
import { ClientMusicService } from './clientMusicService';

const CACHE_NAME = 'youtune-offline-audio-v1';
const METADATA_KEY = 'youtune_offline_tracks_meta';
const BUFFER_KEY = 'youtune_predictive_buffer_meta';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const MAX_PREDICTIVE_BUFFER_COUNT = 5;

export interface OfflineTrackMetadata {
  track: Track;
  downloadedAt: number;
  sizeBytes?: number;
  isPredictiveBuffer?: boolean;
  expiresAt?: number; // 24hr expiration timestamp for auto-buffered tracks
}

export class OfflineStorageService {
  /**
   * Save track into local storage as permanent offline track
   */
  static async downloadTrack(track: Track): Promise<boolean> {
    try {
      const tracks = this.getDownloadedTracks();
      const existingIdx = tracks.findIndex(
        (t) => t.track.id === track.id || t.track.youtubeId === track.youtubeId
      );

      // Save as explicit, non-expiring download
      const entry: OfflineTrackMetadata = {
        track,
        downloadedAt: Date.now(),
        isPredictiveBuffer: false,
      };

      if (existingIdx >= 0) {
        tracks[existingIdx] = entry;
      } else {
        tracks.unshift(entry);
      }
      localStorage.setItem(METADATA_KEY, JSON.stringify(tracks));

      // Cache audio stream binary
      await this.cacheAudioBinary(track.youtubeId);

      return true;
    } catch (e) {
      console.error('Failed to save track for offline', e);
      return false;
    }
  }

  /**
   * Smart Predictive Buffer: Cache the next 3-5 songs in the background with 24-hour expiration
   */
  static async predictiveBufferQueue(nextTracks: Track[]): Promise<void> {
    if (!nextTracks || nextTracks.length === 0) return;

    // Prune any expired cache first (lazy garbage collection)
    this.cleanExpiredCache();

    try {
      const bufferList = this.getBufferTracks();
      const targets = nextTracks.slice(0, MAX_PREDICTIVE_BUFFER_COUNT);

      for (const track of targets) {
        // Skip if already permanently downloaded or already buffered
        if (this.isTrackDownloaded(track.youtubeId)) continue;
        if (bufferList.some((b) => b.track.youtubeId === track.youtubeId)) continue;

        // Add to predictive buffer with 24hr expiry
        const entry: OfflineTrackMetadata = {
          track,
          downloadedAt: Date.now(),
          isPredictiveBuffer: true,
          expiresAt: Date.now() + TWENTY_FOUR_HOURS_MS,
        };

        bufferList.unshift(entry);

        // Enforce FIFO cap (max 5 tracks)
        if (bufferList.length > MAX_PREDICTIVE_BUFFER_COUNT) {
          const removed = bufferList.pop();
          if (removed) {
            this.deleteFromCacheApi(removed.track.youtubeId);
          }
        }

        // Cache audio binary in background
        await this.cacheAudioBinary(track.youtubeId);
      }

      localStorage.setItem(BUFFER_KEY, JSON.stringify(bufferList));
    } catch (e) {
      // Non-critical background task
    }
  }

  /**
   * Lazy Garbage Collection: Prune predictive tracks older than 24 hours
   */
  static cleanExpiredCache(): void {
    try {
      const bufferList = this.getBufferTracks();
      const now = Date.now();
      const valid = bufferList.filter((item) => {
        const isExpired = item.expiresAt ? now > item.expiresAt : false;
        if (isExpired) {
          this.deleteFromCacheApi(item.track.youtubeId);
        }
        return !isExpired;
      });

      localStorage.setItem(BUFFER_KEY, JSON.stringify(valid));
    } catch {
      // Non-critical
    }
  }

  /**
   * Internal helper to cache audio stream in Cache API
   */
  private static async cacheAudioBinary(youtubeId: string): Promise<void> {
    if (!('caches' in window)) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      const audioUrl = await ClientMusicService.getAudioStreamUrl(youtubeId);
      if (audioUrl) {
        const resp = await fetch(audioUrl, { mode: 'cors' }).catch(() => null);
        if (resp && resp.ok) {
          await cache.put(`/offline/audio/${youtubeId}`, resp);
        }
      }
    } catch {
      // Non-critical
    }
  }

  /**
   * Internal helper to delete cached audio blob from Cache API
   */
  private static async deleteFromCacheApi(youtubeId: string): Promise<void> {
    if (!('caches' in window)) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(`/offline/audio/${youtubeId}`);
    } catch {}
  }

  /**
   * Retrieve permanent downloaded songs
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
   * Retrieve active predictive buffer tracks
   */
  static getBufferTracks(): OfflineTrackMetadata[] {
    try {
      const data = localStorage.getItem(BUFFER_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Check if a track is available offline (either permanent or predictive buffer)
   */
  static isTrackDownloaded(youtubeId: string): boolean {
    const perm = this.getDownloadedTracks();
    if (perm.some((item) => item.track.youtubeId === youtubeId)) return true;
    const buff = this.getBufferTracks();
    return buff.some((item) => item.track.youtubeId === youtubeId);
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
      await this.deleteFromCacheApi(youtubeId);
      const list = this.getDownloadedTracks().filter((t) => t.track.youtubeId !== youtubeId);
      localStorage.setItem(METADATA_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Error deleting cached track', e);
    }
  }
}
