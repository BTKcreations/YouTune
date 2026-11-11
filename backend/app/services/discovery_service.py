"""
Discovery Service for YouTune.

Provides:
- Curated genres & moods (Pop, Rock, Hip-Hop, Electronic, R&B, Indie, Jazz, Classical, Chill, Workout, etc.)
- Trending music charts by region and genre
- Related artist recommendations based on user history, tags, and YouTube video related queries
- Home feed personalized sections generator (Recently Played, Top Picks for You, Trending Today, Mood Boosters, Recommended Artists)
"""

import logging
from typing import List, Dict, Any, Optional
from app.schemas.music import Track, ArtistReference, AlbumReference
from app.schemas.discovery import GenreCategory, TrendingChart, RelatedArtist, HomeFeedSection, HomeFeedResponse
from app.services.youtube_service import youtube_service, MOCK_TRACKS, MOCK_ARTISTS

logger = logging.getLogger(__name__)

CURATED_GENRES: List[GenreCategory] = [
    GenreCategory(
        id="pop",
        title="Pop",
        color="#E1306C",
        imageUrl="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        searchQuery="top pop music hits",
        description="The hottest pop sensations, chart toppers, and viral global hits."
    ),
    GenreCategory(
        id="rock",
        title="Rock",
        color="#B91C1C",
        imageUrl="https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80",
        searchQuery="classic rock and modern rock hits",
        description="Electrifying guitars, iconic rock anthems, and modern alternative rock."
    ),
    GenreCategory(
        id="hip-hop",
        title="Hip-Hop & Rap",
        color="#D97706",
        imageUrl="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
        searchQuery="hip hop rap top tracks",
        description="Fresh beats, lyrical masters, trap vibes, and boom bap classics."
    ),
    GenreCategory(
        id="electronic",
        title="Electronic / Dance",
        color="#4338CA",
        imageUrl="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
        searchQuery="electronic edm dance music festival",
        description="Club energy, deep house, EDM anthems, and melodic techno."
    ),
    GenreCategory(
        id="r-and-b",
        title="R&B & Soul",
        color="#7C3AED",
        imageUrl="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80",
        searchQuery="r&b soul smooth groove",
        description="Velvet vocals, heartfelt grooves, and late-night soulful melodies."
    ),
    GenreCategory(
        id="indie",
        title="Indie & Alternative",
        color="#059669",
        imageUrl="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
        searchQuery="indie alternative chill music",
        description="Fresh independent voices, intimate acoustic, and dreamy soundscapes."
    ),
    GenreCategory(
        id="jazz",
        title="Jazz & Blues",
        color="#B45309",
        imageUrl="https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80",
        searchQuery="jazz cafe smooth blues",
        description="Timeless improvisation, smoky horn solos, and sophisticated lounge chords."
    ),
    GenreCategory(
        id="classical",
        title="Classical & Focus",
        color="#0284C7",
        imageUrl="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        searchQuery="classical piano orchestra focus study",
        description="Masterful symphonies, serene piano sonatas, and deep focus accompaniment."
    ),
    GenreCategory(
        id="chill",
        title="Chill & Lofi",
        color="#0D9488",
        imageUrl="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        searchQuery="lofi hip hop chill beats study relax",
        description="Soothing beats to relax, study, unwind, and sleep to."
    ),
    GenreCategory(
        id="workout",
        title="Workout & Energy",
        color="#EA580C",
        imageUrl="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80",
        searchQuery="high energy workout gym pump motivation music",
        description="High-BPM adrenaline fuel to push through your hardest training sessions."
    )
]

