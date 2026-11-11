import { Track, GenreCategory } from '../types/music';
import { SearchResult } from '../types/api';

// Curated reliable public fallback instances
const INVIDIOUS_INSTANCES = [
  'https://yt.chocolatemoo53.com',
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://vid.priv.au',
  'https://invidious.jing.rocks'
];

let activeInstance = INVIDIOUS_INSTANCES[0];

export async function findHealthyInstance(): Promise<string> {
  for (const inst of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${inst}/api/v1/search?q=music&type=video`, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        activeInstance = inst;
        return inst;
      }
    } catch {
      continue;
    }
  }
  return activeInstance;
}

export class ClientMusicService {
  /**
   * Search YouTube for songs, artists, and playlists directly in browser.
   */
  static async search(query: string, type: string = 'all'): Promise<SearchResult> {
    try {
      const url = `${activeInstance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const res = await fetch(url);
      if (!res.ok) {
        await findHealthyInstance();
        const retryRes = await fetch(`${activeInstance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
        if (!retryRes.ok) throw new Error('Search failed');
        return this.parseSearchResponse(await retryRes.json());
      }
      return this.parseSearchResponse(await res.json());
    } catch (e) {
      console.warn('Invidious search fallback failed, trying next instance', e);
      await findHealthyInstance();
      const res = await fetch(`${activeInstance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
      return this.parseSearchResponse(await res.json());
    }
  }

  /**
   * Extract high-quality direct audio stream URL for pure HTML5 <audio> background playback.
   */
  static async getAudioStreamUrl(videoId: string): Promise<string> {
    const instances = [activeInstance, ...INVIDIOUS_INSTANCES.filter(i => i !== activeInstance)];
    for (const inst of instances) {
      try {
        const res = await fetch(`${inst}/api/v1/videos/${videoId}`);
        if (!res.ok) continue;
        const data = await res.json();
        const formats = data.adaptiveFormats || [];
        
        // Find audio stream (m4a / mp4a / opus)
        const audioStreams = formats.filter((f: any) => f.type && f.type.startsWith('audio/'));
        if (audioStreams.length > 0) {
          // Sort by bitrate descending for highest audio quality
          audioStreams.sort((a: any, b: any) => (parseInt(b.bitrate, 10) || 0) - (parseInt(a.bitrate, 10) || 0));
          return audioStreams[0].url;
        }
      } catch {
        continue;
      }
    }
    // Fallback: direct invidious audio listen proxy
    return `${activeInstance}/latest_version?id=${videoId}&itag=140`;
  }

  private static parseSearchResponse(items: any[]): SearchResult {
    const tracks: Track[] = [];
    const artists: any[] = [];
    const seenArtists = new Set<string>();

    for (const item of items) {
      if (item.type !== 'video' && item.videoId === undefined) continue;
      const vid = item.videoId;
      const title = item.title;
      const artist = item.author || 'Unknown Artist';
      const durationSec = item.lengthSeconds || 0;
      const thumb = item.videoThumbnails?.find((t: any) => t.quality === 'high')?.url ||
        `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;

      tracks.push({
        id: `yt_${vid}`,
        youtubeId: vid,
        title,
        artist,
        artists: [{ id: item.authorId || artist, name: artist }],
        album: { id: `alb_${vid}`, title: 'Single' },
        durationSec,
        thumbnailUrl: thumb,
        channelId: item.authorId,
        channelTitle: artist,
        views: item.viewCount,
        publishedAt: item.publishedText,
        isLiked: false,
      });

      if (artist && !seenArtists.has(artist)) {
        seenArtists.add(artist);
        artists.push({
          id: item.authorId || artist.toLowerCase().replace(/\\s+/g, '_'),
          name: artist,
          avatarUrl: thumb,
          channelId: item.authorId,
        });
      }
    }

    return {
      tracks,
      artists: artists.slice(0, 5),
      playlists: [],
      nextPageToken: undefined,
    };
  }
}
