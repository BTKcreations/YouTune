export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export class LyricsService {
  private static cache: Map<string, LyricLine[]> = new Map();

  /**
   * Parse synced LRC format: "[00:12.34] lyric line text" into timestamped array
   */
  static parseLRC(lrcText: string): LyricLine[] {
    const lines = lrcText.split('\n');
    const result: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const millis = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
        const timeInSec = minutes * 60 + seconds + millis / 1000;
        const text = line.replace(timeRegex, '').trim();
        if (text) {
          result.push({ time: timeInSec, text });
        }
      }
    }

    return result.sort((a, b) => a.time - b.time);
  }

  /**
   * Clean and normalize track titles for lyrics search
   */
  static cleanTitle(title: string): string {
    return title
      .split('|')[0]
      .split('-')[0]
      // Remove bracketed info e.g. [Official Video], (Audio), (Full Song 8K), [HD]
      .replace(/[\(\[\{][^\)\]\}]*[\)\]\}]/g, ' ')
      // Strip common video/release tags
      .replace(/\b(official|music|video|audio|lyric|lyrics|full|song|remastered|version|original|soundtrack|ost|hd|4k|8k)\b/gi, ' ')
      // Strip featuring tags
      .replace(/\b(feat|ft)\.?\s+.*$/i, '')
      // Replace multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Clean artist name
   */
  static cleanArtist(artist: string): string {
    return artist
      .replace(/VEVO|- Topic|Music|Records|Entertainment|Official|Channel/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Fetch synced lyrics from LRCLIB free API with intelligent sanitization & fallback
   */
  static async getLyrics(title: string, artist: string, durationSec?: number): Promise<LyricLine[]> {
    const cleanTitle = this.cleanTitle(title);
    const cleanArtist = this.cleanArtist(artist);
    const cacheKey = `${cleanTitle.toLowerCase()}::${cleanArtist.toLowerCase()}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // 1. Direct get with title + artist (+ optional duration)
      const queryParams = new URLSearchParams({
        track_name: cleanTitle,
        artist_name: cleanArtist,
      });
      if (durationSec && durationSec > 0) {
        queryParams.set('duration', Math.round(durationSec).toString());
      }

      const res = await fetch(`https://lrclib.net/api/get?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const parsed = this.extractLyrics(data);
        if (parsed.length > 0) {
          this.cache.set(cacheKey, parsed);
          return parsed;
        }
      }

      // 2. Fallback search by cleaned track name and artist keyword
      const searchQuery = cleanArtist ? `${cleanTitle} ${cleanArtist}` : cleanTitle;
      const searchRes = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          const match = results.find((r: any) => r.syncedLyrics) || results[0];
          const parsed = this.extractLyrics(match);
          if (parsed.length > 0) {
            this.cache.set(cacheKey, parsed);
            return parsed;
          }
        }
      }

      // 3. Last fallback: fuzzy title-only search
      if (cleanTitle) {
        const titleOnlyRes = await fetch(
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}`
        );
        if (titleOnlyRes.ok) {
          const results = await titleOnlyRes.json();
          if (Array.isArray(results) && results.length > 0) {
            const match = results.find((r: any) => r.syncedLyrics) || results[0];
            const parsed = this.extractLyrics(match);
            if (parsed.length > 0) {
              this.cache.set(cacheKey, parsed);
              return parsed;
            }
          }
        }
      }
    } catch {
      // Silent catch: network unavailable or lyrics service offline
    }

    return [];
  }

  private static extractLyrics(data: any): LyricLine[] {
    if (!data) return [];
    if (data.syncedLyrics) {
      return this.parseLRC(data.syncedLyrics);
    } else if (data.plainLyrics) {
      return data.plainLyrics
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean)
        .map((text: string, idx: number) => ({ time: idx * 5, text }));
    }
    return [];
  }
}
