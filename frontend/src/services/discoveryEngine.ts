import { Track } from '../types/music';

const STORAGE_KEYS = {
  HISTORY: 'youtune_history_v2',
  STATS: 'youtune_listening_stats',
  DISCOVERY_CACHE: 'youtune_discovery_feed',
};

export interface DailyPlayEvent {
  track: Track;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
}

export interface UserMusicStats {
  topArtists: Record<string, number>; // artist -> play count
  topGenres: Record<string, number>;
  totalPlays: number;
  lastActiveDate: string;
}

export class PersonalDiscoveryEngine {
  /**
   * Log track play and update user taste profile.
   */
  static logPlay(track: Track): void {
    try {
      const historyStr = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const history: DailyPlayEvent[] = historyStr ? JSON.parse(historyStr) : [];
      const today = new Date().toISOString().split('T')[0];

      history.unshift({
        track,
        timestamp: Date.now(),
        dateStr: today,
      });

      // Keep last 300 play events
      if (history.length > 300) history.pop();
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

      // Update aggregate stats
      const statsStr = localStorage.getItem(STORAGE_KEYS.STATS);
      const stats: UserMusicStats = statsStr
        ? JSON.parse(statsStr)
        : { topArtists: {}, topGenres: {}, totalPlays: 0, lastActiveDate: today };

      stats.topArtists[track.artist] = (stats.topArtists[track.artist] || 0) + 1;
      stats.totalPlays += 1;
      stats.lastActiveDate = today;

      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed logging music event', e);
    }
  }

  /**
   * Get recently played tracks.
   */
  static getRecentlyPlayed(): Track[] {
    try {
      const historyStr = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!historyStr) return [];
      const history: DailyPlayEvent[] = JSON.parse(historyStr);
      // Unique tracks in order
      const seen = new Set<string>();
      const tracks: Track[] = [];
      for (const item of history) {
        if (!seen.has(item.track.id)) {
          seen.add(item.track.id);
          tracks.push(item.track);
        }
      }
      return tracks.slice(0, 20);
    } catch {
      return [];
    }
  }

  /**
   * Get top artists based on user's daily listening habits.
   */
  static getTopArtists(): string[] {
    try {
      const statsStr = localStorage.getItem(STORAGE_KEYS.STATS);
      if (!statsStr) return [];
      const stats: UserMusicStats = JSON.parse(statsStr);
      return Object.entries(stats.topArtists)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([artist]) => artist);
    } catch {
      return [];
    }
  }

  /**
   * Generate daily dynamic adaptive mix titles based on listening history.
   */
  static getAdaptiveSections(): { title: string; subtitle: string; artists: string[] }[] {
    const top = this.getTopArtists();
    if (top.length === 0) {
      return [
        { title: 'Trending Today', subtitle: 'Global top hits and viral tracks', artists: ['Anirudh Ravichander', 'A.R. Rahman', 'Sid Sriram', 'The Weeknd'] },
        { title: 'Quick Picks', subtitle: 'Get started with recommended artists', artists: ['Ed Sheeran', 'Dua Lipa', 'Karan Aujla'] },
      ];
    }

    const sections = [];
    sections.push({
      title: 'Made For You • Daily Mix',
      subtitle: `Based on your love for ${top.slice(0, 3).join(', ')}`,
      artists: top.slice(0, 4),
    });

    if (top.length >= 2) {
      sections.push({
        title: `More like ${top[0]}`,
        subtitle: 'Similar artists and radio mix',
        artists: [top[0]],
      });
    }

    sections.push({
      title: 'Heavy Rotation',
      subtitle: 'Tracks you keep coming back to',
      artists: top.slice(0, 5),
    });

    return sections;
  }
}
