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
   * Fetch synced lyrics from LRCLIB free API
   */
  static async getLyrics(title: string, artist: string, durationSec?: number): Promise<LyricLine[]> {
    // Remove YouTube specific titles like "Song | Movie | Singers | Official Video"
    let cleanTitle = title
      .split('|')[0]
      .split('-')[0]
      .replace(/[\(\[\{].*?[\)\]\}]/g, '')
      .replace(/official.*|video.*|lyric.*|audio.*|song.*/gi, '')
      .replace(/feat\..*|ft\..*/i, '')
      .trim();

    let cleanArtist = artist
      .replace(/VEVO|- Topic|Music|Records|Entertainment/gi, '')
      .trim();
    const cacheKey = `${cleanTitle.toLowerCase()}::${cleanArtist.toLowerCase()}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const queryParams = new URLSearchParams({
        track_name: cleanTitle,
        artist_name: cleanArtist,
      });
      if (durationSec) {
        queryParams.set('duration', Math.round(durationSec).toString());
      }

      const res = await fetch(`https://lrclib.net/api/get?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics) {
          const parsed = this.parseLRC(data.syncedLyrics);
          this.cache.set(cacheKey, parsed);
          return parsed;
        } else if (data.plainLyrics) {
          // Fallback plain lines
          const plain = data.plainLyrics
            .split('\n')
            .filter((l: string) => l.trim())
            .map((text: string, idx: number) => ({ time: idx * 5, text }));
          this.cache.set(cacheKey, plain);
          return plain;
        }
      }

      // Try search endpoint if direct get 404s
      const searchRes = await fetch(
        `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}`
      );
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (results && results.length > 0) {
          const match = results.find((r: any) => r.syncedLyrics) || results[0];
          if (match && match.syncedLyrics) {
            const parsed = this.parseLRC(match.syncedLyrics);
            this.cache.set(cacheKey, parsed);
            return parsed;
          } else if (match && match.plainLyrics) {
            const plain = match.plainLyrics
              .split('\n')
              .filter((l: string) => l.trim())
              .map((text: string, idx: number) => ({ time: idx * 5, text }));
            this.cache.set(cacheKey, plain);
            return plain;
          }
        }
      }
    } catch (e) {
      console.warn('Lyrics fetch failed', e);
    }

    return [];
  }
}
