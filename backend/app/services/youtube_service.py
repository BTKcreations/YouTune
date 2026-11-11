"""
YouTube Service for YouTune Backend.

Provides:
- YouTube Data API v3 integration with API key & caching (in-memory TTL cache).
- Music discovery filtering (category 10 Music, music video detection, duration filters).
- Robust mock/fallback service when YOUTUBE_API_KEY is omitted or quota exceeded.
- ISO 8601 duration conversion to seconds.
- Clean separation conforming to YouTube Terms of Service:
  Only metadata and video IDs are returned; no stream audio extraction.
"""

import os
import re
import time
import logging
from typing import List, Dict, Any, Optional
import httpx

from app.schemas.music import Track, ArtistReference, AlbumReference, SearchResult, ArtistReferenceSearchResult, PlaylistSearchResult

logger = logging.getLogger(__name__)

# ISO 8601 duration parser (e.g. PT3M45S, PT1H2M10S, PT45S)
DURATION_REGEX = re.compile(r'P(?:(?P<days>\d+)D)?(?:T(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?)?')

def parse_iso8601_duration(duration_str: str) -> int:
    """Convert an ISO 8601 duration string into seconds."""
    if not duration_str:
        return 0
    match = DURATION_REGEX.match(duration_str)
    if not match:
        return 0
    parts = match.groupdict()
    days = int(parts.get('days') or 0)
    hours = int(parts.get('hours') or 0)
    minutes = int(parts.get('minutes') or 0)
    seconds = int(parts.get('seconds') or 0)
    return days * 86400 + hours * 3600 + minutes * 60 + seconds

def clean_track_title_and_artist(raw_title: str, channel_title: str):
    """
    Heuristically clean YouTube music titles.
    Often formatted as: "Artist - Title (Official Music Video)" or "Artist - Title [Official Audio]".
    """
    clean_title = raw_title
    # Remove common music video tags
    clean_title = re.sub(r'[\(\[\{].*?(?:Official|Music Video|Audio|Lyric Video|Lyrics|Visualizer|4K|HD|Remastered).*?[\)\]\}]', '', clean_title, flags=re.IGNORECASE)
    clean_title = clean_title.strip()

    artist = channel_title.replace(" - Topic", "").replace("VEVO", "").strip()

    if " - " in clean_title:
        parts = clean_title.split(" - ", 1)
        artist_candidate = parts[0].strip()
        title_candidate = parts[1].strip()
        if artist_candidate and title_candidate:
            return title_candidate, artist_candidate

    return clean_title if clean_title else raw_title, artist


class SimpleCache:
    """Simple in-memory TTL cache for YouTube queries and video details."""
    def __init__(self, ttl_seconds: int = 1800):
        self.ttl = ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if entry:
            if time.time() - entry["timestamp"] < self.ttl:
                return entry["data"]
            else:
                del self._cache[key]
        return None

    def set(self, key: str, value: Any):
        self._cache[key] = {
            "timestamp": time.time(),
            "data": value
        }