# Genre-specific track curated mapping to supplement search
GENRE_SEED_TRACKS: Dict[str, List[Track]] = {
    "pop": [
        Track(
            id="yt_4NRXx6U8ABQ",
            youtubeId="4NRXx6U8ABQ",
            title="Blinding Lights",
            artist="The Weeknd",
            artists=[ArtistReference(id="the_weeknd", name="The Weeknd")],
            album=AlbumReference(id="after_hours", title="After Hours"),
            durationSec=260,
            thumbnailUrl="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80",
            channelTitle="The Weeknd",
            views=790000000
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
            channelTitle="Ed Sheeran",
            views=6000000000
        ),
        Track(
            id="yt_nfWlot6h_JM",
            youtubeId="nfWlot6h_JM",
            title="Shake It Off",
            artist="Taylor Swift",
            artists=[ArtistReference(id="taylor_swift", name="Taylor Swift")],
            album=AlbumReference(id="1989", title="1989"),
            durationSec=242,
            thumbnailUrl="https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&auto=format&fit=crop&q=80",
            channelTitle="Taylor Swift",
            views=3300000000
        )
    ],
    "rock": [
        Track(
            id="yt_fJ9rUzIMcZQ",
            youtubeId="fJ9rUzIMcZQ",
            title="Bohemian Rhapsody",
            artist="Queen",
            artists=[ArtistReference(id="queen", name="Queen")],
            album=AlbumReference(id="a_night_at_the_opera", title="A Night at the Opera"),
            durationSec=359,
            thumbnailUrl="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
            channelTitle="Queen Official",
            views=1700000000
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
            channelTitle="OneRepublic",
            views=3700000000
        )
    ],
    "chill": [
        Track(
            id="yt_hT_nvWreIhg",
            youtubeId="hT_nvWreIhg",
            title="Counting Stars (Acoustic)",
            artist="OneRepublic",
            artists=[ArtistReference(id="onerepublic", name="OneRepublic")],
            album=AlbumReference(id="native_acoustic", title="Native (Acoustic)"),
            durationSec=273,
            thumbnailUrl="https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&auto=format&fit=crop&q=80",
            channelTitle="OneRepublic",
            views=50000000
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
            channelTitle="Ed Sheeran",
            views=3600000000
        )
    ]
}

# Curated related artist clusters
ARTIST_CLUSTERS: Dict[str, List[str]] = {
    "the weeknd": ["Dua Lipa", "Bruno Mars", "Post Malone", "Ariana Grande", "Kendrick Lamar"],
    "ed sheeran": ["Shawn Mendes", "Taylor Swift", "James Arthur", "Sam Smith", "Lewis Capaldi"],
    "queen": ["Led Zeppelin", "The Beatles", "David Bowie", "Pink Floyd", "Elton John"],
    "taylor swift": ["Olivia Rodrigo", "Selena Gomez", "Katy Perry", "Billie Eilish", "Lorde"],
    "rick astley": ["Michael Jackson", "George Michael", "Wham!", "A-ha", "Tears For Fears"],
    "onerepublic": ["Imagine Dragons", "Coldplay", "Maroon 5", "The Script", "Bastille"],
    "maroon 5": ["Bruno Mars", "Justin Timberlake", "OneRepublic", "Charlie Puth", "Shawn Mendes"],
    "luis fonsi": ["Daddy Yankee", "J Balvin", "Bad Bunny", "Maluma", "Ozuna"]
}


