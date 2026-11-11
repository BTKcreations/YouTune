import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Check, Plus, Users } from 'lucide-react';
import { api } from '../services/api';
import { Artist } from '../types/music';
import { TrackRow } from '../components/common/TrackRow';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useLibraryStore } from '../stores/useLibraryStore';

export const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { playTrack } = usePlayerStore();
  const { isArtistFollowed, toggleFollowArtist } = useLibraryStore();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArtist() {
      if (!id) return;
      try {
        const data = await api.getArtist(id);
        setArtist(data);
      } finally {
        setLoading(false);
      }
    }
    loadArtist();
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-spotify-subtext">Loading artist profile...</div>;
  }

  if (!artist) {
    return <div className="text-center py-20 text-spotify-subtext">Artist not found.</div>;
  }

  const followed = isArtistFollowed(artist.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div
        className="relative -mx-6 -mt-6 h-64 md:h-80 flex flex-col justify-end p-8 bg-cover bg-center border-b border-neutral-800"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), #121212), url(${
            artist.bannerUrl || artist.avatarUrl
          })`,
        }}
      >
        <span className="text-xs font-semibold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-spotify-green" /> Verified Artist
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
          {artist.name}
        </h1>
        {artist.monthlyListeners && (
          <p className="text-sm text-spotify-subtext mt-2 font-medium">
            {artist.monthlyListeners.toLocaleString()} monthly listeners
          </p>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4">
        {artist.topTracks && artist.topTracks.length > 0 && (
          <button
            onClick={() => playTrack(artist.topTracks[0], artist.topTracks)}
            className="w-14 h-14 rounded-full bg-spotify-green hover:bg-spotify-green-light flex items-center justify-center text-black shadow-xl hover:scale-105 transition-all"
          >
            <Play className="w-6 h-6 fill-black translate-x-0.5" />
          </button>
        )}

        <button
          onClick={() => toggleFollowArtist(artist)}
          className={`px-6 py-2 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${
            followed
              ? 'border-spotify-green text-spotify-green hover:border-red-500 hover:text-red-500'
              : 'border-neutral-500 text-white hover:border-white'
          }`}
        >
          {followed ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Top Tracks */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Popular</h2>
        <div className="bg-[#181818]/40 rounded-xl p-2 border border-neutral-800 space-y-1">
          {artist.topTracks.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i}
              queueContext={artist.topTracks}
            />
          ))}
        </div>
      </div>

      {/* About */}
      {artist.bio && (
        <div className="bg-[#181818]/60 p-6 rounded-xl border border-neutral-800 max-w-2xl space-y-2">
          <h3 className="font-bold text-white text-base">About</h3>
          <p className="text-sm text-spotify-subtext leading-relaxed">{artist.bio}</p>
        </div>
      )}
    </div>
  );
};