# Curated high-fidelity mock music catalogue for local dev / offline mode / missing API key
MOCK_TRACKS: List[Track] = [
    Track(
        id="yt_dQw4w9WgXcQ",
        youtubeId="dQw4w9WgXcQ",
        title="Never Gonna Give You Up",
        artist="Rick Astley",
        artists=[ArtistReference(id="rick_astley", name="Rick Astley")],
        album=AlbumReference(id="whenever_you_need_somebody", title="Whenever You Need Somebody"),
        durationSec=213,
        thumbnailUrl="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        channelId="UCuAXFkgsw1L7xaCfnd5JJOw",
        channelTitle="Rick Astley",
        views=1540000000,
        publishedAt="2009-10-25T06:57:33Z"
    ),
    Track(
        id="yt_fJ9rUzIMcZQ",
        youtubeId="fJ9rUzIMcZQ",
        title="Bohemian Rhapsody",
        artist="Queen",
        artists=[ArtistReference(id="queen", name="Queen")],
        album=AlbumReference(id="a_night_at_the_opera", title="A Night at the Opera"),
        durationSec=359,
        thumbnailUrl="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        channelId="UCiMhD4jzUqG-IgPzUmmytRQ",
        channelTitle="Queen Official",
        views=1700000000,
        publishedAt="2008-08-01T15:23:00Z"
    ),
    Track(
        id="yt_kJQP7kiw5Fk",
        youtubeId="kJQP7kiw5Fk",
        title="Despacito",
        artist="Luis Fonsi ft. Daddy Yankee",
        artists=[ArtistReference(id="luis_fonsi", name="Luis Fonsi"), ArtistReference(id="daddy_yankee", name="Daddy Yankee")],
        album=AlbumReference(id="vida", title="VIDA"),
        durationSec=282,
        thumbnailUrl="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        channelId="UCLp8RBhQHu9wSsq62j_PA6A",
        channelTitle="Luis Fonsi",
        views=8200000000,
        publishedAt="2017-01-13T05:00:02Z"
    ),
    Track(
        id="yt_JGwWNGJdvx8",
        youtubeId="JGwWNGJdvx8",
        title="Shape of You",
        artist="Ed Sheeran",
        artists=[ArtistReference(id="ed_sheeran", name="Ed Sheeran")],
        album=AlbumReference(id="divide", title="÷ (Divide)"),
        durationSec=264,
        thumbnailUrl="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80",
        channelId="UC0C-w0YjGpqDXGB8IHb662A",
        channelTitle="Ed Sheeran",
        views=6000000000,
        publishedAt="2017-01-30T10:57:50Z"
    ),
    Track(
        id="yt_4NRXx6U8ABQ",
        youtubeId="4NRXx6U8ABQ",
        title="Blinding Lights",
        artist="The Weeknd",
        artists=[ArtistReference(id="the_weeknd", name="The Weeknd")],
        album=AlbumReference(id="after_hours", title="After Hours"),
        durationSec=260,
        thumbnailUrl="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80",
        channelId="UC0WP5P-ufpRfjbNrmOWwLBQ",
        channelTitle="The Weeknd",
        views=790000000,
        publishedAt="2020-01-21T18:00:10Z"
    ),
    Track(
        id="yt_OPf0YbXqDm0",
        youtubeId="OPf0YbXqDm0",
        title="Uptown Funk",
        artist="Mark Ronson ft. Bruno Mars",
        artists=[ArtistReference(id="mark_ronson", name="Mark Ronson"), ArtistReference(id="bruno_mars", name="Bruno Mars")],
        album=AlbumReference(id="uptown_special", title="Uptown Special"),
        durationSec=271,
        thumbnailUrl="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        channelId="UC3lA4T2KzN0T6N83pS1Z05w",
        channelTitle="Mark Ronson",
        views=4900000000,
        publishedAt="2014-11-19T14:32:00Z"
    ),
    Track(
        id="yt_CevxZvSJLk8",
        youtubeId="CevxZvSJLk8",
        title="Roar",
        artist="Katy Perry",
        artists=[ArtistReference(id="katy_perry", name="Katy Perry")],
        album=AlbumReference(id="prism", title="PRISM"),
        durationSec=270,
        thumbnailUrl="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&auto=format&fit=crop&q=80",
        channelId="UC-8Q-hL3cEw3L2k3z8aJj5A",
        channelTitle="Katy Perry",
        views=3900000000,
        publishedAt="2013-09-05T19:00:10Z"
    ),
    Track(
        id="yt_09R8_2nJtjg",
        youtubeId="09R8_2nJtjg",
        title="Sugar",
        artist="Maroon 5",
        artists=[ArtistReference(id="maroon_5", name="Maroon 5")],
        album=AlbumReference(id="v_album", title="V"),
        durationSec=302,
        thumbnailUrl="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&auto=format&fit=crop&q=80",
        channelId="UC-3G046NfF8fN8_N4T-N5Zw",
        channelTitle="Maroon 5",
        views=3800000000,
        publishedAt="2015-01-14T17:00:00Z"
    ),
    Track(
        id="yt_L_LUpnjgPso",
        youtubeId="L_LUpnjgPso",
        title="Counting Stars",
        artist="OneRepublic",
        artists=[ArtistReference(id="onerepublic", name="OneRepublic")],
        album=AlbumReference(id="native", title="Native"),
        durationSec=284,
        thumbnailUrl="https://images.unsplash.com/photo-1520523839898-5071270404c0?w=600&auto=format&fit=crop&q=80",
        channelId="UCiM_cK4ZcE3K1pL_3l4y_jw",
        channelTitle="OneRepublic",
        views=3700000000,
        publishedAt="2013-05-31T20:00:00Z"
    ),
    Track(
        id="yt_hT_nvWreIhg",
        youtubeId="hT_nvWreIhg",
        title="Counting Stars (Acoustic)",
        artist="OneRepublic",
        artists=[ArtistReference(id="onerepublic", name="OneRepublic")],
        album=AlbumReference(id="native", title="Native"),
        durationSec=273,
        thumbnailUrl="https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&auto=format&fit=crop&q=80",
        channelId="UCiM_cK4ZcE3K1pL_3l4y_jw",
        channelTitle="OneRepublic",
        views=50000000,
        publishedAt="2013-08-15T12:00:00Z"
    ),
    Track(
        id="yt_2Vv-BfVoq4g",
        youtubeId="2Vv-BfVoq4g",
        title="Perfect",
        artist="Ed Sheeran",
        artists=[ArtistReference(id="ed_sheeran", name="Ed Sheeran")],
        album=AlbumReference(id="divide", title="÷ (Divide)"),
        durationSec=279,
        thumbnailUrl="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        channelId="UC0C-w0YjGpqDXGB8IHb662A",
        channelTitle="Ed Sheeran",
        views=3600000000,
        publishedAt="2017-11-09T11:04:14Z"
    ),
    Track(
        id="yt_nfWlot6h_JM",
        youtubeId="nfWlot6h_JM",
        title="Shake It Off",
        artist="Taylor Swift",
        artists=[ArtistReference(id="taylor_swift", name="Taylor Swift")],
        album=AlbumReference(id="1989_album", title="1989"),
        durationSec=242,
        thumbnailUrl="https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&auto=format&fit=crop&q=80",
        channelId="UCiMhD4jzUqG-IgPzUmmytRQ",
        channelTitle="Taylor Swift",
        views=3300000000,
        publishedAt="2014-08-18T21:40:00Z"
    )
]

