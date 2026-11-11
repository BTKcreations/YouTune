import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Sparkles, Music, Disc } from 'lucide-react';
import { GenreCategory, Track } from '../types/music';
import { api } from '../services/api';
import { usePlayerStore } from '../stores/usePlayerStore';
import { TrackRow } from '../components/common/TrackRow';
import { MusicCard } from '../components/common/MusicCard';

export const GenrePage: React.FC = () => {
  const { genreId } = useParams<{ genreId: string }>();
  const navigate = useNavigate();
  const { playTrack } = usePlayerStore();

  const [genre, setGenre] = useState<GenreCategory | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGenreData() {
      if (!genreId) return;
      setLoading(true);
      try {
        const data = await api.getGenreDetails(genreId);
        setGenre(data.genre);
        setTracks(data.tracks);
      } catch (err) {
        console.error('Failed to load genre data', err);
      } finally {
        setLoading(false);
      }
    }
    loadGenreData();
  }, [genreId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-spotify-subtext">
          <Disc className="w-8 h-8 animate-spin text-spotify-green" />
          <span className="text-sm">Loading curated tracks...</span>
        </div>
      </div>
    );
  }

  const headerColor = genre?.color || '#1E3264';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-spotify-subtext hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero Header */}
      <div
        className="relative rounded-2xl p-8 shadow-2xl overflow-hidden border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${headerColor}99 0%, #121212 100%)`,
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6">
          <div
            className="w-40 h-40 rounded-xl shadow-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: headerColor }}
          >
            {genre?.imageUrl ? (
              <img
                src={genre.imageUrl}
                alt={genre.title}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Music className="w-16 h-16 text-white/80" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-spotify-green" />
              <span>Genre & Mood Category</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
              {genre?.title}
            </h1>
            <p className="text-sm text-gray-300 max-w-xl mb-4">
              {genre?.description ||
                `Discover top songs, trending music videos, and emerging hits in ${genre?.title}.`}
            </p>
            {tracks.length > 0 && (
              <button
                onClick={() => playTrack(tracks[0], tracks)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-spotify-green hover:bg-spotify-green-light text-black font-bold rounded-full transition-transform hover:scale-105 shadow-xl"
              >
                <Play className="w-5 h-5 fill-black" />
                Play All ({tracks.length} tracks)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Featured Grid */}
      {tracks.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Featured in {genre?.title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tracks.slice(0, 6).map((track) => (
              <MusicCard
                key={track.id}
                title={track.title}
                subtitle={track.artist}
                imageUrl={track.thumbnailUrl}
                onPlay={() => playTrack(track, tracks)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Track List */}
      <div className="bg-[#181818]/60 p-4 rounded-xl border border-neutral-800">
        <h2 className="text-lg font-bold text-white mb-3">All Tracks</h2>
        <div className="space-y-1">
          {tracks.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i}
              queueContext={tracks}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
