import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, Flame, Compass, Heart, Radio, Disc, History, Music2 } from 'lucide-react';
import { Track, Playlist, GenreCategory } from '../types/music';
import { ClientMusicService } from '../services/clientMusicService';
import { PersonalDiscoveryEngine } from '../services/discoveryEngine';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useLibraryStore } from '../stores/useLibraryStore';
import { MusicCard } from '../components/common/MusicCard';
import { TrackRow } from '../components/common/TrackRow';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { playTrack } = usePlayerStore();
  const { playlists } = useLibraryStore();

  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [adaptiveSections, setAdaptiveSections] = useState<{ title: string; subtitle: string; artists: string[] }[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const recent = PersonalDiscoveryEngine.getRecentlyPlayed();
        setRecentlyPlayed(recent);

        const sections = PersonalDiscoveryEngine.getAdaptiveSections();
        setAdaptiveSections(sections);

        // Fetch curated trending for the day
        const seedQuery = recent.length > 0 ? `${recent[0].artist} songs` : 'telugu hits trending';
        const res = await ClientMusicService.search(seedQuery);
        setTrendingTracks(res.tracks);
      } catch (err) {
        console.error('Failed to load home feed', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Hero tracks
  const heroTracks = trendingTracks.length > 0 ? trendingTracks : recentlyPlayed;

  return (
    <div className="space-y-10 animate-in fade-in duration-300 pb-16">
      {/* Top Banner Greeting */}
      <div className="relative rounded-2xl p-8 bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-black border border-emerald-500/20 shadow-2xl overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spotify-green/20 text-spotify-green text-xs font-semibold mb-3 border border-spotify-green/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pure HTML5 Audio • Mobile Lock Screen Supported</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
            {getGreeting()}
          </h1>
          <p className="text-spotify-subtext text-sm md:text-base leading-relaxed mb-6">
            Instant background playback on mobile, lock screen audio controls, and an adaptive taste feed that evolves every day you listen.
          </p>
          {heroTracks.length > 0 && (
            <button
              onClick={() => playTrack(heroTracks[0], heroTracks)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-spotify-green hover:bg-spotify-green-light text-black font-bold rounded-full transition-transform hover:scale-105 shadow-lg"
            >
              <Play className="w-5 h-5 fill-black" />
              Play Daily Recommendation
            </button>
          )}
        </div>
      </div>

      {/* Recently Played Section (Dynamic Client-Side Daily Tracking) */}
      {recentlyPlayed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Jump Back In • Recently Played</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyPlayed.slice(0, 6).map((track) => (
              <MusicCard
                key={track.id}
                title={track.title}
                subtitle={track.artist}
                imageUrl={track.thumbnailUrl}
                onPlay={() => playTrack(track, recentlyPlayed)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Adaptive Personalized Discovery Row */}
      {adaptiveSections.map((sec, idx) => (
        <div key={idx} className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">{sec.title}</h2>
            <p className="text-xs text-spotify-subtext mt-0.5">{sec.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {trendingTracks.slice(idx * 6, (idx + 1) * 6).map((track) => (
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
      ))}

      {/* Popular Music Right Now Tracklist */}
      {heroTracks.length > 0 && (
        <div className="bg-[#181818]/50 p-4 rounded-xl border border-neutral-800">
          <h2 className="text-lg font-bold text-white mb-3">Popular Music Today</h2>
          <div className="space-y-1">
            {heroTracks.slice(0, 8).map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i}
                queueContext={heroTracks}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