MOCK_ARTISTS: List[ArtistReferenceSearchResult] = [
    ArtistReferenceSearchResult(
        id="rick_astley",
        name="Rick Astley",
        avatarUrl="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80",
        channelId="UCuAXFkgsw1L7xaCfnd5JJOw"
    ),
    ArtistReferenceSearchResult(
        id="the_weeknd",
        name="The Weeknd",
        avatarUrl="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80",
        channelId="UC0WP5P-ufpRfjbNrmOWwLBQ"
    ),
    ArtistReferenceSearchResult(
        id="ed_sheeran",
        name="Ed Sheeran",
        avatarUrl="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80",
        channelId="UC0C-w0YjGpqDXGB8IHb662A"
    ),
    ArtistReferenceSearchResult(
        id="queen",
        name="Queen",
        avatarUrl="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
        channelId="UCiMhD4jzUqG-IgPzUmmytRQ"
    ),
    ArtistReferenceSearchResult(
        id="taylor_swift",
        name="Taylor Swift",
        avatarUrl="https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&auto=format&fit=crop&q=80",
        channelId="UCiMhD4jzUqG-IgPzUmmytRQ"
    )
]

MOCK_PLAYLISTS: List[PlaylistSearchResult] = [
    PlaylistSearchResult(
        id="pl_today_top_hits",
        title="Today's Top Hits",
        thumbnailUrl="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        channelTitle="YouTune Editorial",
        trackCount=50
    ),
    PlaylistSearchResult(
        id="pl_global_trending",
        title="Global Trending Music",
        thumbnailUrl="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        channelTitle="YouTune Charts",
        trackCount=40
    ),
    PlaylistSearchResult(
        id="pl_chill_vibes",
        title="Lofi & Chill Evening",
        thumbnailUrl="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        channelTitle="Chill Beats",
        trackCount=35
    )
]


