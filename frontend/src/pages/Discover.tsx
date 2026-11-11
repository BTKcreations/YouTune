import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Sparkles, TrendingUp, Radio, UserCheck, Flame, Disc } from 'lucide-react';
import { GenreCategory, Track, Artist } from '../types/music';
import { api, RelatedArtistData } from '../services/api';
import { usePlayerStore } from '../stores/usePlayerStore';
import { MusicCard } from '../components/common/MusicCard';
import { TrackRow } from '../components/common/TrackRow';

const REGIONS = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'GLOBAL', label: 'Global' },
  { code: 'JP', label: 'Japan' },
  { code: 'KR', label: 'South Korea' },
  { code: 'BR', label: 'Brazil' },
];

export const Discover: React.FC = () => {
  const navigate = useNavigate();
  const { playTrack } = usePlayerStore();

  const [genres, setGenres] = useState<GenreCategory[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('US');
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [relatedArtists, setRelatedArtists] = useState<RelatedArtistData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDiscoveryData() {
      setLoading(true);
      try {
        const [genresData, trendingData, artistsData] = await Promise.all([
          api.getGenres(),
          api.getTrendingTracks(selectedRegion),
          api.getRelatedArtists('The Weeknd'),
        ]);
        setGenres(genresData);
        setTrendingTracks(trendingData);
        setRelatedArtists(artistsData);
      } catch (e) {
        console.error('Failed loading discovery', e);
      } finally {
        setLoading(false);
      }
    }
    loadDiscoveryData();
  }, [selectedRegion]);

  return (
    <div className="space-y-10 animate-in fade-in duration-300 pb-16">
      {/* Header Banner */}
      <div className="relative rounded-2xl p-8 bg-gradient-to-r from-purple-900/60 via-indigo-950 to-black border border-purple-500/20 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-3 border border-purple-500/30">
          <Compass className="w-3.5 h-3.5" />
          <span>YouTune Music Radar</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
          Discover & Explore
        </h1>
        <p className="text-spotify-subtext text-sm md:text-base max-w-xl">
          Explore curated genres, regional trending charts, and find fresh artist connections powered by YouTube data.
        </p>
      </div>

      {/* Regional Trending Charts */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-white">Trending Charts by Region</h2>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {REGIONS.map((r) => (
              <button
                key={r.code}
                onClick={() => setSelectedRegion(r.code)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedRegion === r.code
                    ? 'bg-spotify-green text-black font-bold shadow'
                    : 'bg-[#242424] text-gray-300 hover:text-white hover:bg-[#323232]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {trendingTracks.slice(0, 6).map((track) => (
            <MusicCard
              key={track.id}
              title={track.title}
              subtitle={track.artist}
              imageUrl={track.thumbnailUrl}
              onPlay={() => playTrack(track, trendingTracks)}
            />
          ))}
        </div>
      </div>

      {/* Curated Genres & Moods Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Curated Genres & Moods</h2>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="text-xs font-semibold text-spotify-subtext hover:text-white transition-colors"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {genres.map((g) => (
            <div
              key={g.id}
              onClick={() => navigate(`/genre/${g.id}`)}
              className="group relative h-36 rounded-xl p-4 overflow-hidden cursor-pointer shadow-lg transition-transform duration-300 hover:scale-105 select-none"
              style={{ backgroundColor: g.color }}
            >
              <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-md">
                {g.title}
              </h3>
              <p className="text-[11px] text-white/80 line-clamp-2 mt-1">
                {g.searchQuery}
              </p>
              <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/10 rounded-full blur-lg group-hover:scale-125 transition-transform" />
            </div>
          ))}
        </div>
      </div>

      {/* Related Artist Spotlights */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Artist Spotlights & Connections</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {relatedArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => navigate(`/artist/${artist.id}`)}
              className="group bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition-all duration-300 cursor-pointer flex flex-col items-center text-center hover:shadow-xl"
            >
              <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-full bg-neutral-800 shadow-md">
                <img
                  src={
                    artist.avatarUrl ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'
                  }
                  alt={artist.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="font-semibold text-white text-sm truncate w-full mb-1">
                {artist.name}
              </h3>
              <span className="text-xs text-spotify-green font-medium">Artist</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Tracklist */}
      <div className="bg-[#181818]/50 p-4 rounded-xl border border-neutral-800">
        <h2 className="text-lg font-bold text-white mb-3">Top Tracks In Selected Region</h2>
        <div className="space-y-1">
          {trendingTracks.slice(0, 8).map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i}
              queueContext={trendingTracks}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