class DiscoveryService:
    def __init__(self):
        pass

    def get_curated_genres(self) -> List[GenreCategory]:
        """Return all supported curated music genres and moods."""
        return CURATED_GENRES

    def get_genre_by_id(self, genre_id: str) -> Optional[GenreCategory]:
        for g in CURATED_GENRES:
            if g.id.lower() == genre_id.lower():
                return g
        return None

    async def get_genre_tracks(self, genre_id: str, limit: int = 20) -> List[Track]:
        """Get tracks for a specific genre using search or curated seed data."""
        genre = self.get_genre_by_id(genre_id)
        query = genre.searchQuery if genre else f"{genre_id} music hits"

        search_res = await youtube_service.search(query=query, search_type="track", limit=limit)
        tracks = search_res.tracks

        # Merge with curated seeds if available to guarantee rich results
        gid = genre_id.lower()
        if gid in GENRE_SEED_TRACKS:
            seed_ids = {t.youtubeId for t in GENRE_SEED_TRACKS[gid]}
            filtered_search = [t for t in tracks if t.youtubeId not in seed_ids]
            tracks = GENRE_SEED_TRACKS[gid] + filtered_search

        return tracks[:limit]

    async def get_trending_chart(self, region_code: str = "US", genre: Optional[str] = None, limit: int = 25) -> TrendingChart:
        """Fetch trending music charts by region and optional genre."""
        if genre and genre.lower() != "all":
            tracks = await self.get_genre_tracks(genre, limit=limit)
        else:
            tracks = await youtube_service.get_trending_music(region_code=region_code, limit=limit)

        return TrendingChart(
            region=region_code.upper(),
            genre=genre or "All",
            tracks=tracks
        )

    async def get_related_artists(self, artist_name: str, limit: int = 6) -> List[RelatedArtist]:
        """
        Derive related artist recommendations based on artist name, clusters,
        and YouTube search lookups.
        """
        artist_key = artist_name.strip().lower()
        related_names = []

        for key, relatives in ARTIST_CLUSTERS.items():
            if key in artist_key or artist_key in key:
                related_names.extend(relatives)
                break

        if not related_names:
            # Fallback related cluster
            related_names = ["The Weeknd", "Ed Sheeran", "Taylor Swift", "Queen", "Dua Lipa", "Post Malone"]

        # Deduplicate and remove original artist
        related_names = [n for n in dict.fromkeys(related_names) if n.lower() != artist_key][:limit]

        results: List[RelatedArtist] = []
        for name in related_names:
            # Fetch sample top tracks for this artist
            res = await youtube_service.search(query=f"{name} top songs", search_type="track", limit=3)
            avatar_url = res.artists[0].avatarUrl if res.artists and res.artists[0].avatarUrl else (
                res.tracks[0].thumbnailUrl if res.tracks else "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80"
            )
            results.append(RelatedArtist(
                id=name.lower().replace(" ", "_"),
                name=name,
                avatarUrl=avatar_url,
                subscribersCount=12000000,
                topTracks=res.tracks,
                matchScore=0.95
            ))

        return results

    async def generate_home_feed(
        self,
        recent_history: Optional[List[Track]] = None,
        liked_tracks: Optional[List[Track]] = None,
        user_region: str = "US"
    ) -> HomeFeedResponse:
        """
        Generate rich personalized sections for the Home screen:
        1. Recently Played (if user history exists, otherwise Popular Right Now)
        2. Top Picks for You (personalized based on recent artists / likes)
        3. Trending Today (global or regional chart)
        4. Mood Boosters & Curated Genres
        5. Spotlight Artists
        """
        sections: List[HomeFeedSection] = []

        # 1. Recently Played / Quick Play
        if recent_history and len(recent_history) > 0:
            sections.append(HomeFeedSection(
                id="recently-played",
                title="Recently Played",
                description="Jump right back in where you left off",
                type="tracks",
                items=recent_history[:8]
            ))
        else:
            # Welcome Quick Picks
            popular = await youtube_service.get_trending_music(region_code=user_region, limit=6)
            sections.append(HomeFeedSection(
                id="quick-picks",
                title="Quick Picks",
                description="Get started with these popular hits",
                type="tracks",
                items=popular
            ))

        # 2. Personalized "Top Picks For You"
        base_artist = None
        if recent_history and len(recent_history) > 0:
            base_artist = recent_history[0].artist
        elif liked_tracks and len(liked_tracks) > 0:
            base_artist = liked_tracks[0].artist

        if base_artist:
            picks_res = await youtube_service.search(query=f"More like {base_artist}", limit=8)
            picks = picks_res.tracks
            desc = f"Inspired by your listening of {base_artist}"
        else:
            picks = MOCK_TRACKS[:8]
            desc = "Handcrafted selection of current global favorites"

        sections.append(HomeFeedSection(
            id="top-picks",
            title="Top Picks for You",
            description=desc,
            type="tracks",
            items=picks
        ))

        # 3. Trending Today
        trending_tracks = await youtube_service.get_trending_music(region_code=user_region, limit=8)
        sections.append(HomeFeedSection(
            id="trending-today",
            title="Trending Today",
            description=f"What's viral in {user_region} right now",
            type="tracks",
            items=trending_tracks
        ))

        # 4. Explore by Mood & Genre
        sections.append(HomeFeedSection(
            id="mood-boosters",
            title="Explore Genres & Moods",
            description="Find the perfect sound for whatever you are feeling",
            type="genres",
            items=CURATED_GENRES[:6]
        ))

        # 5. Featured Artists Spotlight
        featured_artists = []
        for ma in MOCK_ARTISTS[:5]:
            featured_artists.append({
                "id": ma.id,
                "name": ma.name,
                "avatarUrl": ma.avatarUrl,
                "role": "Featured Artist"
            })
        sections.append(HomeFeedSection(
            id="featured-artists",
            title="Featured Artists",
            description="Artists setting the trends today",
            type="artists",
            items=featured_artists
        ))

        return HomeFeedResponse(sections=sections)


discovery_service = DiscoveryService()