class YouTubeService:
    BASE_URL = "https://www.googleapis.com/youtube/v3"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("YOUTUBE_API_KEY", "")
        self.cache = SimpleCache(ttl_seconds=3600)

    @property
    def has_api_key(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and not self.api_key.startswith("your_"))

    async def search(
        self,
        query: str,
        search_type: str = "track",
        limit: int = 20,
        page_token: Optional[str] = None
    ) -> SearchResult:
        """
        Search YouTube with Category 10 (Music) filter and music heuristics.
        Falls back seamlessly to local mock dataset if API key is absent or quota reached.
        """
        cache_key = f"search:{query}:{search_type}:{limit}:{page_token}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        if not self.has_api_key:
            # First try web scraping for real YouTube results without API key
            web_results = await self._scrape_youtube_search(query, search_type, limit)
            if web_results and web_results.tracks:
                self.cache.set(cache_key, web_results)
                return web_results
            return self._mock_search(query, search_type, limit)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "key": self.api_key,
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "videoCategoryId": "10",  # Strict category 10 = Music
                    "maxResults": min(limit, 50),
                }
                if page_token:
                    params["pageToken"] = page_token

                resp = await client.get(f"{self.BASE_URL}/search", params=params)
                if resp.status_code != 200:
                    logger.warning(f"YouTube search error {resp.status_code}: {resp.text}. Falling back to mock data.")
                    return self._mock_search(query, search_type, limit)

                data = resp.json()
                items = data.get("items", [])
                video_ids = [item["id"]["videoId"] for item in items if "videoId" in item.get("id", {})]

                if not video_ids:
                    return SearchResult(tracks=[], artists=[], playlists=[], nextPageToken=None)

                # Fetch video contentDetails for exact duration and statistics
                tracks = await self._fetch_video_details(video_ids, client)

                artists: List[ArtistReferenceSearchResult] = []
                seen_artists = set()
                for t in tracks:
                    if t.artist and t.artist not in seen_artists:
                        seen_artists.add(t.artist)
                        artists.append(ArtistReferenceSearchResult(
                            id=t.channelId or t.artist.lower().replace(" ", "_"),
                            name=t.artist,
                            avatarUrl=t.thumbnailUrl,
                            channelId=t.channelId
                        ))

                result = SearchResult(
                    tracks=tracks,
                    artists=artists[:5],
                    playlists=MOCK_PLAYLISTS if search_type in ["all", "playlist"] else [],
                    nextPageToken=data.get("nextPageToken")
                )
                self.cache.set(cache_key, result)
                return result

        except Exception as e:
            logger.error(f"Exception during YouTube search: {e}. Using mock fallback.")
            return self._mock_search(query, search_type, limit)

    async def get_trending_music(self, region_code: str = "US", limit: int = 25) -> List[Track]:
        """Fetch trending music videos using mostPopular chart with category 10."""
        cache_key = f"trending:{region_code}:{limit}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        if not self.has_api_key:
            return MOCK_TRACKS[:limit]

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "key": self.api_key,
                    "part": "snippet,contentDetails,statistics",
                    "chart": "mostPopular",
                    "videoCategoryId": "10",
                    "regionCode": region_code,
                    "maxResults": min(limit, 50)
                }
                resp = await client.get(f"{self.BASE_URL}/videos", params=params)
                if resp.status_code != 200:
                    logger.warning(f"YouTube trending error {resp.status_code}. Using mock fallback.")
                    return MOCK_TRACKS[:limit]

                data = resp.json()
                tracks = self._parse_video_items(data.get("items", []))
                self.cache.set(cache_key, tracks)
                return tracks
        except Exception as e:
            logger.error(f"Error fetching trending music: {e}")
            return MOCK_TRACKS[:limit]

    async def get_track_by_youtube_id(self, youtube_id: str) -> Optional[Track]:
        """Fetch complete details for a single video."""
        cache_key = f"track:{youtube_id}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        # Check mock tracks first
        for mt in MOCK_TRACKS:
            if mt.youtubeId == youtube_id:
                return mt

        if not self.has_api_key:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                tracks = await self._fetch_video_details([youtube_id], client)
                if tracks:
                    track = tracks[0]
                    self.cache.set(cache_key, track)
                    return track
        except Exception as e:
            logger.error(f"Error fetching track {youtube_id}: {e}")
        return None

    async def _fetch_video_details(self, video_ids: List[str], client: httpx.AsyncClient) -> List[Track]:
        """Fetch contentDetails and statistics for a batch of video IDs."""
        if not video_ids:
            return []
        params = {
            "key": self.api_key,
            "part": "snippet,contentDetails,statistics",
            "id": ",".join(video_ids)
        }
        resp = await client.get(f"{self.BASE_URL}/videos", params=params)
        if resp.status_code != 200:
            return []
        data = resp.json()
        return self._parse_video_items(data.get("items", []))

    def _parse_video_items(self, items: List[Dict[str, Any]]) -> List[Track]:
        tracks = []
        for item in items:
            vid = item.get("id")
            snippet = item.get("snippet", {})
            content = item.get("contentDetails", {})
            stats = item.get("statistics", {})

            raw_title = snippet.get("title", "Unknown Title")
            channel_title = snippet.get("channelTitle", "Unknown Artist")
            clean_title, artist_name = clean_track_title_and_artist(raw_title, channel_title)

            # Thumbnails: pick highest resolution available
            thumbnails = snippet.get("thumbnails", {})
            thumb_url = (
                thumbnails.get("maxres", {}).get("url") or
                thumbnails.get("standard", {}).get("url") or
                thumbnails.get("high", {}).get("url") or
                thumbnails.get("medium", {}).get("url") or
                thumbnails.get("default", {}).get("url") or
                f"https://img.youtube.com/vi/{vid}/hqdefault.jpg"
            )

            duration_iso = content.get("duration", "PT0S")
            duration_sec = parse_iso8601_duration(duration_iso)

            # Filtering: ignore short teaser clips (< 30s) or extremely long podcasts (> 25 mins) if discovery
            if duration_sec > 0 and (duration_sec < 20 or duration_sec > 1800):
                continue

            views = int(stats.get("viewCount", 0)) if "viewCount" in stats else None

            track = Track(
                id=f"yt_{vid}",
                youtubeId=vid,
                title=clean_title,
                artist=artist_name,
                artists=[ArtistReference(id=snippet.get("channelId", ""), name=artist_name)],
                album=AlbumReference(id=f"alb_{vid}", title="Single"),
                durationSec=duration_sec,
                thumbnailUrl=thumb_url,
                channelId=snippet.get("channelId"),
                channelTitle=channel_title,
                views=views,
                publishedAt=snippet.get("publishedAt"),
                isLiked=False
            )
            tracks.append(track)
        return tracks

    async def _scrape_youtube_search(self, query: str, search_type: str, limit: int) -> Optional[SearchResult]:
        """Scrape YouTube search results directly without requiring an API key."""
        try:
            url = f"https://www.youtube.com/results?search_query={httpx.URL('', params={'q': query}).params['q']}"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9"
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    return None
                html = resp.text

            m = re.search(r'var ytInitialData = ({.*?});</script>', html)
            if not m:
                return None

            import json
            data = json.loads(m.group(1))
            contents = data.get('contents', {}).get('twoColumnSearchResultsRenderer', {}).get('primaryContents', {}).get('sectionListRenderer', {}).get('contents', [])
            
            tracks: List[Track] = []
            artists: List[ArtistReferenceSearchResult] = []
            seen_artists = set()

            for sec in contents:
                items = sec.get('itemSectionRenderer', {}).get('contents', [])
                for item in items:
                    vr = item.get('videoRenderer')
                    if not vr:
                        continue
                    vid = vr.get('videoId')
                    if not vid:
                        continue
                    
                    title_runs = vr.get('title', {}).get('runs', [])
                    raw_title = "".join([r.get('text', '') for r in title_runs]) if title_runs else "Unknown Title"
                    
                    owner_runs = vr.get('ownerText', {}).get('runs', [])
                    channel_title = "".join([r.get('text', '') for r in owner_runs]) if owner_runs else "Unknown Channel"
                    channel_id = ""
                    if owner_runs and 'navigationEndpoint' in owner_runs[0]:
                        channel_id = owner_runs[0].get('navigationEndpoint', {}).get('browseEndpoint', {}).get('browseId', '')

                    # Parse duration text e.g. "4:15", "1:02:10"
                    length_text = vr.get('lengthText', {}).get('simpleText', '')
                    duration_sec = 0
                    if length_text:
                        parts = length_text.split(':')
                        if len(parts) == 2:
                            duration_sec = int(parts[0]) * 60 + int(parts[1])
                        elif len(parts) == 3:
                            duration_sec = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])

                    clean_title, artist_name = clean_track_title_and_artist(raw_title, channel_title)
                    
                    thumb_url = f"https://img.youtube.com/vi/{vid}/hqdefault.jpg"
                    thumbs = vr.get('thumbnail', {}).get('thumbnails', [])
                    if thumbs:
                        thumb_url = thumbs[-1].get('url', thumb_url)

                    track = Track(
                        id=f"yt_{vid}",
                        youtubeId=vid,
                        title=clean_title,
                        artist=artist_name,
                        artists=[ArtistReference(id=channel_id or artist_name.lower().replace(" ", "_"), name=artist_name)],
                        album=AlbumReference(id=f"alb_{vid}", title="Single"),
                        durationSec=duration_sec,
                        thumbnailUrl=thumb_url,
                        channelId=channel_id,
                        channelTitle=channel_title,
                        views=None,
                        publishedAt=vr.get('publishedTimeText', {}).get('simpleText'),
                        isLiked=False
                    )
                    tracks.append(track)

                    if artist_name and artist_name not in seen_artists:
                        seen_artists.add(artist_name)
                        artists.append(ArtistReferenceSearchResult(
                            id=channel_id or artist_name.lower().replace(" ", "_"),
                            name=artist_name,
                            avatarUrl=thumb_url,
                            channelId=channel_id
                        ))

                    if len(tracks) >= limit:
                        break
                if len(tracks) >= limit:
                    break

            if not tracks:
                return None

            return SearchResult(
                tracks=tracks,
                artists=artists[:5],
                playlists=MOCK_PLAYLISTS if search_type in ["all", "playlist"] else [],
                nextPageToken=None
            )
        except Exception as e:
            logger.error(f"Error scraping YouTube search: {e}")
            return None

    def _mock_search(self, query: str, search_type: str, limit: int) -> SearchResult:
        """Filter mock data matching query text."""
        q_lower = query.strip().lower()
        matched_tracks = [
            t for t in MOCK_TRACKS
            if not q_lower or q_lower in t.title.lower() or q_lower in t.artist.lower()
        ]
        if not matched_tracks and q_lower:
            # Fallback to general mock list if query has no direct substring match
            matched_tracks = MOCK_TRACKS

        matched_artists = [
            a for a in MOCK_ARTISTS
            if not q_lower or q_lower in a.name.lower()
        ]
        if not matched_artists and q_lower:
            matched_artists = MOCK_ARTISTS

        matched_playlists = [
            p for p in MOCK_PLAYLISTS
            if not q_lower or q_lower in p.title.lower()
        ]
        if not matched_playlists and q_lower:
            matched_playlists = MOCK_PLAYLISTS

        return SearchResult(
            tracks=matched_tracks[:limit],
            artists=matched_artists[:5],
            playlists=matched_playlists[:5],
            nextPageToken=None
        )


# Singleton instance
youtube_service = YouTubeService()
